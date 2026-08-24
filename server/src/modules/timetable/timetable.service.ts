import prisma from '../../prisma/client';

export interface CreateSlotInput {
  day: string;
  time: string;
  subject: string;
  faculty?: string;
  room?: string;
  facultyId?: string;
  roomId?: string; // Keep as alias for client compatibility
  classroomId?: string;
  groupLabel?: string;
  isPlaceholder?: boolean;
  periodId?: string;
  branch?: string; // Client fallback branch
}

// Normalize strings for matching
const normalizeName = (name: string) => {
  return name.replace(/\s+/g, ' ').trim().toLowerCase();
};

const extractSemesterNumber = (semStr: string) => {
  const match = semStr.match(/\d+/);
  return match ? match[0] : semStr;
};

// Helper to parse time strings like "09:00 - 10:00 AM" into startTime/endTime (24h format)
function parseTimeString(timeStr: string) {
  const match = timeStr.match(/^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    throw new Error(`Invalid time format: "${timeStr}"`);
  }
  
  const startHour = parseInt(match[1], 10);
  const startMin = match[2];
  const endHour = parseInt(match[3], 10);
  const endMin = match[4];
  const ampm = match[5].toUpperCase();
  
  let start24Hour = startHour;
  let end24Hour = endHour;
  
  if (ampm === 'PM') {
    if (startHour < 12) {
      if (startHour === 11 && endHour === 12) {
        start24Hour = 11;
        end24Hour = 12;
      } else {
        start24Hour += 12;
        end24Hour += 12;
      }
    } else {
      if (endHour < 12) {
        end24Hour += 12;
      }
    }
  } else {
    // AM
    if (startHour === 12) start24Hour = 0;
    if (endHour === 12) end24Hour = 0;
  }
  
  const pad = (num: number) => String(num).padStart(2, '0');
  
  return {
    startTime: `${pad(start24Hour)}:${startMin}`,
    endTime: `${pad(end24Hour)}:${endMin}`
  };
}

