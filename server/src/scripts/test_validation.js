const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Helper function to normalize strings for matching
function normalizeName(name) {
  return name.replace(/\s+/g, ' ').trim().toLowerCase();
}

// Helper to parse time strings like "09:00 - 10:00 AM" into startTime/endTime (24h format)
function parseTimeString(timeStr) {
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
  
  const pad = (num) => String(num).padStart(2, '0');
  
  return {
    startTime: `${pad(start24Hour)}:${startMin}`,
    endTime: `${pad(end24Hour)}:${endMin}`
  };
}

// Core Conflict Detection Logic
async function validateTimetable(proposedSemester, proposedSlots) {
  const faculties = await prisma.faculty.findMany();
  const rooms = await prisma.room.findMany();
  const periods = await prisma.period.findMany();

  // Load all existing slots from other semesters from the database
  const databaseSlots = await prisma.timetableSlot.findMany({
    where: {
      semester: { not: proposedSemester }
    },
    include: {
      facultyRelation: true,
      roomRelation: true,
      periods: true
    }
  });

  const resolvedSlots = [];

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

    // Resolve Room: Use roomId directly if passed, fallback to name-matching
    let roomId = s.roomId || null;
    let roomName = s.room || "N/A";
    if (!roomId && s.room) {
      const rTrim = s.room.trim();
      const roomRecord = rooms.find(r => r.name.toLowerCase() === rTrim.toLowerCase());
      if (roomRecord) {
        roomId = roomRecord.id;
        roomName = roomRecord.name;
      }
    } else if (roomId) {
      const roomRecord = rooms.find(r => r.id === roomId);
      if (roomRecord) {
        roomName = roomRecord.name;
      }
    }

    // Resolve Period
    let periodIds = [];
    let periodNames = [];
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
      groupLabel: s.groupLabel || null,
      isPlaceholder: s.isPlaceholder || false,
      facultyId,
      facultyName,
      roomId,
      roomName,
      periodIds,
      periodNames
    });
  }

  const conflicts = [];
  const hasOverlap = (arr1, arr2) => arr1.some(id => arr2.includes(id));

  // Loop through each resolved proposed slot
  for (let i = 0; i < resolvedSlots.length; i++) {
    const slotA = resolvedSlots[i];

    // 1. Check against DB slots (Other Semesters)
    for (const slotB of databaseSlots) {
      const dbPeriodIds = slotB.periods.map(p => p.id);
      
      if (slotA.day === slotB.day && hasOverlap(slotA.periodIds, dbPeriodIds)) {
        
        // A. Faculty Clash (Semester-agnostic, ignore null)
        if (slotA.facultyId && slotB.facultyId && slotA.facultyId === slotB.facultyId) {
          conflicts.push({
            type: "FACULTY_CLASH",
            message: `Faculty member "${slotA.facultyName}" is double-booked on ${slotA.day} at ${slotA.time} between proposed slot (${slotA.subject} in ${slotA.semester}) and existing database slot (${slotB.subject} in ${slotB.semester}).`,
            slotA,
            slotB: { id: slotB.id, semester: slotB.semester, subject: slotB.subject, facultyName: slotA.facultyName }
          });
        }

        // B. Room Clash (Semester-agnostic, ignore null)
        if (slotA.roomId && slotB.roomId && slotA.roomId === slotB.roomId) {
          conflicts.push({
            type: "ROOM_CLASH",
            message: `Room "${slotA.roomName}" is double-booked on ${slotA.day} at ${slotA.time} between proposed slot (${slotA.subject} in ${slotA.semester}) and existing database slot (${slotB.subject} in ${slotB.semester}).`,
            slotA,
            slotB: { id: slotB.id, semester: slotB.semester, subject: slotB.subject, roomName: slotA.roomName }
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

        // B. Room Clash (Internal, ignore null)
        if (slotA.roomId && slotB.roomId && slotA.roomId === slotB.roomId) {
          conflicts.push({
            type: "ROOM_CLASH",
            message: `Room "${slotA.roomName}" is double-booked on ${slotA.day} at ${slotA.time} within the proposed batch (both ${slotA.subject} and ${slotB.subject} are assigned to this room).`,
            slotA,
            slotB
          });
        }

        // C. Student/Group Clash (Internal to proposed batch)
        if (slotA.semester === slotB.semester) {
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
}

async function runTests() {
  console.log("🧪 STARTING TIMETABLE CONFLICT RESOLUTION TEST SUITE...\n");

  // ==============================================================
  // Test Case 1: Proposed Semester 3 slot for Robert Langdon on Monday, 10:00 - 11:00 AM
  // This should clash with Slot 4 (Robert Langdon is already teaching Semester 5 at Room 104).
  // ==============================================================
  console.log("--------------------------------------------------");
  console.log("Test Case 1: Propose conflicting slot for Robert Langdon (Sem 3 vs Sem 5)");
  const proposedBatch1 = [
    {
      day: "Monday",
      time: "10:00 - 11:00 AM",
      subject: "Data Structures",
      faculty: "Robert Langdon",
      room: "Room 104"
    }
  ];
  const conflicts1 = await validateTimetable("Semester 3", proposedBatch1);
  console.log(`Conflicts detected: ${conflicts1.length}`);
  conflicts1.forEach(c => console.log(`  💥 [${c.type}] ${c.message}`));

  // ==============================================================
  // Test Case 2: Propose legitimate split group parallel session for Semester 5
  // Group 1: Ayuuush Khan, Lab 1, DBMS
  // Group 2: Robert Langdon, Lab 3, AI
  // This should produce NO conflicts since they use different rooms and teachers.
  // ==============================================================
  console.log("\n--------------------------------------------------");
  console.log("Test Case 2: Propose legitimate split group parallel session (Sem 5)");
  const proposedBatch2 = [
    {
      day: "Wednesday",
      time: "11:00 - 12:00 PM",
      subject: "DBMS Lab",
      faculty: "Ayuuush  Khan",
      room: "Lab 1",
      groupLabel: "Group 1"
    },
    {
      day: "Wednesday",
      time: "11:00 - 12:00 PM",
      subject: "AI Lab",
      faculty: "Robert Langdon",
      room: "Lab 3",
      groupLabel: "Group 2"
    }
  ];
  const conflicts2 = await validateTimetable("Semester 5", proposedBatch2);
  console.log(`Conflicts detected: ${conflicts2.length}`);
  if (conflicts2.length === 0) {
    console.log("  ✅ SUCCESS: No conflicts found for legitimate parallel split sessions!");
  } else {
    conflicts2.forEach(c => console.log(`  💥 [${c.type}] ${c.message}`));
  }

  // ==============================================================
  // Test Case 3: Propose conflicting split group parallel session (same group label or double-booked room/teacher)
  // Group 1: Ayuuush Khan, Lab 1, DBMS
  // Group 1: Robert Langdon, Lab 1, AI  <-- clashes on room (Lab 1) and student (both Group 1)
  // ==============================================================
  console.log("\n--------------------------------------------------");
  console.log("Test Case 3: Propose conflicting split group session (Same group and room)");
  const proposedBatch3 = [
    {
      day: "Wednesday",
      time: "11:00 - 12:00 PM",
      subject: "DBMS Lab",
      faculty: "Ayuuush  Khan",
      room: "Lab 1",
      groupLabel: "Group 1"
    },
    {
      day: "Wednesday",
      time: "11:00 - 12:00 PM",
      subject: "AI Lab",
      faculty: "Robert Langdon",
      room: "Lab 1", // same room!
      groupLabel: "Group 1" // same group!
    }
  ];
  const conflicts3 = await validateTimetable("Semester 5", proposedBatch3);
  console.log(`Conflicts detected: ${conflicts3.length}`);
  conflicts3.forEach(c => console.log(`  💥 [${c.type}] ${c.message}`));

  // ==============================================================
  // Test Case 4: Propose two placeholder electives (isPlaceholder = true)
  // Open Elective 1 and Open Elective 2, Wednesday, 11:00 - 12:00 PM
  // These are electives, so they are allowed to run concurrently in the same semester.
  // Should produce NO conflicts.
  // ==============================================================
  console.log("\n--------------------------------------------------");
  console.log("Test Case 4: Propose two placeholder electives at the same slot (Sem 5)");
  const proposedBatch4 = [
    {
      day: "Wednesday",
      time: "11:00 - 12:00 PM",
      subject: "Open Elective - Biotech",
      isPlaceholder: true,
      faculty: null,
      room: null
    },
    {
      day: "Wednesday",
      time: "11:00 - 12:00 PM",
      subject: "Open Elective - MBA",
      isPlaceholder: true,
      faculty: null,
      room: null
    }
  ];
  const conflicts4 = await validateTimetable("Semester 5", proposedBatch4);
  console.log(`Conflicts detected: ${conflicts4.length}`);
  if (conflicts4.length === 0) {
    console.log("  ✅ SUCCESS: No conflicts found for parallel placeholder electives!");
  } else {
    conflicts4.forEach(c => console.log(`  💥 [${c.type}] ${c.message}`));
  }

  // ==============================================================
  // Test Case 5: Propose slot with direct IDs (facultyId, roomId)
  // We specify facultyId: "cmsqdbvom0006gt8pj9ftnl0c" (Robert Langdon) on Monday, 10:00 - 11:00 AM in roomId "cmt4aovbf0006zjer9y15nbue" (Room 104)
  // Should successfully find clash with Slot 4.
  // ==============================================================
  console.log("\n--------------------------------------------------");
  console.log("Test Case 5: Propose slot with direct IDs (Sem 3 vs Sem 5 DB slot)");
  const proposedBatch5 = [
    {
      day: "Monday",
      time: "10:00 - 11:00 AM",
      subject: "Data Structures",
      facultyId: "cmsqdbvom0006gt8pj9ftnl0c",
      roomId: "cmt4aovbf0006zjer9y15nbue"
    }
  ];
  const conflicts5 = await validateTimetable("Semester 3", proposedBatch5);
  console.log(`Conflicts detected: ${conflicts5.length}`);
  conflicts5.forEach(c => console.log(`  💥 [${c.type}] ${c.message}`));
  
  console.log("\n--------------------------------------------------");
  console.log("🏁 TEST SUITE RUN COMPLETED.");
}

runTests()
  .catch(e => console.error("Test run crashed:", e))
  .finally(() => prisma.$disconnect());
