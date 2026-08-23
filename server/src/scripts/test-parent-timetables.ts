import prisma from '../prisma/client';
import bcrypt from 'bcrypt';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🚀 Starting parent timetables integration verification suite...');

  // 1. Get Auth Token for default college tenant admin
  console.log('🔑 Authenticating default-college tenant admin (admin@college.edu)...');
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

  // 2. Fetch default AcademicSession ID
  console.log('🔍 Fetching academic session in database...');
  const academicSession = await prisma.academicSession.findFirst({
    where: { collegeId: 'default-college-id' }
  });
  if (!academicSession) {
    console.error('❌ Academic Session not found in database.');
    return;
  }
  const sessionId = academicSession.id;
  console.log(`  -> Resolved Academic Session ID: "${sessionId}"`);

  // 3. Create parent Timetable record via REST API POST with a unique cohort
  console.log('📝 Creating parent Timetable record via POST /timetable/parent...');
  const createResponse = await fetch(`${BASE_URL}/timetable/parent`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Integration Test Timetable',
      academicSessionId: sessionId,
      semester: 'Semester 9', // Unique semester to avoid matching backfilled records
      branch: 'QA Department', // Unique branch to avoid matching backfilled records
      status: 'DRAFT'
    })
  });

  const createRes = await createResponse.json() as any;
  if (!createResponse.ok || !createRes.success) {
    console.error('❌ Failed to create parent timetable:', createRes);
    return;
  }
  const parentTimetable = createRes.data;
  const timetableId = parentTimetable.id;
  console.log(`  -> Timetable Parent Created ID: "${timetableId}"`);
  console.log(`  -> Assigned Name: "${parentTimetable.name}"`);

  // 4. Publish slots under this timetable
  console.log('📝 Publishing timetable slots under the parent Timetable...');
  
  // Fetch department or resolve defaults
  const dept = await prisma.department.findFirst({ where: { collegeId: 'default-college-id' } });
  const deptId = dept ? dept.id : 'temp-dept';
  
  const faculty = await prisma.faculty.findFirst({ where: { collegeId: 'default-college-id' } });
  const facultyId = faculty ? faculty.id : null;
  const classroom = await prisma.classroom.findFirst({ where: { collegeId: 'default-college-id' } });
  const classroomId = classroom ? classroom.id : null;

  const publishResponse = await fetch(`${BASE_URL}/timetable/publish`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      semester: 'Semester 9',
      slots: [
        {
          day: 'Monday',
          time: '09:00 - 10:00 AM',
          subject: 'Integration Test CS',
          branch: 'QA Department',
          facultyId,
          classroomId
        }
      ]
    })
  });

  const publishRes = await publishResponse.json() as any;
  if (!publishResponse.ok || !publishRes.success) {
    console.error('❌ Publish slots failed:', publishRes);
    return;
  }
  
  // 5. Verify child slots exist in database and are mapped to the parent
  console.log('🔍 Querying child slots for newly created timetable parent...');
  const childSlots = await prisma.timetableSlot.findMany({
    where: { timetableId }
  });
  console.log(`  -> Database child slots count: ${childSlots.length}`);
  if (childSlots.length === 1 && childSlots[0].subject === 'Integration Test CS') {
    console.log('🛡️  SUCCESS: Child slots created and mapped to the parent correctly.');
  } else {
    console.error('❌ FAIL: Child slot was not correctly mapped to the parent timetable!');
    return;
  }

  // 6. Delete parent Timetable and verify cascading delete cleans up child slots
  console.log('🗑️  Deleting parent Timetable via DELETE /timetable/parent/:id...');
  const deleteResponse = await fetch(`${BASE_URL}/timetable/parent/${timetableId}`, {
    method: 'DELETE',
    headers
  });
  
  const deleteRes = await deleteResponse.json() as any;
  if (!deleteResponse.ok || !deleteRes.success) {
    console.error('❌ Delete parent timetable failed:', deleteRes);
    return;
  }
  console.log('  -> Delete Response status: 200 OK');

  // Verify slots are gone
  console.log('🔍 Checking database for orphaned child slots...');
  const orphanedSlots = await prisma.timetableSlot.findMany({
    where: { timetableId }
  });
  console.log(`  -> Child slots count after parent deletion: ${orphanedSlots.length}`);
  if (orphanedSlots.length === 0) {
    console.log('🛡️  SUCCESS: Cascading delete worked. No orphaned slots left in database.');
  } else {
    console.error('❌ FAIL: Child slots were orphaned after parent timetable was deleted!');
    return;
  }

  console.log('\n✨ Parent timetables integration verification finished successfully!\n');
}

runTests().catch(err => {
  console.error('Error running parent test suite:', err.message);
});