export const publishTimetable = async (collegeId: string, semester: string, slots: CreateSlotInput[]) => {
  // Resolve or create parent Timetable
  const branch = slots[0]?.branch || 'Information Technology';
  
  let timetable = await prisma.timetable.findFirst({
    where: { collegeId, semester, branch }
  });

  if (!timetable) {
    // Ensure default academic session exists
    let session = await prisma.academicSession.findFirst({
      where: { collegeId, name: '2026-2027' }
    });
    if (!session) {
      session = await prisma.academicSession.create({
        data: {
          name: '2026-2027',
          isCurrent: true,
          collegeId
        }
      });
    }

    timetable = await prisma.timetable.create({
      data: {
        name: `${branch} Semester ${semester} Timetable`,
        semester,
        branch,
        collegeId,
        academicSessionId: session.id,
        status: 'PUBLISHED'
      }
    });
  } else {
    await prisma.timetable.update({
      where: { id: timetable.id },
      data: { status: 'PUBLISHED' }
    });
  }

  // Delete existing slots for this parent timetable
  await prisma.timetableSlot.deleteMany({
    where: { timetableId: timetable.id },
  });

  // Fetch all faculty, classrooms, subjects, and departments matching collegeId
  const faculties = await prisma.faculty.findMany({ where: { collegeId } });
  const classrooms = await prisma.classroom.findMany({ where: { collegeId } });
  const subjects = await prisma.subject.findMany({ where: { collegeId } });
  const departments = await prisma.department.findMany({ where: { collegeId } });

  const createdSlots = [];
  
  // Extract all unique times to order periods chronologically
  const uniqueTimes = Array.from(new Set(slots.map(s => {
    try {
      return parseTimeString(s.time).startTime;
    } catch {
      return '';
    }
  }).filter(Boolean))).sort();

  const timeToOrder: Record<string, number> = {};
  uniqueTimes.forEach((time, index) => {
    timeToOrder[time] = index + 1;
  });

  const defaultDept = departments.find(d => normalizeName(d.name).includes('it') || normalizeName(d.name).includes('information technology'));
  const defaultDeptId = defaultDept ? defaultDept.id : (departments[0]?.id || '');

  for (const slot of slots) {
    // 1. Resolve Faculty (Strict normalized match or ID)
    let facultyId = slot.facultyId || null;
    if (!facultyId && slot.faculty) {
      const slotFacultyNormalized = normalizeName(slot.faculty);
      const matchedFaculty = faculties.find(f => {
        const fullName = normalizeName(`${f.firstName} ${f.lastName}`);
        return fullName === slotFacultyNormalized;
      });
      facultyId = matchedFaculty ? matchedFaculty.id : null;
    }

    // 2. Resolve Classroom (Auto-create or ID)
    let classroomId = slot.classroomId || slot.roomId || null;
    if (!classroomId && slot.room) {
      const roomName = slot.room.trim();
      let classroomRecord = classrooms.find(r => r.name.toLowerCase() === roomName.toLowerCase());
      if (!classroomRecord) {
        const isLab = roomName.toLowerCase().includes('lab');
        classroomRecord = await prisma.classroom.create({
          data: {
            name: roomName,
            type: isLab ? 'LAB' : 'CLASSROOM',
            capacity: isLab ? 30 : 60,
            collegeId
          }
        });
        classrooms.push(classroomRecord); // Add to local cache list
      }
      classroomId = classroomRecord.id;
    }

    // 3. Resolve Period (Direct connect if periodId is present, or fallback to time parsing)
    let periodRecord;
    if (slot.periodId) {
      periodRecord = { id: slot.periodId };
    } else {
      let parsedTime;
      try {
        parsedTime = parseTimeString(slot.time);
        const order = timeToOrder[parsedTime.startTime] || 1;
        periodRecord = await prisma.period.upsert({
          where: {
            collegeId_order: {
              collegeId,
              order
            }
          },
          update: {},
          create: {
            name: `Period ${order}`,
            order,
            startTime: parsedTime.startTime,
            endTime: parsedTime.endTime,
            collegeId
          }
        });
      } catch {
        // Fallback
      }
    }

    // 4. Resolve Subject (Find-or-create)
    let subjectId = null;
    if (slot.subject) {
      const normSubName = normalizeName(slot.subject);
      let subjectRecord = subjects.find(s => normalizeName(s.name) === normSubName);
      if (!subjectRecord) {
        const isLab = slot.subject.toLowerCase().includes('lab') || slot.subject.toLowerCase().includes('practical');
        const codePrefix = slot.subject.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
        const code = `${codePrefix}-${100 + subjects.length}`;
        
        subjectRecord = await prisma.subject.create({
          data: {
            name: slot.subject,
            code,
            semester: extractSemesterNumber(semester),
            credits: isLab ? 2 : 4,
            weeklyHours: isLab ? 2 : 4,
            type: isLab ? 'LAB' : 'CLASSROOM',
            departmentId: defaultDeptId,
            collegeId
          }
        });
        subjects.push(subjectRecord);
      }
      subjectId = subjectRecord.id;
    }

    // 5. Resolve Section (Find-or-create)
    let sectionId = null;
    const secName = slot.groupLabel || (slot as any).section || 'Section A';
    if (secName) {
      const semNum = extractSemesterNumber(semester);
      let sectionRecord = await prisma.section.findUnique({
        where: {
          collegeId_name_semester_departmentId: {
            collegeId,
            name: secName,
            semester: semNum,
            departmentId: defaultDeptId
          }
        }
      });
      if (!sectionRecord) {
        sectionRecord = await prisma.section.create({
          data: {
            name: secName,
            semester: semNum,
            departmentId: defaultDeptId,
            collegeId
          }
        });
      }
      sectionId = sectionRecord.id;
    }

    // Create slot record with new relation keys and parent timetableId
    const newSlot = await prisma.timetableSlot.create({
      data: {
        day: slot.day,
        subject: slot.subject,
        status: 'PUBLISHED',
        section: secName,
        facultyId,
        classroomId,
        subjectId,
        sectionId,
        collegeId,
        timetableId: timetable.id,
        periods: periodRecord ? { connect: { id: periodRecord.id } } : undefined
      }
    });
    createdSlots.push(newSlot);
  }

  return createdSlots;
};

