// Resets admin@college.edu to a known temporary password via a file-based script
// so PowerShell cannot expand $ characters in the string.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const TEMP_PASSWORD = 'TempAdmin2026!';

async function main() {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash(TEMP_PASSWORD, 10);

  const user = await prisma.user.update({
    where: { email: 'admin@college.edu' },
    data: {
      password: hash,
      mustChangePassword: true,
    },
  });

  console.log('Done. Admin account reset:');
  console.log('  email           :', user.email);
  console.log('  mustChangePassword:', user.mustChangePassword);
  console.log('  updatedAt       :', user.updatedAt);
  console.log('');
  console.log('Temporary login password: TempAdmin2026!');
  console.log('Use this to log in and then set your own permanent password via the UI.');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
