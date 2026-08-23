const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Testing generateTimetable and publish relation mapping...');

  // 1. Get first period from DB
  const period = await prisma.period.findFirst({
    orderBy: { order: 'asc' }
  });

  if (!period) {
    throw new Error('No periods found in database to link!');
  }
  console.log(`Found Period in DB: ${period.name} (${period.id}) - Timing: ${period.startTime} to ${period.endTime}`);

  // 2. Mock a CreateSlotInput that carries this periodId
  const mockSlotInput = {
    day: 'Monday',
    time: `${period.startTime} - ${period.endTime}`,
    subject: 'AI Testing (CS-505)',
    faculty: 'Dr. langdon',
    room: 'Room 201',
    periodId: period.id // Direct connect mapping
  };

  // 3. Import server modules to trigger publish
  const { publishTimetable } = require('../modules/timetable/timetable.service');

  console.log('Publishing mock timetable with direct periodId connection...');
  const published = await publishTimetable('Semester 5', [mockSlotInput]);
  console.log(`Successfully published ${published.length} slot.`);

  // 4. Retrieve the newly created slot and check period connection
  const checkedSlot = await prisma.timetableSlot.findFirst({
    where: {
      semester: 'Semester 5',
      subject: 'AI Testing (CS-505)'
    },
    include: {
      periods: true
    }
  });

  if (!checkedSlot) {
    throw new Error('Slot record not found in database!');
  }

  console.log('Retrieved slot relation metadata:');
  console.log(`- Subject: ${checkedSlot.subject}`);
  console.log(`- Day: ${checkedSlot.day}`);
  console.log(`- Linked Periods Count: ${checkedSlot.periods.length}`);
  if (checkedSlot.periods.length > 0) {
    console.log(`- Linked Period Details: ${checkedSlot.periods[0].name} (${checkedSlot.periods[0].id})`);
  }

  const success = checkedSlot.periods.length > 0 && checkedSlot.periods[0].id === period.id;
  console.log('Integration Test Status:', success ? 'PASSED' : 'FAILED');

  // Re-run seed/cleanup if needed, or leave it since it's just standard mock
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