export const getTimetable = async (collegeId: string, semester?: string) => {
  const where: any = { collegeId };
  if (semester) {
    where.timetableRelation = { semester };
  }

  const slots = await prisma.timetableSlot.findMany({
    where,
    include: {
      facultyRelation: true,
      classroomRelation: true,
      periods: true,
      sectionRelation: {
        include: {
          department: true
        }
      },
      subjectRelation: true,
      timetableRelation: true,
    },
    orderBy: [{ timetableRelation: { semester: 'asc' } }, { day: 'asc' }],
  });

  return slots.map(slot => {
    let timeStr = 'N/A';
    if (slot.periods.length > 0) {
      const p = slot.periods[0];
      const convertTo12h = (time24: string) => {
        const [hourStr, minStr] = time24.split(':');
        const hour = parseInt(hourStr, 10);
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        return `${String(hour12).padStart(2, '0')}:${minStr}`;
      };
      const start12 = convertTo12h(p.startTime);
      const end12 = convertTo12h(p.endTime);
      const endHour = parseInt(p.endTime.split(':')[0], 10);
      const ampm = endHour >= 12 ? 'PM' : 'AM';
      timeStr = `${start12} - ${end12} ${ampm}`;
    }

    const timetableSemester = slot.timetableRelation?.semester || 'N/A';
    const timetableBranch = slot.timetableRelation?.branch || 'Information Technology';

    return {
      id: slot.id,
      day: slot.day,
      semester: timetableSemester,
      branch: timetableBranch,
      status: slot.status,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
      groupLabel: slot.groupLabel,
      isPlaceholder: slot.isPlaceholder,
      facultyId: slot.facultyId,
      classroomId: slot.classroomId,
      roomId: slot.classroomId, // Backwards compatibility for UI
      timetableId: slot.timetableId,
      periodId: slot.periods?.[0]?.id || null,
      periods: slot.periods,
      type: slot.subjectRelation?.type || 'THEORY',
      
      // Relational resolved fields:
      subject: slot.subjectRelation ? slot.subjectRelation.name : slot.subject,
      section: slot.sectionRelation ? slot.sectionRelation.name : (slot.section || 'Section A'),
      
      // Mapped legacy fields for frontend compatibility:
      time: timeStr,
      faculty: slot.facultyRelation ? `${slot.facultyRelation.firstName} ${slot.facultyRelation.lastName}`.replace(/\s+/g, ' ').trim() : 'N/A',
      room: slot.classroomRelation ? slot.classroomRelation.name : 'N/A'
    };
  });
};

export interface ResolvedSlot {
  index: number;
  semester: string;
  day: string;
  time: string;
  subject: string;
  groupLabel: string | null;
  isPlaceholder: boolean;
  facultyId: string | null;
  facultyName: string;
  classroomId: string | null;
  roomName: string;
  periodIds: string[];
  periodNames: string[];
}

export interface ConflictDetail {
  type: "FACULTY_CLASH" | "ROOM_CLASH" | "STUDENT_CLASH";
  message: string;
  slotA: ResolvedSlot;
  slotB: any;
}

