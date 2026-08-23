const performance = require('perf_hooks').performance;

function testFullScheduler() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [
    { id: 'p1', startTime: '08:15', endTime: '09:15', name: 'Period 1', label: '08:15 AM - 09:15 AM' },
    { id: 'p2', startTime: '09:15', endTime: '10:15', name: 'Period 2', label: '09:15 AM - 10:15 AM' },
    { id: 'p3', startTime: '10:15', endTime: '11:15', name: 'Period 3', label: '10:15 AM - 11:15 AM' },
    { id: 'p4', startTime: '11:15', endTime: '12:15', name: 'Period 4', label: '11:15 AM - 12:15 PM' },
    { id: 'p5', startTime: '12:15', endTime: '13:15', name: 'Period 5', label: '12:15 PM - 01:15 PM' },
    { id: 'p6', startTime: '13:15', endTime: '14:15', name: 'Period 6', label: '01:15 PM - 02:15 PM' }
  ];

  const sectionsList = ['Section A', 'Section B', 'Section C'];
  const subjectsList = [
    'ADVANCE JAVA LAB',
    'CANS',
    'CLOUD COMPUTING',
    'CRT',
    'DAA',
    'DAA LAB',
    'ITR',
    'MERN',
    'MERN LAB',
    'ML'
  ];

  const subjHoursMap = {
    'ADVANCE JAVA LAB': 2,
    'CANS': 3,
    'CLOUD COMPUTING': 2,
    'CRT': 6,
    'DAA': 3,
    'DAA LAB': 2,
    'ITR': 1,
    'MERN': 3,
    'MERN LAB': 2,
    'ML': 3
  };

  const roomsList = [
    'Room 401', 'Room 402', 'Room 403', 'Room 404', 'Room 405', 'Room 406',
    'Room Lab 1', 'Room Lab 2', 'Room Lab 3', 'Room Lab 4', 'Room Lab 5', 'Room Lab 6', 'Room Lab 7'
  ];

  const facultyItems = [
    { id: 'fac-1', name: 'Dr. Anju Rajput', weeklyHours: 20 },
    { id: 'fac-2', name: 'Jagendra Choudhary', weeklyHours: 20 },
    { id: 'fac-3', name: 'Manju Choudhary', weeklyHours: 20 },
    { id: 'fac-4', name: 'Nikhar Bhatnagar', weeklyHours: 20 },
    { id: 'fac-5', name: 'Praveen Kumar Yadav', weeklyHours: 20 },
    { id: 'fac-6', name: 'Dr. Saroj Agrawal', weeklyHours: 20 },
    { id: 'fac-7', name: 'Shalini Singhal', weeklyHours: 20 },
    { id: 'fac-8', name: 'Vipin Jain', weeklyHours: 20 },
    { id: 'fac-9', name: 'Praveen Saraswat', weeklyHours: 20 }
  ];

  const qualifications = [
    { facultyId: 'fac-1', subjectName: 'ADVANCE JAVA LAB' },
    { facultyId: 'fac-2', subjectName: 'CANS' },
    { facultyId: 'fac-3', subjectName: 'CLOUD COMPUTING' },
    { facultyId: 'fac-4', subjectName: 'CRT' },
    { facultyId: 'fac-5', subjectName: 'DAA' },
    { facultyId: 'fac-6', subjectName: 'DAA LAB' },
    { facultyId: 'fac-7', subjectName: 'ITR' },
    { facultyId: 'fac-8', subjectName: 'MERN' },
    { facultyId: 'fac-9', subjectName: 'MERN LAB' },
    { facultyId: 'fac-1', subjectName: 'ML' },
    { facultyId: 'fac-2', subjectName: 'ML' }
  ];

  // Build Variables
  const variablesList = [];
  for (const section of sectionsList) {
    for (const subject of subjectsList) {
      const hours = subjHoursMap[subject] || 3;
      const isLab = subject.toLowerCase().includes('lab') || subject.toLowerCase().includes('practical');
      for (let i = 0; i < hours; i++) {
        variablesList.push({
          id: `${section}-${subject}-${i}`,
          section,
          subject,
          isLab,
          sessionIdx: i
        });
      }
    }
  }

  // Pre-sort variables: Labs first, then higher weekly hours
  variablesList.sort((a, b) => {
    if (a.isLab && !b.isLab) return -1;
    if (!a.isLab && b.isLab) return 1;
    const aHours = subjHoursMap[a.subject] || 3;
    const bHours = subjHoursMap[b.subject] || 3;
    if (bHours !== aHours) return bHours - aHours;
    return a.section.localeCompare(b.section);
  });

  class Solver {
    constructor() {
      this.assignment = {};
      this.facultyTimeline = new Set();
      this.roomTimeline = new Set();
      this.sectionTimeline = new Set();
      this.sectionSubjectDayCount = new Map();
      this.facultyWorkload = new Map();
      this.iterations = 0;
    }

    getQualifiedFaculty(subject) {
      if (qualifications && qualifications.length > 0) {
        const normSubject = subject.trim().toLowerCase().replace(/\s+/g, ' ');
        const matchingFacultyIds = qualifications
          .filter(q => q.subjectName && q.subjectName.trim().toLowerCase().replace(/\s+/g, ' ') === normSubject)
          .map(q => q.facultyId);
        
        const qualified = facultyItems.filter(f => matchingFacultyIds.includes(f.id));
        if (qualified.length > 0) return qualified;
      }
      return facultyItems;
    }

    getAvailableRooms(isLab, day, periodId) {
      const matchingRooms = roomsList.filter(r => {
        const isLabRoom = r.toLowerCase().includes('lab');
        return isLab ? isLabRoom : !isLabRoom;
      });
      return matchingRooms.filter(r => !this.roomTimeline.has(`${r}-${day}-${periodId}`));
    }

    solve(index = 0) {
      this.iterations++;
      if (this.iterations > 20000) return false;

      if (index === variablesList.length) {
        return true;
      }

      const v = variablesList[index];
      const qualifiedFaculty = this.getQualifiedFaculty(v.subject);

      // Try time slots
      const timeSlots = [];
      for (const day of days) {
        for (const p of periods) {
          timeSlots.push({ day, period: p });
        }
      }
      timeSlots.sort(() => Math.random() - 0.5);

      const weeklyHours = subjHoursMap[v.subject] || 4;
      const maxDaily = Math.ceil(weeklyHours / days.length);

      for (const slot of timeSlots) {
        const { day, period } = slot;
        const periodId = period.id;

        // 1. Section conflict
        if (this.sectionTimeline.has(`${v.section}-${day}-${periodId}`)) continue;

        // 2. Daily subject limit
        const subDailyKey = `${v.section}-${v.subject}-${day}`;
        const currentDaily = this.sectionSubjectDayCount.get(subDailyKey) || 0;
        if (currentDaily >= maxDaily) continue;

        // 3. Room availability
        const availableRooms = this.getAvailableRooms(v.isLab, day, periodId);
        if (availableRooms.length === 0) continue;
        const chosenRoom = availableRooms[0];

        // 4. Faculty availability & workload
        for (const faculty of qualifiedFaculty) {
          if (this.facultyTimeline.has(`${faculty.id}-${day}-${periodId}`)) continue;

          const currentWorkload = this.facultyWorkload.get(faculty.id) || 0;
          if (currentWorkload >= faculty.weeklyHours) continue;

          // Assign
          this.assignment[v.id] = { day, period, room: chosenRoom, faculty };
          this.facultyTimeline.add(`${faculty.id}-${day}-${periodId}`);
          this.roomTimeline.add(`${chosenRoom}-${day}-${periodId}`);
          this.sectionTimeline.add(`${v.section}-${day}-${periodId}`);
          this.sectionSubjectDayCount.set(subDailyKey, currentDaily + 1);
          this.facultyWorkload.set(faculty.id, currentWorkload + 1);

          if (this.solve(index + 1)) {
            return true;
          }

          // Backtrack
          delete this.assignment[v.id];
          this.facultyTimeline.delete(`${faculty.id}-${day}-${periodId}`);
          this.roomTimeline.delete(`${chosenRoom}-${day}-${periodId}`);
          this.sectionTimeline.delete(`${v.section}-${day}-${periodId}`);
          this.sectionSubjectDayCount.set(subDailyKey, currentDaily);
          this.facultyWorkload.set(faculty.id, currentWorkload);
        }
      }

      return false;
    }
  }

  const t0 = performance.now();
  let success = false;
  let solver = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    solver = new Solver();
    if (solver.solve()) {
      success = true;
      break;
    }
  }
  const t1 = performance.now();

  console.log(`Full Test Success: ${success}, Time: ${(t1 - t0).toFixed(2)}ms, Total slots: ${Object.keys(solver.assignment).length}`);
}

testFullScheduler();
