const assert = require('assert');

// Ported Solver code to run as a node validation test
function formatTo12h(t24) {
  const [h, m] = t24.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hr12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hr12}:${m} ${ampm}`;
}

const periods = [
  { id: 'p1', startTime: '08:15', endTime: '09:15', name: 'Period 1', label: '08:15 AM - 09:15 AM' },
  { id: 'p2', startTime: '09:15', endTime: '10:15', name: 'Period 2', label: '09:15 AM - 10:15 AM' },
  { id: 'p3', startTime: '10:15', endTime: '11:15', name: 'Period 3', label: '10:15 AM - 11:15 AM' },
  { id: 'p4', startTime: '12:00', endTime: '13:00', name: 'Period 4', label: '12:00 PM - 01:00 PM' },
  { id: 'p5', startTime: '13:00', endTime: '14:00', name: 'Period 5', label: '01:00 PM - 02:00 PM' },
  { id: 'p6', startTime: '14:00', endTime: '15:00', name: 'Period 6', label: '02:00 PM - 03:00 PM' }
];

const rooms = ['Classroom 101', 'Classroom 102', 'DBMS Lab'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const facultyList = [
  { id: 'fac-1', name: 'Robert Langdon', weeklyHours: 12, specialization: 'DBMS' },
  { id: 'fac-2', name: 'Aayush Khandelwal', weeklyHours: 18, specialization: 'Operating Systems' },
  { id: 'fac-3', name: 'Dr. Anju Rajput', weeklyHours: 18, specialization: 'Computer Networks' }
];

const subjects = ['DBMS', 'Operating Systems', 'Computer Networks', 'DBMS Lab'];
const sections = ['Section A', 'Section B'];

const subjectHoursMap = {
  'DBMS': 4,
  'Operating Systems': 4,
  'Computer Networks': 4,
  'DBMS Lab': 2
};

// Build variables: (section, subject, sessionIdx)
const variablesList = [];
for (const section of sections) {
  for (const subject of subjects) {
    const hours = subjectHoursMap[subject];
    for (let i = 0; i < hours; i++) {
      variablesList.push({
        id: `${section}-${subject}-${i}`,
        section,
        subject,
        sessionIdx: i
      });
    }
  }
}

class Solver {
  constructor(v, p, d, r, f, sh) {
    this.variables = v;
    this.periods = p;
    this.days = d;
    this.rooms = r;
    this.faculties = f;
    this.subjectWeeklyHours = sh;
    this.assignment = {};
    this.facultyTimeline = new Set();
    this.roomTimeline = new Set();
    this.sectionTimeline = new Set();
    this.sectionDailySubjects = new Set();
    this.facultyWorkload = new Map();
  }

  getQualifiedFaculty(subject) {
    const specMatches = this.faculties.filter(f => 
      f.specialization && f.specialization.toLowerCase().includes(subject.toLowerCase())
    );
    return specMatches.length > 0 ? specMatches : this.faculties;
  }

  isConsistent(v, val) {
    const periodId = val.period.id;

    // Faculty double-booking
    if (this.facultyTimeline.has(`${val.faculty.id}-${val.day}-${periodId}`)) {
      return false;
    }
    // Room double-booking
    if (this.roomTimeline.has(`${val.room}-${val.day}-${periodId}`)) {
      return false;
    }
    // Section double-booking
    if (this.sectionTimeline.has(`${v.section}-${val.day}-${periodId}`)) {
      return false;
    }
    // Subject once-per-day limit
    if (this.sectionDailySubjects.has(`${v.section}-${val.day}-${v.subject}`)) {
      return false;
    }
    // Faculty workload cap
    const current = this.facultyWorkload.get(val.faculty.id) || 0;
    if (current >= val.faculty.weeklyHours) {
      return false;
    }
    // Room suitability (Labs in Lab room, lectures in non-Lab classroom)
    const isLabSub = v.subject.toLowerCase().includes('lab');
    const isLabRm = val.room.toLowerCase().includes('lab');
    if (isLabSub !== isLabRm) {
      return false;
    }

    return true;
  }

  assign(v, val) {
    const periodId = val.period.id;
    this.assignment[v.id] = val;
    this.facultyTimeline.add(`${val.faculty.id}-${val.day}-${periodId}`);
    this.roomTimeline.add(`${val.room}-${val.day}-${periodId}`);
    this.sectionTimeline.add(`${v.section}-${val.day}-${periodId}`);
    this.sectionDailySubjects.add(`${v.section}-${val.day}-${v.subject}`);
    this.facultyWorkload.set(val.faculty.id, (this.facultyWorkload.get(val.faculty.id) || 0) + 1);
  }

  unassign(v, val) {
    const periodId = val.period.id;
    delete this.assignment[v.id];
    this.facultyTimeline.delete(`${val.faculty.id}-${val.day}-${periodId}`);
    this.roomTimeline.delete(`${val.room}-${val.day}-${periodId}`);
    this.sectionTimeline.delete(`${v.section}-${val.day}-${periodId}`);
    this.sectionDailySubjects.delete(`${v.section}-${val.day}-${v.subject}`);
    this.facultyWorkload.set(val.faculty.id, Math.max(0, (this.facultyWorkload.get(val.faculty.id) || 0) - 1));
  }

  selectUnassignedVariable() {
    let minDomainSize = Infinity;
    let selectedVar = null;

    for (const v of this.variables) {
      if (this.assignment[v.id]) continue;

      let domainSize = 0;
      const qualified = this.getQualifiedFaculty(v.subject);

      for (const day of this.days) {
        for (const period of this.periods) {
          for (const room of this.rooms) {
            for (const faculty of qualified) {
              const val = { day, period, room, faculty };
              if (this.isConsistent(v, val)) {
                domainSize++;
              }
            }
          }
        }
      }

      if (domainSize < minDomainSize) {
        minDomainSize = domainSize;
        selectedVar = v;
      }
    }

    return selectedVar;
  }

  solve() {
    if (Object.keys(this.assignment).length === this.variables.length) {
      return true;
    }

    const variable = this.selectUnassignedVariable();
    if (!variable) return false;

    const qualified = this.getQualifiedFaculty(variable.subject);
    const domainValues = [];
    for (const day of this.days) {
      for (const period of this.periods) {
        for (const room of this.rooms) {
          for (const faculty of qualified) {
            domainValues.push({ day, period, room, faculty });
          }
        }
      }
    }

    for (const val of domainValues) {
      if (this.isConsistent(variable, val)) {
        this.assign(variable, val);
        if (this.solve()) {
          return true;
        }
        this.unassign(variable, val);
      }
    }

    return false;
  }
}

// ----------------------------------------------------
// RUN TEST PASS
// ----------------------------------------------------
console.log('Starting CSP Timetable Scheduler Algorithm Unit Test...');

const solver = new Solver(variablesList, periods, days, rooms, facultyList, subjectHoursMap);
const success = solver.solve();

console.log('Solver execution complete. Success status:', success);

if (success) {
  console.log('✅ PASS: CSP solver found a conflict-free solution!');
  console.log(`Total scheduled session slots: ${Object.keys(solver.assignment).length}`);
  
  // Verify constraints
  const facultyTimeline = new Set();
  const roomTimeline = new Set();
  const sectionTimeline = new Set();
  const sectionDailySubjects = new Set();
  const workloadCounts = new Map();

  for (const [varId, val] of Object.entries(solver.assignment)) {
    const v = variablesList.find(x => x.id === varId);
    const key = `${val.day}-${val.period.id}`;
    
    // Check faculty clash
    const facKey = `${val.faculty.id}-${key}`;
    assert(!facultyTimeline.has(facKey), `Faculty clash on ${facKey}`);
    facultyTimeline.add(facKey);

    // Check room clash
    const roomKey = `${val.room}-${key}`;
    assert(!roomTimeline.has(roomKey), `Room clash on ${roomKey}`);
    roomTimeline.add(roomKey);

    // Check section clash
    const secKey = `${v.section}-${key}`;
    assert(!sectionTimeline.has(secKey), `Section clash on ${secKey}`);
    sectionTimeline.add(secKey);

    // Check daily once limit
    const dailyKey = `${v.section}-${val.day}-${v.subject}`;
    assert(!sectionDailySubjects.has(dailyKey), `Subject scheduled twice on same day for section ${dailyKey}`);
    sectionDailySubjects.add(dailyKey);

    // Check faculty workload
    const curWorkload = (workloadCounts.get(val.faculty.id) || 0) + 1;
    workloadCounts.set(val.faculty.id, curWorkload);
    assert(curWorkload <= val.faculty.weeklyHours, `Faculty workload limit exceeded for ${val.faculty.name}`);
  }

  console.log('✅ PASS: All 5 constraints (Faculty overlap, Room overlap, Section overlap, Daily limits, Workload limits) validated correctly on final output!');
} else {
  console.error('❌ FAIL: Solver failed to find a valid solution under reasonable constraints.');
  process.exit(1);
}
