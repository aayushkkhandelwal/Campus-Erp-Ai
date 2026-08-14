import prisma from '../prisma/client';

async function cleanEmptyUser() {
  const emptyUsers = await prisma.user.findMany({
    where: { OR: [{ email: '' }, { password: '' }] },
  });
  console.log('Found empty/malformed user rows:', emptyUsers);

  if (emptyUsers.length > 0) {
    const deleted = await prisma.user.deleteMany({
      where: { OR: [{ email: '' }, { password: '' }] },
    });
    console.log(`Deleted ${deleted.count} empty/malformed user record(s).`);
  }
}

cleanEmptyUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