export const validateTimetable = async (collegeId: string, proposedSemester: string, proposedSlots: CreateSlotInput[]): Promise<ConflictDetail[]> => {
  const faculties = await prisma.faculty.findMany({ where: { collegeId } });
  const classrooms = await prisma.classroom.findMany({ where: { collegeId } });
  const periods = await prisma.period.findMany({ where: { collegeId } });

  // Load all existing slots from other semesters from the database matching this collegeId
  const databaseSlots = await prisma.timetableSlot.findMany({
    where: {
      collegeId,
      timetableRelation: { semester: { not: proposedSemester } }
    },
    include: {
      facultyRelation: true,
      classroomRelation: true,
      periods: true,
      timetableRelation: true
    }
  });

  const resolvedSlots: ResolvedSlot[] = [];

  for (let i = 0; i < proposedSlots.length; i++) {
    const s = proposedSlots[i];
    
    // Resolve Faculty: Use facultyId directly if passed, fallback to name-matching
    let facultyId = s.facultyId || null;
    let facultyName = s.faculty || "N/A";
    
    if (!facultyId && s.faculty) {
      const slotFacultyNormalized = normalizeName(s.faculty);
      const matchedFaculty = faculties.find(f => {
        const fullName = normalizeName(`${f.firstName} ${f.lastName}`);
        return fullName === slotFacultyNormalized;
      });
      if (matchedFaculty) {
        facultyId = matchedFaculty.id;
        facultyName = `${matchedFaculty.firstName} ${matchedFaculty.lastName}`;
      }
    } else if (facultyId) {
      const matchedFaculty = faculties.find(f => f.id === facultyId);
      if (matchedFaculty) {
        facultyName = `${matchedFaculty.firstName} ${matchedFaculty.lastName}`;
      }
    }

    // Resolve Classroom: Use classroomId directly if passed, fallback to name-matching
    let classroomId = s.classroomId || s.roomId || null;
    let roomName = s.room || "N/A";
    if (!classroomId && s.room) {
      const rTrim = s.room.trim();
      const classroomRecord = classrooms.find(r => r.name.toLowerCase() === rTrim.toLowerCase());
      if (classroomRecord) {
        classroomId = classroomRecord.id;
        roomName = classroomRecord.name;
      }
    } else if (classroomId) {
      const classroomRecord = classrooms.find(r => r.id === classroomId);
      if (classroomRecord) {
        roomName = classroomRecord.name;
      }
    }

    // Resolve Period
    let periodIds: string[] = [];
    let periodNames: string[] = [];
    try {
      const parsedTime = parseTimeString(s.time);
      const matchedPeriod = periods.find(p => p.startTime === parsedTime.startTime && p.endTime === parsedTime.endTime);
      if (matchedPeriod) {
        periodIds.push(matchedPeriod.id);
        periodNames.push(`${matchedPeriod.name} (${matchedPeriod.startTime}-${matchedPeriod.endTime})`);
      }
    } catch (err) {
      // ignore
    }

    resolvedSlots.push({
      index: i,
      semester: proposedSemester,
      day: s.day,
      time: s.time,
      subject: s.subject,
      groupLabel: s.groupLabel || (s as any).section || null,
      isPlaceholder: s.isPlaceholder || false,
      facultyId,
      facultyName,
      classroomId,
      roomName,
      periodIds,
      periodNames
    });
  }

  const conflicts: ConflictDetail[] = [];
  const hasOverlap = (arr1: string[], arr2: string[]) => arr1.some(id => arr2.includes(id));

  // Loop through each resolved proposed slot
  for (let i = 0; i < resolvedSlots.length; i++) {
    const slotA = resolvedSlots[i];

    // 1. Check against DB slots (Other Semesters)
    for (const slotB of databaseSlots) {
      const dbPeriodIds = slotB.periods.map(p => p.id);
      const slotBSemester = slotB.timetableRelation?.semester || 'N/A';
      
      if (slotA.day === slotB.day && hasOverlap(slotA.periodIds, dbPeriodIds)) {
        
        // A. Faculty Clash (Semester-agnostic, ignore null)
        if (slotA.facultyId && slotB.facultyId && slotA.facultyId === slotB.facultyId) {
          conflicts.push({
            type: "FACULTY_CLASH",
            message: `Faculty member "${slotA.facultyName}" is double-booked on ${slotA.day} at ${slotA.time} between proposed slot (${slotA.subject} in ${slotA.semester}) and existing database slot (${slotB.subject} in ${slotBSemester}).`,
            slotA,
            slotB: { id: slotB.id, semester: slotBSemester, subject: slotB.subject, facultyName: slotA.facultyName }
          });
        }

        // B. Classroom Clash (Semester-agnostic, ignore null)
        if (slotA.classroomId && slotB.classroomId && slotA.classroomId === slotB.classroomId) {
          conflicts.push({
            type: "ROOM_CLASH",
            message: `Classroom "${slotA.roomName}" is double-booked on ${slotA.day} at ${slotA.time} between proposed slot (${slotA.subject} in ${slotA.semester}) and existing database slot (${slotB.subject} in ${slotBSemester}).`,
            slotA,
            slotB: { id: slotB.id, semester: slotBSemester, subject: slotB.subject, roomName: slotA.roomName }
          });
        }
      }
    }

    // 2. Check against other proposed slots (Internal conflicts)
    for (let j = i + 1; j < resolvedSlots.length; j++) {
      const slotB = resolvedSlots[j];

      if (slotA.day === slotB.day && hasOverlap(slotA.periodIds, slotB.periodIds)) {
        
        // A. Faculty Clash (Internal, ignore null)
        if (slotA.facultyId && slotB.facultyId && slotA.facultyId === slotB.facultyId) {
          conflicts.push({
            type: "FACULTY_CLASH",
            message: `Faculty member "${slotA.facultyName}" is double-booked on ${slotA.day} at ${slotA.time} within the proposed batch (both ${slotA.subject} and ${slotB.subject} are assigned to them).`,
            slotA,
            slotB
          });
        }

        // B. Classroom Clash (Internal, ignore null)
        if (slotA.classroomId && slotB.classroomId && slotA.classroomId === slotB.classroomId) {
          conflicts.push({
            type: "ROOM_CLASH",
            message: `Classroom "${slotA.roomName}" is double-booked on ${slotA.day} at ${slotA.time} within the proposed batch (both ${slotA.subject} and ${slotB.subject} are assigned to this classroom).`,
            slotA,
            slotB
          });
        }

        // C. Student/Group Clash (Internal to proposed batch)
        if (slotA.semester === slotB.semester) {
          // If BOTH are placeholder electives, they are allowed to run concurrently!
          if (!(slotA.isPlaceholder && slotB.isPlaceholder)) {
            if (slotA.groupLabel === null || slotB.groupLabel === null || slotA.groupLabel === slotB.groupLabel) {
              conflicts.push({
                type: "STUDENT_CLASH",
                message: `Student clash in ${slotA.semester} on ${slotA.day} at ${slotA.time}: overlap between ${slotA.subject} (${slotA.groupLabel || "Full Class"}) and ${slotB.subject} (${slotB.groupLabel || "Full Class"}).`,
                slotA,
                slotB
              });
            }
          }
        }
      }
    }
  }

  return conflicts;
};

