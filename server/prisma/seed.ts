import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/prisma/client';

async function main() {
  console.log('🌱 Seeding production-ready single-college ERP database...');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin#Secure2026!ERP';
  const facultyPassword = process.env.SEED_FACULTY_PASSWORD || 'Faculty#Secure2026!ERP';
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'Student#Secure2026!ERP';

  const hashedAdminPass = await bcrypt.hash(adminPassword, 10);
  const hashedFacultyPass = await bcrypt.hash(facultyPassword, 10);
  const hashedStudentPass = await bcrypt.hash(studentPassword, 10);

  // 1. Seed Single College Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: { role: 'ADMIN', fullName: 'System Administrator', status: 'ACTIVE', phone: '+1 555-0100' },
    create: {
      fullName: 'System Administrator',
      email: 'admin@college.edu',
      password: hashedAdminPass,
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+1 555-0100',
      phoneVerified: true,
      twoFactorEnabled: false,
    },
  });
  console.log('  ✅ Admin user created:', adminUser.email);

  const facultyUser = await prisma.user.upsert({
    where: { email: 'faculty@college.edu' },
    update: { role: 'FACULTY', fullName: 'Dr. Robert Langdon', status: 'ACTIVE', phone: '+1 555-0199' },
    create: {
      fullName: 'Dr. Robert Langdon',
      email: 'faculty@college.edu',
      password: hashedFacultyPass,
      role: 'FACULTY',
      status: 'ACTIVE',
      phone: '+1 555-0199',
      phoneVerified: true,
      twoFactorEnabled: false,
    },
  });
  console.log('  ✅ Faculty user created:', facultyUser.email);

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@college.edu' },
    update: { role: 'STUDENT', fullName: 'Emma Watson', status: 'ACTIVE', phone: '+1 555-0123' },
    create: {
      fullName: 'Emma Watson',
      email: 'student@college.edu',
      password: hashedStudentPass,
      role: 'STUDENT',
      status: 'ACTIVE',
      phone: '+1 555-0123',
      phoneVerified: true,
      twoFactorEnabled: false,
    },
  });
  console.log('  ✅ Student user created:', studentUser.email);

  // 2. Seed Departments
  const deptCse = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'AI, Data Science & Software Engineering.',
      headOfDepartment: 'Dr. Robert Langdon',
    },
  });

  const deptEe = await prisma.department.upsert({
    where: { code: 'EE' },
    update: {},
    create: {
      name: 'Electrical Engineering',
      code: 'EE',
      description: 'Power Electronics & Embedded Systems.',
      headOfDepartment: 'Dr. Sarah Jenkins',
    },
  });

  // 3. Seed Faculty Records
  await prisma.faculty.upsert({
    where: { employeeId: 'FAC-001' },
    update: {},
    create: {
      firstName: 'Robert',
      lastName: 'Langdon',
      email: 'robert.langdon@college.edu',
      employeeId: 'FAC-001',
      phone: '+1 555-0199',
      designation: 'Professor & HOD',
      qualification: 'Ph.D. in Computer Science',
      specialization: 'Artificial Intelligence',
      joiningDate: '2018-08-15',
      status: 'ACTIVE',
      departmentId: deptCse.id,
    },
  });

  // 4. Seed Student Records
  await prisma.student.upsert({
    where: { studentId: 'STU-2026-001' },
    update: {},
    create: {
      firstName: 'Emma',
      lastName: 'Watson',
      email: 'emma.watson@college.edu',
      studentId: 'STU-2026-001',
      dateOfBirth: '2003-04-15',
      gender: 'FEMALE',
      address: '742 Evergreen Terrace',
      phone: '+1 555-0123',
      enrollmentDate: '2022-09-01',
      semester: '6',
      status: 'ACTIVE',
      departmentId: deptCse.id,
    },
  });

  console.log('🎉 Single-college ERP database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
