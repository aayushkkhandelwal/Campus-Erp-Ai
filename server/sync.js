const prisma = require('./dist/prisma/client').default;
const bcrypt = require('bcrypt');

async function syncAllStudents() {
  console.log('Fetching all students...');
  const students = await prisma.student.findMany();
  console.log(`Found ${students.length} students.`);

  const hashedPassword = await bcrypt.hash('student123', 10);

  for (const s of students) {
    const fullName = `${s.firstName} ${s.lastName}`.trim();
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        fullName: fullName,
        role: 'STUDENT',
      },
      create: {
        fullName: fullName,
        email: s.email,
        password: hashedPassword,
        role: 'STUDENT',
      },
    });
    console.log(`✅ Synced student account: Email: ${s.email} | User ID: ${user.id}`);
  }

  const allUsers = await prisma.user.findMany();
  console.log('\n--- All Active User Login Accounts in DB ---');
  for (const u of allUsers) {
    console.log(`Role: [${u.role}] | Email: ${u.email} | Name: ${u.fullName}`);
  }
}

syncAllStudents()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
