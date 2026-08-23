const performance = require('perf_hooks').performance;

function solveTimetableBenchmark() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [
    { id: 'p1', label: '08:15 AM - 09:15 AM' },
    { id: 'p2', label: '09:15 AM - 10:15 AM' },
    { id: 'p3', label: '10:15 AM - 11:15 AM' },
    { id: 'p4', label: '11:15 AM - 12:15 PM' },
    { id: 'p5', label: '12:15 PM - 01:15 PM' },
    { id: 'p6', label: '01:15 PM - 02:15 PM' }
  ];

  const sections = ['Section A', 'Section B', 'Section C'];
  
  const subjects = [
    { name: 'ADVANCE JAVA LAB', hours: 2, isLab: true },
    { name: 'CANS', hours: 3, isLab: false },
    { name: 'CLOUD COMPUTING', hours: 2, isLab: false },
    { name: 'CRT', hours: 6, isLab: true },
    { name: 'DAA', hours: 3, isLab: false },
    { name: 'DAA LAB', hours: 2, isLab: true },
    { name: 'ITR', hours: 1, isLab: true },
    { name: 'MERN', hours: 3, isLab: false },
    { name: 'MERN LAB', hours: 2, isLab: true },
    { name: 'ML', hours: 3, isLab: false }
  ];

  const rooms = [
    { name: 'Room 401', isLab: false },
    { name: 'Room 402', isLab: false },
    { name: 'Room 403', isLab: false },
    { name: 'Room 404', isLab: false },
    { name: 'Room 405', isLab: false },
    { name: 'Room 406', isLab: false },
    { name: 'Room LAB 1', isLab: true },
    { name: 'Room LAB 2', isLab: true },
    { name: 'Room LAB 3', isLab: true },
    { name: 'Room LAB 4', isLab: true },
    { name: 'Room LAB 5', isLab: true },
    { name: 'Room LAB 6', isLab: true },
    { name: 'Room LAB 7', isLab: true }
  ];

  const faculties = [
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

  // Distribute qualifications
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
  const variables = [];
  for (const sec of sections) {
    for (const sub of subjects) {
      for (let i = 0; i < sub.hours; i++) {
        variables.push({
          id: `${sec}-${sub.name}-${i}`,
          section: sec,
          subject: sub.name,
          isLab: sub.isLab,
          sessionIdx: i
        });
      }
    }
  }

  // Pre-sort variables: Labs first, then higher weekly hours
  variables.sort((a, b) => {
    if (a.isLab && !b.isLab) return -1;
    if (!a.isLab && b.isLab) return 1;
    return a.section.localeCompare(b.section);
  });

  console.log(`Total variables to solve: ${variables.length}`);

  class OptimizedSolver {
    constructor() {
      this.assignment = {};
      this.facultyTimeline = new Set();
      this.roomTimeline = new Set();
      this.sectionTimeline = new Set();
      this.sectionSubjectDayCount = new Map();
      this.facultyWorkload = new Map();
      this.iterations = 0;
    }

    getQualifiedFaculty(subjectName) {
      const matchIds = qualifications
        .filter(q => q.subjectName.toLowerCase() === subjectName.toLowerCase())
        .map(q => q.facultyId);
      const matched = faculties.filter(f => matchIds.includes(f.id));
      return matched.length > 0 ? matched : faculties;
    }

    getAvailableRooms(isLab, day, periodId) {
      const targetRooms = rooms.filter(r => r.isLab === isLab);
      return targetRooms.filter(r => !this.roomTimeline.has(`${r.name}-${day}-${periodId}`));
    }

    solve(index = 0) {
      this.iterations++;
      if (this.iterations > 30000) return false;

      if (index === variables.length) {
        return true;
      }

      const v = variables[index];
      const qualifiedFaculty = this.getQualifiedFaculty(v.subject);

      // Try (day, period) slots
      const timeSlots = [];
      for (const day of days) {
        for (const p of periods) {
          timeSlots.push({ day, period: p });
        }
      }
      // Shuffle time slots
      timeSlots.sort(() => Math.random() - 0.5);

      for (const slot of timeSlots) {
        const { day, period } = slot;
        const periodId = period.id;

        // 1. Section conflict
        if (this.sectionTimeline.has(`${v.section}-${day}-${periodId}`)) continue;

        // 2. Daily subject limit (e.g. max 1 per day, or 2 if high hours)
        const subDailyKey = `${v.section}-${v.subject}-${day}`;
        const currentDailyCount = this.sectionSubjectDayCount.get(subDailyKey) || 0;
        const maxDaily = v.isLab ? 1 : 1;
        if (currentDailyCount >= maxDaily) continue;

        // 3. Find suitable free room
        const freeRooms = this.getAvailableRooms(v.isLab, day, periodId);
        if (freeRooms.length === 0) continue;
        const chosenRoom = freeRooms[0].name;

        // 4. Find free qualified faculty
        for (const faculty of qualifiedFaculty) {
          if (this.facultyTimeline.has(`${faculty.id}-${day}-${periodId}`)) continue;
          
          const currentWorkload = this.facultyWorkload.get(faculty.id) || 0;
          if (currentWorkload >= faculty.weeklyHours) continue;

          // Make assignment
          this.assignment[v.id] = { day, period, room: chosenRoom, faculty };
          this.facultyTimeline.add(`${faculty.id}-${day}-${periodId}`);
          this.roomTimeline.add(`${chosenRoom}-${day}-${periodId}`);
          this.sectionTimeline.add(`${v.section}-${day}-${periodId}`);
          this.sectionSubjectDayCount.set(subDailyKey, currentDailyCount + 1);
          this.facultyWorkload.set(faculty.id, currentWorkload + 1);

          if (this.solve(index + 1)) {
            return true;
          }

          // Backtrack
          delete this.assignment[v.id];
          this.facultyTimeline.delete(`${faculty.id}-${day}-${periodId}`);
          this.roomTimeline.delete(`${chosenRoom}-${day}-${periodId}`);
          this.sectionTimeline.delete(`${v.section}-${day}-${periodId}`);
          this.sectionSubjectDayCount.set(subDailyKey, currentDailyCount);
          this.facultyWorkload.set(faculty.id, currentWorkload);
        }
      }

      return false;
    }
  }

  const t0 = performance.now();
  let success = false;
  let attempts = 0;
  let solverInstance = null;

  while (!success && attempts < 5) {
    attempts++;
    solverInstance = new OptimizedSolver();
    success = solverInstance.solve();
  }

  const t1 = performance.now();
  console.log(`Solved: ${success}, Attempts: ${attempts}, Iterations: ${solverInstance.iterations}, Time: ${(t1 - t0).toFixed(2)}ms`);
  console.log(`Total slots assigned: ${Object.keys(solverInstance.assignment).length}`);
}

solveTimetableBenchmark();