// ==========================================
//   PARENT TIMETABLES CRUD OPERATIONS
// ==========================================

export const listTimetables = async (collegeId: string) => {
  return prisma.timetable.findMany({
    where: { collegeId },
    include: {
      academicSession: true,
      _count: {
        select: { slots: true }
      }
    },
    orderBy: [{ semester: 'asc' }, { branch: 'asc' }]
  });
};

export const createTimetable = async (
  collegeId: string,
  data: {
    name: string;
    academicSessionId: string;
    semester: string;
    branch: string;
    status?: string;
  }
) => {
  // Enforce validation that session belongs to the college
  const session = await prisma.academicSession.findUnique({
    where: { id: data.academicSessionId }
  });
  if (!session || session.collegeId !== collegeId) {
    throw new Error('Academic Session not found or access denied');
  }

  return prisma.timetable.create({
    data: {
      name: data.name,
      academicSessionId: data.academicSessionId,
      semester: data.semester,
      branch: data.branch,
      status: data.status || 'DRAFT',
      collegeId
    },
    include: { academicSession: true }
  });
};

export const deleteTimetable = async (collegeId: string, id: string) => {
  const target = await prisma.timetable.findUnique({ where: { id } });
  if (!target || target.collegeId !== collegeId) {
    throw new Error('Timetable not found or access denied');
  }

  return prisma.timetable.delete({
    where: { id }
  });
};

// ==========================================
//   PERIODS CRUD OPERATIONS
// ==========================================

