import prisma from '../prisma/client';

async function auditPasswordHashes() {
  console.log('🔍 Auditing all User password fields in live PostgreSQL database...\n');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      password: true,
    },
  });

  console.log(`Inspecting ${users.length} user accounts:\n`);
  let nonBcryptCount = 0;

  for (const u of users) {
    const isBcrypt = u.password.startsWith('$2a$') || u.password.startsWith('$2b$') || u.password.startsWith('$2y$');
    if (!isBcrypt) {
      nonBcryptCount++;
      console.log(`⚠️ NON-BCRYPT PLAINTEXT PASSWORD DETECTED! Account: ${u.email} | Role: ${u.role} | Value: "${u.password}"`);
    } else {
      console.log(`✅ Valid Bcrypt Hash: ${u.email} (${u.role}) -> ${u.password.substring(0, 15)}...`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`Audit Summary:`);
  console.log(`Total Users Inspected: ${users.length}`);
  console.log(`Valid Bcrypt Hashes: ${users.length - nonBcryptCount}`);
  console.log(`Plaintext / Non-Bcrypt Passwords Found: ${nonBcryptCount}`);
  console.log(`==================================================\n`);
}

auditPasswordHashes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
