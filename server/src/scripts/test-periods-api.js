require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api/v1';

async function test() {
  console.log('Logging in as administrator...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@college.edu',
      password: 'TempAdmin2026!'
    })
  });

  const loginData = await loginRes.json();
  const cookie = loginRes.headers.get('set-cookie');
  console.log(`Login successful. Cookie received.\n`);

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': cookie || ''
  };

  // Test 1: GET /api/v1/timetable/periods
  console.log('--------------------------------------------------');
  console.log('Test 1: GET /api/v1/timetable/periods');
  const getRes = await fetch(`${BASE_URL}/timetable/periods`, { headers });
  console.log(`Status: ${getRes.status}`);
  const getData = await getRes.json();
  console.log(JSON.stringify(getData, null, 2));
  console.log('');

  const period7 = getData.data.find(p => p.order === 7);
  if (!period7) {
    throw new Error('Period 7 not found in DB!');
  }
  const period7Id = period7.id;

  // Test 2: PUT /api/v1/timetable/periods/:id (valid update: P7 endTime 15:15 -> 15:45)
  console.log('--------------------------------------------------');
  console.log(`Test 2: PUT /api/v1/timetable/periods/${period7Id} (Change Period 7 endTime to 15:45)`);
  const putRes1 = await fetch(`${BASE_URL}/timetable/periods/${period7Id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      startTime: '14:15',
      endTime: '15:45'
    })
  });
  console.log(`Status: ${putRes1.status}`);
  const putData1 = await putRes1.json();
  console.log(JSON.stringify(putData1, null, 2));
  console.log('');

  // Test 3: PUT /api/v1/timetable/periods/:id (overlap validation error)
  console.log('--------------------------------------------------');
  console.log(`Test 3: PUT /api/v1/timetable/periods/${period7Id} (Overlapping startTime to 13:00)`);
  const putRes2 = await fetch(`${BASE_URL}/timetable/periods/${period7Id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      startTime: '13:00',
      endTime: '14:00'
    })
  });
  console.log(`Status: ${putRes2.status}`);
  const putData2 = await putRes2.json();
  console.log(JSON.stringify(putData2, null, 2));
  console.log('');

  // Test 4: PUT /api/v1/timetable/periods/:id (end before start validation error)
  console.log('--------------------------------------------------');
  console.log(`Test 4: PUT /api/v1/timetable/periods/${period7Id} (endTime 15:30 before startTime 15:45)`);
  const putRes3 = await fetch(`${BASE_URL}/timetable/periods/${period7Id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      startTime: '15:45',
      endTime: '15:30'
    })
  });
  console.log(`Status: ${putRes3.status}`);
  const putData3 = await putRes3.json();
  console.log(JSON.stringify(putData3, null, 2));
  console.log('');

  // Revert: Revert Period 7 back to 14:15 - 15:15
  console.log('--------------------------------------------------');
  console.log(`Revert: Reverting Period 7 back to 14:15 - 15:15`);
  const revertRes = await fetch(`${BASE_URL}/timetable/periods/${period7Id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      startTime: '14:15',
      endTime: '15:15'
    })
  });
  console.log(`Status: ${revertRes.status}`);
  const revertData = await revertRes.json();
  console.log(JSON.stringify(revertData, null, 2));
  console.log('');
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
