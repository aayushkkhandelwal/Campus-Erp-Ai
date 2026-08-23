require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const CANDIDATES = [
  'TempAdmin2026!',
  'Admin#Secure2026!ERP',
  'A@9xK#2$8pL!qW5v',
  'A@9xK#2!qW5v',
];

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { email: 'admin@college.edu' },
    select: { password: true, updatedAt: true },
  });

  console.log('Current hash in DB:', user.password);
  console.log('updatedAt:', user.updatedAt);
  console.log('');

  for (const candidate of CANDIDATES) {
    const match = await bcrypt.compare(candidate, user.password);
    console.log(`"${candidate}" matches: ${match}`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
