import prisma from '../src/prisma/client';

async function main() {
  const faculties = await prisma.faculty.findMany({
    include: { department: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log('Existing faculties count:', faculties.length);

  const deptCounts: Record<string, number> = {};

  for (const f of faculties) {
    let deptCode = (f.department?.code || 'CS').toUpperCase();
    if (deptCode === 'CSE') deptCode = 'CS';
    if (deptCode === 'ECE') deptCode = 'EC';
    deptCode = `${deptCode}FAC`;

    deptCounts[deptCode] = (deptCounts[deptCode] || 0) + 1;
    const seqStr = String(deptCounts[deptCode]).padStart(3, '0');
    const newEmpId = `2026${deptCode}${seqStr}`;

    await prisma.faculty.update({
      where: { id: f.id },
      data: { employeeId: newEmpId },
    });
    console.log(`Updated ${f.firstName} ${f.lastName} (${f.email}) -> ${newEmpId}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
