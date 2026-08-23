import prisma from '../../prisma/client';
import type { CreateDepartmentInput, UpdateDepartmentInput } from './department.validation';

export const getDepartments = async () => {
  const depts = await prisma.department.findMany({
    include: {
      _count: {
        select: {
          students: true,
          faculties: true,
        },
      },
    },
    orderBy: { code: 'asc' },
  });

  return depts.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    description: d.description,
    headOfDepartment: d.headOfDepartment,
    studentCount: d._count.students,
    facultyCount: d._count.faculties,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
};

export const getDepartmentById = async (id: string) => {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          students: true,
          faculties: true,
        },
      },
    },
  });

  if (!dept) return null;

  return {
    id: dept.id,
    name: dept.name,
    code: dept.code,
    description: dept.description,
    headOfDepartment: dept.headOfDepartment,
    studentCount: dept._count.students,
    facultyCount: dept._count.faculties,
    createdAt: dept.createdAt,
    updatedAt: dept.updatedAt,
  };
};

export const createDepartment = async (data: CreateDepartmentInput) => {
  // Check uniqueness by name or code
  const existingDept = await prisma.department.findFirst({
    where: {
      OR: [
        { name: { equals: data.name, mode: 'insensitive' } },
        { code: { equals: data.code, mode: 'insensitive' } },
      ],
    },
  });

  if (existingDept) {
    throw new Error(`Department '${data.name}' or code '${data.code}' already exists in the system.`);
  }

  const dept = await prisma.department.create({
    data: {
      name: data.name,
      code: data.code.toUpperCase().trim(),
      description: data.description,
      headOfDepartment: data.headOfDepartment,
      collegeId: (data as any).collegeId || 'default-college-id',
    },
  });

  return {
    ...dept,
    studentCount: 0,
    facultyCount: 0,
  };
};

export const updateDepartment = async (id: string, data: UpdateDepartmentInput) => {
  const { code, ...updateFields } = data as any;

  return prisma.department.update({
    where: { id },
    data: updateFields,
  });
};

export const deleteDepartment = async (id: string) => {
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) return null;

  // Cascade clean dependencies
  await prisma.student.deleteMany({ where: { departmentId: id } }).catch(() => {});
  await prisma.faculty.deleteMany({ where: { departmentId: id } }).catch(() => {});
  await prisma.subject.deleteMany({ where: { departmentId: id } }).catch(() => {});

  return prisma.department.delete({ where: { id } });
};
