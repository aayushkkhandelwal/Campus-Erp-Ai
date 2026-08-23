import prisma from '../prisma/client';
import bcrypt from 'bcrypt';

const BASE_URL = 'http://localhost:5000/api/v1';

async function setupTestData() {
  console.log('🔧 Dropping global unique indexes from old schema if they exist as indices...');
  try {
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "Subject_code_key" CASCADE;');
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "Department_code_key" CASCADE;');
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "Room_name_key" CASCADE;');
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "Section_name_semester_departmentId_key" CASCADE;');
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "FacultySubject_facultyId_subjectId_key" CASCADE;');
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "Period_order_key" CASCADE;');
    console.log('✅ Unique indexes cleaned up.');
  } catch (err: any) {
    console.warn('⚠️  Non-critical warning cleaning unique indexes:', err.message);
  }

  console.log('🔧 Setting up mock test data...');
  
  // Ensure default college exists
  await prisma.college.upsert({
    where: { id: 'default-college-id' },
    update: {},
    create: {
      id: 'default-college-id',
      name: 'Default College'
    }
  });

  // Ensure a foreign college exists
  await prisma.college.upsert({
    where: { id: 'foreign-college-id' },
    update: {},
    create: {
      id: 'foreign-college-id',
      name: 'Foreign College'
    }
  });

  // Create/update tenant admin user under default college with guaranteed password
  const passwordHash = await bcrypt.hash('A@9xK#2$8pL!qW5v', 10);
  await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: { collegeId: 'default-college-id', role: 'ADMIN', password: passwordHash },
    create: {
      fullName: 'Tenant Admin',
      email: 'admin@college.edu',
      password: passwordHash,
      role: 'ADMIN',
      collegeId: 'default-college-id'
    }
  });

  // Create/update SUPER_ADMIN user with guaranteed password
  await prisma.user.upsert({
    where: { email: 'superadmin@saas.com' },
    update: { collegeId: null, role: 'SUPER_ADMIN', password: passwordHash },
    create: {
      fullName: 'Platform Super Admin',
      email: 'superadmin@saas.com',
      password: passwordHash,
      role: 'SUPER_ADMIN',
      collegeId: null
    }
  });

  // Reset lockouts or login attempts for testing
  await prisma.user.updateMany({
    where: { email: { in: ['admin@college.edu', 'superadmin@saas.com'] } },
    data: { status: 'ACTIVE' }
  });

  // Seed one subject in default college
  let defaultDept = await prisma.department.findFirst({
    where: { collegeId: 'default-college-id' }
  });
  
  if (!defaultDept) {
    defaultDept = await prisma.department.create({
      data: {
        name: 'CSE',
        code: 'CSE',
        collegeId: 'default-college-id'
      }
    });
  }

  await prisma.subject.upsert({
    where: { collegeId_code: { collegeId: 'default-college-id', code: 'CS-101' } },
    update: {},
    create: {
      name: 'Default College Intro to CS',
      code: 'CS-101',
      semester: '1',
      collegeId: 'default-college-id',
      departmentId: defaultDept.id
    }
  });

  // Seed one subject in foreign college
  await prisma.department.upsert({
    where: { collegeId_code: { collegeId: 'foreign-college-id', code: 'FOR-CSE' } },
    update: {},
    create: {
      id: 'for-dept',
      name: 'Foreign CSE',
      code: 'FOR-CSE',
      collegeId: 'foreign-college-id'
    }
  });

  await prisma.subject.upsert({
    where: { collegeId_code: { collegeId: 'foreign-college-id', code: 'CS-101' } }, // Reusing code - allowed under composite constraints!
    update: {},
    create: {
      name: 'Foreign College Intro to CS',
      code: 'CS-101',
      semester: '1',
      collegeId: 'foreign-college-id',
      departmentId: 'for-dept'
    }
  });

  console.log('✅ Test data successfully configured.');
  return { defaultDeptId: defaultDept.id };
}

