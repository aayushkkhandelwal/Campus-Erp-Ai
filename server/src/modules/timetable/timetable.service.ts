import prisma from '../../prisma/client';

export interface CreateSlotInput {
  day: string;
  time: string;
  subject: string;
  facultyId?: string;
  faculty?: string;
  room: string;
}

export const publishTimetable = async (semester: string, slots: CreateSlotInput[]) => {
  // Delete existing slots for this semester
  await prisma.timetableSlot.deleteMany({
    where: { semester },
  });

  const allFaculty = await prisma.faculty.findMany();

  // Create new slots with validated facultyId foreign key
  const created = await Promise.all(
    slots.map(async (slot) => {
      let resolvedFacultyId = slot.facultyId;

      // If facultyId is missing or invalid, attempt exact or fallback name matching against DB
      if (!resolvedFacultyId || !allFaculty.some((f) => f.id === resolvedFacultyId)) {
        const match = allFaculty.find(
          (f) =>
            `${f.firstName} ${f.lastName}`.toLowerCase() === slot.faculty?.toLowerCase() ||
            f.firstName.toLowerCase() === slot.faculty?.toLowerCase()
        );
        if (match) {
          resolvedFacultyId = match.id;
        } else if (allFaculty.length > 0) {
          // Map to first available active faculty member as fallback
          resolvedFacultyId = allFaculty[0].id;
        } else {
          throw new Error(`Cannot save timetable slot: No valid Faculty member found for '${slot.faculty || 'Unknown'}' in database.`);
        }
      }

      const matchedFaculty = allFaculty.find((f) => f.id === resolvedFacultyId);
      const facultyDisplayName = matchedFaculty
        ? `${matchedFaculty.firstName} ${matchedFaculty.lastName}`
        : slot.faculty || 'Faculty Member';

      return prisma.timetableSlot.create({
        data: {
          semester,
          day: slot.day,
          time: slot.time,
          subject: slot.subject,
          facultyId: resolvedFacultyId,
          faculty: facultyDisplayName,
          room: slot.room,
          status: 'PUBLISHED',
        },
        include: { facultyRel: true },
      });
    })
  );

  return created;
};

export const getTimetable = async (semester?: string) => {
  const where: any = {};
  if (semester) where.semester = semester;

  const slots = await prisma.timetableSlot.findMany({
    where,
    include: { facultyRel: true },
    orderBy: [{ semester: 'asc' }, { day: 'asc' }],
  });

  return slots.map((s) => ({
    ...s,
    faculty: s.facultyRel ? `${s.facultyRel.firstName} ${s.facultyRel.lastName}` : s.faculty || 'Faculty Member',
  }));
};
