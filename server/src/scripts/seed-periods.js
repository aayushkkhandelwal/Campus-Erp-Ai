const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const periodsToSeed = [
  { order: 1, name: 'Period 1', startTime: '08:15', endTime: '09:15' },
  { order: 2, name: 'Period 2', startTime: '09:15', endTime: '10:15' },
  { order: 3, name: 'Period 3', startTime: '10:15', endTime: '11:15' },
  { order: 4, name: 'Period 4', startTime: '11:15', endTime: '12:15' },
  { order: 5, name: 'Period 5', startTime: '12:15', endTime: '13:15' },
  { order: 6, name: 'Period 6', startTime: '13:15', endTime: '14:15' },
  { order: 7, name: 'Period 7', startTime: '14:15', endTime: '15:15' },
];

async function main() {
  const prisma = new PrismaClient();
  console.log('Seeding Period data...');

  for (const item of periodsToSeed) {
    const record = await prisma.period.upsert({
      where: { order: item.order },
      update: {
        startTime: item.startTime,
        endTime: item.endTime,
        name: item.name
      },
      create: {
        name: item.name,
        order: item.order,
        startTime: item.startTime,
        endTime: item.endTime,
      },
    });
    console.log(`Upserted Period ${item.order}: ${record.startTime} - ${record.endTime}`);
  }

  console.log('\nVerifying current periods in DB:');
  const allPeriods = await prisma.period.findMany({
    orderBy: { order: 'asc' }
  });
  console.log(JSON.stringify(allPeriods, null, 2));

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