export const listPeriods = async (collegeId: string) => {
  return prisma.period.findMany({
    where: { collegeId },
    include: {
      _count: {
        select: { timetableSlots: true }
      }
    },
    orderBy: { order: 'asc' },
  });
};

export const updatePeriod = async (collegeId: string, id: string, startTime: string, endTime: string) => {
  // Verify period belongs to the tenant
  const target = await prisma.period.findUnique({ where: { id } });
  if (!target || target.collegeId !== collegeId) {
    throw new Error('Period not found or access denied');
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    throw new Error('Start time and end time must be in HH:MM 24-hour format');
  }

  if (startTime >= endTime) {
    throw new Error('Start time must be before end time');
  }

  // Check overlap with other periods in the same college
  const otherPeriods = await prisma.period.findMany({
    where: {
      collegeId,
      id: { not: id },
    },
  });

  for (const p of otherPeriods) {
    if (startTime < p.endTime && endTime > p.startTime) {
      throw new Error(`Time range overlaps with ${p.name} (${p.startTime} - ${p.endTime})`);
    }
  }

  return prisma.period.update({
    where: { id },
    data: { startTime, endTime },
  });
};

// ==========================================
//   SUBJECTS CRUD OPERATIONS
// ==========================================

export const listSubjects = async (collegeId: string) => {
  return prisma.subject.findMany({
    where: { collegeId },
    include: {
      department: true,
      _count: {
        select: { timetableSlots: true }
      }
    },
    orderBy: { name: 'asc' }
  });
};

export const createSubject = async (collegeId: string, data: {
  name: string;
  code: string;
  semester: string;
  credits: number;
  weeklyHours: number;
  type: string;
  departmentId: string;
}) => {
  return prisma.subject.create({
    data: {
      name: data.name,
      code: data.code,
      semester: data.semester,
      credits: Number(data.credits),
      weeklyHours: Number(data.weeklyHours),
      type: data.type || 'CLASSROOM',
      departmentId: data.departmentId,
      collegeId
    }
  });
};

export const updateSubject = async (
  collegeId: string,
  id: string,
  data: {
    name?: string;
    code?: string;
    semester?: string;
    credits?: number;
    weeklyHours?: number;
    type?: string;
    departmentId?: string;
  }
) => {
  // Enforce Tenant isolation check before update
  const record = await prisma.subject.findUnique({ where: { id } });
  if (!record || record.collegeId !== collegeId) {
    throw new Error('Subject not found or access denied');
  }

  return prisma.subject.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code,
      semester: data.semester,
      credits: data.credits !== undefined ? Number(data.credits) : undefined,
      weeklyHours: data.weeklyHours !== undefined ? Number(data.weeklyHours) : undefined,
      type: data.type,
      departmentId: data.departmentId
    }
  });
};

export const deleteSubject = async (collegeId: string, id: string) => {
  // Enforce Tenant isolation check before delete
  const record = await prisma.subject.findUnique({ where: { id } });
  if (!record || record.collegeId !== collegeId) {
    throw new Error('Subject not found or access denied');
  }

  try {
    return await prisma.subject.delete({
      where: { id }
    });
  } catch (error: any) {
    if (error.code === 'P2003') {
      throw new Error('Cannot delete subject: This subject is currently assigned in a published timetable slot. Please remove it from the timetable first.');
    }
    throw error;
  }
};

// ==========================================
//   CLASSROOMS CRUD OPERATIONS
// ==========================================

export const listRooms = async (collegeId: string) => {
  return prisma.classroom.findMany({
    where: { collegeId },
    include: {
      _count: {
        select: { timetableSlots: true }
      }
    },
    orderBy: { name: 'asc' }
  });
};

export const createRoom = async (collegeId: string, data: {
  name: string;
  type: string;
  capacity?: number;
}) => {
  return prisma.classroom.create({
    data: {
      name: data.name,
      type: data.type || 'CLASSROOM',
      capacity: data.capacity !== undefined ? Number(data.capacity) : undefined,
      collegeId
    }
  });
};

