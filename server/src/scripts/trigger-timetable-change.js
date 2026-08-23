const BASE_URL = 'http://localhost:5000/api/v1';

async function run() {
  console.log('Waiting 12 seconds for browser agent to settle...');
  await new Promise(r => setTimeout(r, 12000));

  console.log('Logging in as admin to publish change...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@college.edu',
      password: 'TempAdmin2026!'
    })
  });

  const cookie = loginRes.headers.get('set-cookie');
  console.log('Logged in as admin.');

  // Fetch current published slots to clone them with a small change
  const getRes = await fetch(`${BASE_URL}/timetable?semester=Semester%205`, {
    headers: { 'Cookie': cookie || '' }
  });
  const getData = await getRes.json();
  const currentSlots = getData.data || [];

  if (currentSlots.length === 0) {
    console.log('No current slots found to change. Publishing default mock slots...');
    // Publish a simple mock slot
    await fetch(`${BASE_URL}/timetable/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie || ''
      },
      body: JSON.stringify({
        semester: 'Semester 5',
        slots: [
          {
            day: 'Monday',
            time: '08:15 - 09:15 AM',
            subject: 'DBMS (CS-501)',
            room: 'Room 201',
            faculty: 'Dr. Robert Langdon'
          }
        ]
      })
    });
  } else {
    console.log(`Found ${currentSlots.length} slots. Modifying first slot subject...`);
    // Modify one slot's subject to trigger change detection
    const updatedSlots = currentSlots.map((s, index) => {
      return {
        day: s.day,
        time: s.time,
        subject: index === 0 ? (s.subject.includes('(Updated)') ? s.subject.replace(' (Updated)', '') : `${s.subject} (Updated)`) : s.subject,
        room: s.room,
        faculty: s.faculty
      };
    });

    const pubRes = await fetch(`${BASE_URL}/timetable/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie || ''
      },
      body: JSON.stringify({
        semester: 'Semester 5',
        slots: updatedSlots
      })
    });
    const pubData = await pubRes.json();
    console.log('Publish result:', pubData.success ? 'SUCCESS' : 'FAILED', pubData.message);
  }
}

run().catch(console.error);