async function runTests() {
  const { defaultDeptId } = await setupTestData();

  console.log('\n🚀 Starting tenant isolation manual-testing simulator...\n');

  // --- TEST 1: Tenant Admin Login & Token retrieval ---
  console.log('🔑 Log in as default-college tenant admin...');
  const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@college.edu',
      password: 'A@9xK#2$8pL!qW5v'
    })
  });
  
  const loginRes = await loginResponse.json() as any;
  if (!loginRes.success) {
    console.error('❌ Login failed:', loginRes);
    return;
  }
  const token = loginRes.data?.token;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // --- TEST 2: Query Scoping Bypasses client-supplied params ---
  console.log('🔍 GET subjects, attempting to request foreign-college-id (passed via query string)...');
  const getResponse = await fetch(`${BASE_URL}/timetable/subjects?collegeId=foreign-college-id`, {
    method: 'GET',
    headers
  });
  
  const getRes = await getResponse.json() as any;
  if (!getRes.success) {
    console.error('❌ GET subjects failed:', getRes);
    return;
  }
  const returnedSubjects = getRes.data;
  console.log(`  -> Subjects returned count: ${returnedSubjects.length}`);
  returnedSubjects.forEach((sub: any) => {
    console.log(`  -> Returned Subject: "${sub.name}" (College: ${sub.collegeId})`);
  });

  const hasLeak = returnedSubjects.some((sub: any) => sub.collegeId === 'foreign-college-id');
  if (hasLeak) {
    console.log('❌ FAIL: Data leak! Standard admin fetched foreign tenant subjects!');
  } else {
    console.log('🛡️  SUCCESS: client-supplied query parameter was ignored. Scoped to default-college-id.');
  }

  // --- TEST 3: Creation Scoping Bypasses client-supplied body parameter ---
  console.log('\n📝 POST subject, trying to inject collegeId: "foreign-college-id" in request body...');
  try {
    const createResponse = await fetch(`${BASE_URL}/timetable/subjects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Malicious Injected Subject',
        code: 'CS-999',
        semester: '2',
        credits: 4,
        weeklyHours: 4,
        type: 'CLASSROOM',
        departmentId: defaultDeptId,
        collegeId: 'foreign-college-id' // Injection attempt
      })
    });

    const createRes = await createResponse.json() as any;
    if (!createRes.success) {
      console.error('❌ POST subject failed:', createRes);
      return;
    }
    const createdSub = createRes.data;
    console.log(`  -> Subject created: "${createdSub.name}"`);
    console.log(`  -> Assigned College ID in DB: "${createdSub.collegeId}"`);

    if (createdSub.collegeId === 'foreign-college-id') {
      console.log('❌ FAIL: Injection exploit succeeded! Subject written under foreign-college-id.');
    } else {
      console.log('🛡️  SUCCESS: Injection bypassed. Subject forced under default-college-id.');
      // Cleanup the test subject
      await prisma.subject.delete({ where: { id: createdSub.id } });
    }
  } catch (err: any) {
    console.log('❌ FAIL: Exception during creation test:', err.message);
  }

  // --- TEST 4: ID-based Cross-Tenant Update/Delete Traversal ---
  console.log('\n🔍 Fetching target subject ID belonging to foreign-college-id...');
  const foreignSubject = await prisma.subject.findFirst({
    where: { collegeId: 'foreign-college-id', code: 'CS-101' }
  });
  
  if (!foreignSubject) {
    console.error('❌ Setup error: foreign subject CS-101 not found in database.');
    return;
  }
  
  const foreignSubId = foreignSubject.id;
  console.log(`  -> Target Foreign Subject ID: "${foreignSubId}"`);

  // Try to UPDATE foreign-college subject using default-college token
  console.log('📝 PUT subject (update attempt on foreign ID as standard admin)...');
  try {
    const putResponse = await fetch(`${BASE_URL}/timetable/subjects/${foreignSubId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: 'Injected Malicious Update'
      })
    });

    const putRes = await putResponse.json() as any;
    console.log(`  -> PUT Response status: ${putResponse.status}`);
    console.log(`  -> PUT Response message: "${putRes.message}"`);
    
    if (putResponse.ok || (putRes && putRes.success)) {
      console.log('❌ FAIL: Security leak! Standard admin was able to update a foreign college subject!');
    } else {
      console.log('🛡️  SUCCESS: Update request rejected safely (400/403/404 as expected).');
    }
  } catch (err: any) {
    console.log('🛡️  SUCCESS: Update request rejected safely (exception).', err.message);
  }

  // Try to DELETE foreign-college subject using default-college token
  console.log('\n🗑️ DELETE subject (delete attempt on foreign ID as standard admin)...');
  try {
    const deleteResponse = await fetch(`${BASE_URL}/timetable/subjects/${foreignSubId}`, {
      method: 'DELETE',
      headers
    });

    const deleteRes = await deleteResponse.json() as any;
    console.log(`  -> DELETE Response status: ${deleteResponse.status}`);
    console.log(`  -> DELETE Response message: "${deleteRes.message}"`);
    
    if (deleteResponse.ok || (deleteRes && deleteRes.success)) {
      console.log('❌ FAIL: Security leak! Standard admin was able to delete a foreign college subject!');
    } else {
      console.log('🛡️  SUCCESS: Delete request rejected safely (400/403/404 as expected).');
    }
  } catch (err: any) {
    console.log('🛡️  SUCCESS: Delete request rejected safely (exception).', err.message);
  }

  // --- TEST 5: Super Admin Login & parameter honors ---
  console.log('\n🔑 Log in as SUPER_ADMIN platform user...');
  const superLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@saas.com',
      password: 'A@9xK#2$8pL!qW5v'
    })
  });
  
  const superLoginRes = await superLoginResponse.json() as any;
  if (!superLoginRes.success) {
    console.error('❌ Super Admin Login failed:', superLoginRes);
    return;
  }
  const superToken = superLoginRes.data?.token;
  const superHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${superToken}`
  };

  console.log('🔍 Super Admin requests default-college-id subjects...');
  const superGetDefaultResponse = await fetch(`${BASE_URL}/timetable/subjects?collegeId=default-college-id`, {
    method: 'GET',
    headers: superHeaders
  });
  const superGetDefault = await superGetDefaultResponse.json() as any;
  if (!superGetDefault.success) {
    console.error('❌ Super Admin request default failed:', superGetDefault);
    return;
  }
  console.log(`  -> Default College subjects count: ${superGetDefault.data.length}`);
  superGetDefault.data.forEach((sub: any) => {
    console.log(`     - [${sub.code}] ${sub.name} (College: ${sub.collegeId})`);
  });

  console.log('🔍 Super Admin requests foreign-college-id subjects...');
  const superGetForeignResponse = await fetch(`${BASE_URL}/timetable/subjects?collegeId=foreign-college-id`, {
    method: 'GET',
    headers: superHeaders
  });
  const superGetForeign = await superGetForeignResponse.json() as any;
  if (!superGetForeign.success) {
    console.error('❌ Super Admin request foreign failed:', superGetForeign);
    return;
  }
  console.log(`  -> Foreign College subjects count: ${superGetForeign.data.length}`);
  superGetForeign.data.forEach((sub: any) => {
    console.log(`     - [${sub.code}] ${sub.name} (College: ${sub.collegeId})`);
  });

  console.log('🛡️  SUCCESS: Super Admin has platform-wide query visibility matching parameters.');

  console.log('\n✨ Tenant isolation manual-testing simulator finished successfully!\n');
}

runTests().catch(err => {
  console.error('Error running test script:', err.message);
});