export const updateRoom = async (
  collegeId: string,
  id: string,
  data: {
    name?: string;
    type?: string;
    capacity?: number;
  }
) => {
  // Enforce Tenant isolation check before update
  const record = await prisma.classroom.findUnique({ where: { id } });
  if (!record || record.collegeId !== collegeId) {
    throw new Error('Classroom not found or access denied');
  }

  return prisma.classroom.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      capacity: data.capacity !== undefined ? Number(data.capacity) : undefined
    }
  });
};

export const deleteRoom = async (collegeId: string, id: string) => {
  // Enforce Tenant isolation check before delete
  const record = await prisma.classroom.findUnique({ where: { id } });
  if (!record || record.collegeId !== collegeId) {
    throw new Error('Classroom not found or access denied');
  }

  try {
    return await prisma.classroom.delete({
      where: { id }
    });
  } catch (error: any) {
    if (error.code === 'P2003') {
      throw new Error('Cannot delete classroom: This classroom is currently assigned in a published timetable slot. Please remove it from the timetable first.');
    }
    throw error;
  }
};

// ==========================================
//   SECTIONS CRUD OPERATIONS
// ==========================================

export const listSections = async (collegeId: string) => {
  return prisma.section.findMany({
    where: { collegeId },
    include: {
      department: true,
      _count: {
        select: { timetableSlots: true }
      }
    },
    orderBy: [{ semester: 'asc' }, { name: 'asc' }]
  });
};

export const createSection = async (collegeId: string, data: {
  name: string;
  semester: string;
  departmentId: string;
}) => {
  return prisma.section.create({
    data: {
      name: data.name,
      semester: data.semester,
      departmentId: data.departmentId,
      collegeId
    }
  });
};

export const updateSection = async (
  collegeId: string,
  id: string,
  data: {
    name?: string;
    semester?: string;
    departmentId?: string;
  }
) => {
  // Enforce Tenant isolation check before update
  const record = await prisma.section.findUnique({ where: { id } });
  if (!record || record.collegeId !== collegeId) {
    throw new Error('Section not found or access denied');
  }

  return prisma.section.update({
    where: { id },
    data: {
      name: data.name,
      semester: data.semester,
      departmentId: data.departmentId
    }
  });
};

export const deleteSection = async (collegeId: string, id: string) => {
  // Enforce Tenant isolation check before delete
  const record = await prisma.section.findUnique({ where: { id } });
  if (!record || record.collegeId !== collegeId) {
    throw new Error('Section not found or access denied');
  }

  try {
    return await prisma.section.delete({
      where: { id }
    });
  } catch (error: any) {
    if (error.code === 'P2003') {
      throw new Error('Cannot delete section: This section is currently assigned in a published timetable slot. Please remove it from the timetable first.');
    }
    throw error;
  }
};

// ==========================================
//   FACULTY-SUBJECT ASSIGNMENT OPERATIONS
// ==========================================

export const listFacultySubjects = async (collegeId: string) => {
  return prisma.facultySubject.findMany({
    where: { collegeId },
    include: {
      faculty: {
        include: {
          department: true
        }
      },
      subject: {
        include: {
          department: true
        }
      }
    },
    orderBy: [
      { faculty: { firstName: 'asc' } },
      { subject: { name: 'asc' } }
    ]
  });
};

export const assignFacultySubject = async (collegeId: string, facultyId: string, subjectId: string) => {
  // Check if link already exists
  const existing = await prisma.facultySubject.findUnique({
    where: {
      collegeId_facultyId_subjectId: {
        collegeId,
        facultyId,
        subjectId
      }
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.facultySubject.create({
    data: {
      facultyId,
      subjectId,
      collegeId
    }
  });
};

export const unassignFacultySubject = async (collegeId: string, id: string) => {
  // Enforce Tenant isolation check before delete
  const record = await prisma.facultySubject.findUnique({ where: { id } });
  if (!record || record.collegeId !== collegeId) {
    throw new Error('Assignment not found or access denied');
  }

  return prisma.facultySubject.delete({
    where: { id }
  });
};
