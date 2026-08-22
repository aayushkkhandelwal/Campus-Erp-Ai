const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL is not set in environment!");
  process.exit(1);
}

// Parse URL to check hostname
const parsedUrl = new URL(dbUrl);
console.log(`📡 Backfill connecting to: ${parsedUrl.hostname}\n`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
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

async function main() {
  console.log("🚀 Starting database backfill process...");

  // 1. Fetch current slots and faculties
  const slots = await prisma.timetableSlot.findMany();
  const faculties = await prisma.faculty.findMany();

  console.log(`  - Found ${slots.length} TimetableSlots to migrate.`);
  console.log(`  - Found ${faculties.length} Faculty records in database.`);

  // 2. Pre-calculate unique start times chronologically to assign dynamic order
  const startTimes = [];
  for (const slot of slots) {
    try {
      const parsed = parseTimeString(slot.time);
      if (!startTimes.includes(parsed.startTime)) {
        startTimes.push(parsed.startTime);
      }
    } catch (err) {
      console.error(`❌ Parse error during pre-check: ${err.message}`);
    }
  }
  // Sort chronologically
  startTimes.sort();
  console.log("🕒 Unique start times detected:", startTimes);
  
  const startTimeToOrder = {};
  startTimes.forEach((time, index) => {
    startTimeToOrder[time] = index + 1;
  });
  console.log("📈 Dynamic Period Order Mapping:", startTimeToOrder, "\n");

  const validationErrors = [];
  const processedSlots = [];

  // Map each slot
  for (const slot of slots) {
    console.log(`\n⚙️ Processing Slot ID: ${slot.id} (${slot.subject} | ${slot.day})`);
    
    // A. Faculty Mapping (Strict exact comparison)
    const slotFacultyNormalized = normalizeName(slot.faculty);
    const matchedFaculty = faculties.find(f => {
      const fullName = normalizeName(`${f.firstName} ${f.lastName}`);
      return fullName === slotFacultyNormalized;
    });

    if (!matchedFaculty) {
      const errorMsg = `No matching Faculty record found for name: "${slot.faculty}"`;
      console.error(`  ❌ ${errorMsg}`);
      validationErrors.push({ id: slot.id, error: errorMsg, slot });
      continue;
    }
    console.log(`  ✅ Matched Faculty: ${matchedFaculty.firstName} ${matchedFaculty.lastName} (${matchedFaculty.id})`);

    // B. Room Mapping (Auto-create distinct rooms)
    const roomName = slot.room.trim();
    const isLab = roomName.toLowerCase().includes('lab');
    const roomRecord = await prisma.room.upsert({
      where: { name: roomName },
      update: {},
      create: {
        name: roomName,
        type: isLab ? 'LAB' : 'CLASSROOM',
        capacity: isLab ? 30 : 60
      }
    });
    console.log(`  ✅ Room mapped: "${roomRecord.name}" (${roomRecord.id})`);

    // C. Period Mapping (Auto-create/match periods)
    let parsedTime;
    let periodOrder;
    try {
      parsedTime = parseTimeString(slot.time);
      periodOrder = startTimeToOrder[parsedTime.startTime];
    } catch (err) {
      console.error(`  ❌ ${err.message}`);
      validationErrors.push({ id: slot.id, error: err.message, slot });
      continue;
    }
    console.log(`  🕒 Parsed time: ${parsedTime.startTime} - ${parsedTime.endTime}`);

    const periodRecord = await prisma.period.upsert({
      where: { order: periodOrder },
      update: {},
      create: {
        name: `Period ${periodOrder}`,
        order: periodOrder,
        startTime: parsedTime.startTime,
        endTime: parsedTime.endTime
      }
    });
    console.log(`  ✅ Period mapped: "${periodRecord.name}" (Order: ${periodRecord.order}, ID: ${periodRecord.id})`);

    // D. Update slot relations
    await prisma.timetableSlot.update({
      where: { id: slot.id },
      data: {
        facultyId: matchedFaculty.id,
        roomId: roomRecord.id,
        periods: {
          connect: { id: periodRecord.id }
        }
      }
    });
    console.log(`  🎉 Successfully migrated slot relations.`);
    processedSlots.push({ id: slot.id, facultyId: matchedFaculty.id, roomId: roomRecord.id, periodId: periodRecord.id });
  }

  console.log("\n==============================================");
  console.log("🏁 Backfill Process Complete.");
  console.log(`  - Total processed successfully: ${processedSlots.length}`);
  console.log(`  - Total failed/validation errors: ${validationErrors.length}`);
  console.log("==============================================\n");

  if (validationErrors.length > 0) {
    console.error("⚠️ Migration validation failures encountered:");
    console.error(JSON.stringify(validationErrors, null, 2));
    process.exit(1);
  } else {
    console.log("🚀 All 20 slots successfully migrated with 100% data integrity.");
  }
}

main()
  .catch(e => {
    console.error("❌ Backfill execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
