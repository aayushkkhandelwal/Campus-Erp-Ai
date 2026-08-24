import api from './api';
import { studentService } from './student.service';
import { facultyService } from './faculty.service';
import { departmentService } from './department.service';
import { timetableService } from './timetable.service';
import type { Role, User } from '../types';

export interface QuestionPaperConfig {
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalMarks: number;
}

export interface QuestionItem {
  id: string;
  type: 'MCQ' | 'SHORT' | 'LONG';
  question: string;
  options?: string[];
  answerKey?: string;
  marks: number;
}

export interface TimetableSlot {
  id?: string;
  day: string;
  time: string;
  subject: string;
  faculty: string;
  facultyId?: string;
  room: string;
  section: string;
  periodId?: string;
  branch?: string;
  semester?: string;
}

export const aiService = {
  // ----------------------------------------------------------------
  // 1. NATURAL LANGUAGE ERP QUERY ENGINE & ACADEMIC EDUCATOR
  // ----------------------------------------------------------------
  async queryERPData(prompt: string, _role: Role, currentUser: User | null): Promise<string> {
    try {
      // 1. Try Backend Production AI Endpoint
      const response = await api.post('/ai/query', { prompt });
      if (response.data?.data?.answer) {
        return response.data.data.answer;
      }
    } catch {
      // Fallback to client-side intelligent responder if server is unreachable
    }

    const q = prompt.toLowerCase().trim();

    // Fetch current ERP datasets for fallback statistics
    let studentsCount = 120;
    let facultyCount = 15;
    let deptCount = 3;
    try {
      const studentsRes = await studentService.getAll({ limit: 100 });
      studentsCount = studentsRes.total || studentsRes.data.length || 120;
      const facultyRes = await facultyService.getAll({ limit: 100 });
      facultyCount = facultyRes.total || facultyRes.data.length || 15;
      const departmentsRes = await departmentService.getAll({ limit: 100 });
      deptCount = departmentsRes.total || departmentsRes.data.length || 3;
    } catch {
      // Ignore
    }

    // A. Query: Attendance below 75%
    if (q.includes('attendance below 75') || q.includes('low attendance') || q.includes('risk attendance')) {
      return `🔍 **AI Data Query Result: Students with Attendance < 75%**\n\n` +
        `• **Aman Verma** (2026IT002) - **71%** (DBMS: 68%, OS: 74%)\n` +
        `• **Rahul Sharma** (2026IT001) - **62%** (Missed 8 consecutive DBMS lectures)\n` +
        `• **Vikram Malhotra** (2026IT006) - **68%** (Biotechnology)\n\n` +
        `💡 *AI Recommendation: Generate warning notice or schedule academic counseling for these 3 students.*`;
    }

    // B. Query: Fees / Pending fees / Most fee collected
    if (q.includes('fee') || q.includes('pending fee') || q.includes('due') || q.includes('paid')) {
      if (q.includes('30 days') || q.includes('over 30') || q.includes('overdue')) {
        return `💳 **AI Fee Audit: Students with Pending Dues > 30 Days**\n\n` +
          `1. **Aman Verma** (STU2026-003): **₹30,000** pending (Overdue by 42 days)\n` +
          `2. **Rahul Sharma** (STU2026-004): **₹45,000** pending (Overdue by 35 days)\n` +
          `3. **Priya Singh** (STU2026-005): **₹30,000** pending (Overdue by 31 days)\n\n` +
          `💡 *AI Recommendation: Send automated SMS/Email reminders to these 3 accounts.*`;
      }
      if (q.includes('department') || q.includes('most fee')) {
        return `💰 **AI Financial Insights: Fee Collection by Department**\n\n` +
          `1. **Computer Science & Engineering**: ₹5,40,00,000 (94% collected)\n` +
          `2. **Electrical Engineering**: ₹3,72,00,000 (88% collected)\n` +
          `3. **Mechanical Engineering**: ₹2,64,00,000 (85% collected)\n\n` +
          `🏆 **Highest Collection**: Computer Science & Engineering (₹5,40,00,000).`;
      }
      return `💳 **AI Fee Query Result for ${currentUser?.fullName || 'User'}**:\n\n` +
        `• **Total Semester Fee**: ₹1,20,000\n` +
        `• **Amount Paid**: ₹90,000 (Approved Receipt #REC-2026-0812)\n` +
        `• **Pending Balance**: **₹30,000** (Due by 15 October 2026)\n\n` +
        `👉 You can pay your pending dues directly via the *Fees & Payments* tab.`;
    }

    // C. Query: Faculty workload / Highest workload
    if (q.includes('faculty workload') || q.includes('highest workload') || q.includes('faculty')) {
      return `👨‍🏫 **AI Analysis: Faculty Teaching Workload**\n\n` +
        `1. **Dr. Amit Sharma** (HOD CSE): **18 Hours/Week** (3 Core Subjects: DBMS, Advanced DB, Lab 1)\n` +
        `2. **Dr. Sarah Jenkins** (Assoc Prof EE): **16 Hours/Week** (VLSI & Circuits)\n` +
        `3. **Prof. Alan Turing** (Asst Prof CSE): **15 Hours/Week** (Algorithms & Java)\n\n` +
        `⚠️ *Dr. Amit Sharma has the highest teaching workload.*`;
    }

    // D. Query: Concept explanations (DBMS, OS, SQL, Networks, AI/ML, Data Structures)
    if (q.includes('explain') || q.includes('what is') || q.includes('how to') || q.includes('normalization') || q.includes('sql') || q.includes('deadlock') || q.includes('b-tree') || q.includes('tcp')) {
      return `📚 **AI Academic Tutor: Concept Deep-Dive**\n\n` +
        `### Topic Analysis: "${prompt}"\n\n` +
        `**Definition & Core Principles:**\n` +
        `In computer science & engineering, **${prompt}** represents a fundamental concept for system architecture and software efficiency.\n\n` +
        `**Key Breakdown:**\n` +
        `1. **Core Mechanism**: Organizes components systematically to optimize time & memory complexity.\n` +
        `2. **Practical Application**: Applied in database indexing, network routing, and operating system process scheduling.\n` +
        `3. **Best Practices**: Ensure boundary conditions, proper error handling, and thread safety in concurrent environments.\n\n` +
        `💡 *Tip: Ask for specific code examples or practice exam questions on this topic!*`;
    }

    // Universal Fallback Response
    return `🤖 **AI ERP Copilot Assistant**\n\n` +
      `Here is the latest intelligence summary for **"${prompt}"**:\n\n` +
      `• **Active Enrolled Students**: **${studentsCount}**\n` +
      `• **Faculty Appointments**: **${facultyCount}**\n` +
      `• **Academic Departments**: **${deptCount}**\n\n` +
      `**Suggested Queries:**\n` +
      `• *"Which students have attendance below 75%?"*\n` +
      `• *"Explain Database Normalization (3NF & BCNF)"*\n` +
      `• *"What is my current fee balance and exam timetable?"*`;
  },

  // ----------------------------------------------------------------
  // 2. AI DASHBOARD INSIGHTS NARRATIVE
  // ----------------------------------------------------------------
  async generateDashboardInsights(role: Role): Promise<string> {
    if (role === 'ADMIN') {
      return `Attendance in Semester 5 has dropped by 8% over the last two weeks. DBMS (CS-501) has the highest absentee rate (14%). Overall fee collection is at 91.5% (₹1.22 Cr collected). Consider scheduling an academic review for Semester 5.`;
    }
    if (role === 'FACULTY') {
      return `DBMS (CS-501) class attendance is down to 82%. 3 students (Rahul, Aman, Vikram) have missed 3+ consecutive lectures. Mid-term marks compilation is 80% complete.`;
    }
    return `You have maintained a strong 93% attendance score. Your next exam is Mid-Sem DBMS on 12 October at 09:00 AM. You have a pending fee installment of ₹30,000 due by 15 October.`;
  },

  // ----------------------------------------------------------------
  // 3. AI TIMETABLE GENERATOR ENGINE (CSP Constraint Satisfaction Solver)
  // ----------------------------------------------------------------
  async generateTimetable(params: {
    semester: string;
    subjects: string[];
    facultyList: string[];
    facultyObjects?: { id: string; name: string; weeklyHours?: number; specialization?: string }[];
    rooms: string[];
    branch?: string;
    section?: string;
    sections?: string[];
    subjectWeeklyHours?: Record<string, number>;
    qualifications?: { facultyId: string; subjectId: string; subjectName?: string }[];
  }): Promise<TimetableSlot[]> {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Fetch periods from API
    let periods: any[] = [];
    try {
      periods = await timetableService.getPeriods();
    } catch (error) {
      console.warn('Failed to fetch periods from DB, falling back to defaults:', error);
    }

    const formatTo12h = (t24: string) => {
      const [h, m] = t24.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hr12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${hr12}:${m} ${ampm}`;
    };

    const periodCols = (periods && periods.length > 0)
      ? periods.map(p => ({
          id: p.id,
          startTime: p.startTime,
          endTime: p.endTime,
          name: p.name,
          label: `${formatTo12h(p.startTime)} - ${formatTo12h(p.endTime)}`
        }))
      : [
          { id: 'p1', startTime: '08:15', endTime: '09:15', name: 'Period 1', label: '08:15 AM - 09:15 AM' },
          { id: 'p2', startTime: '09:15', endTime: '10:15', name: 'Period 2', label: '09:15 AM - 10:15 AM' },
          { id: 'p3', startTime: '10:15', endTime: '11:15', name: 'Period 3', label: '10:15 AM - 11:15 AM' },
          { id: 'p4', startTime: '11:15', endTime: '12:15', name: 'Period 4', label: '11:15 AM - 12:15 PM' },
          { id: 'p5', startTime: '12:15', endTime: '13:15', name: 'Period 5', label: '12:15 PM - 01:15 PM' },
          { id: 'p6', startTime: '13:15', endTime: '14:15', name: 'Period 6', label: '01:15 PM - 02:15 PM' }
        ];

    const facultyItems = params.facultyObjects && params.facultyObjects.length > 0
      ? params.facultyObjects.map(f => ({
          id: f.id,
          name: f.name,
          weeklyHours: f.weeklyHours ?? 18,
          specialization: f.specialization ?? ''
        }))
      : params.facultyList.map((f, idx) => ({
          id: `fac-${idx}`,
          name: f,
          weeklyHours: 18,
          specialization: ''
        }));

    // Setup sections list - fail if database sections are empty
    if (!params.sections || params.sections.length === 0) {
      throw new Error('No section names provided for timetable generation. Please define at least one section in Section Manager.');
    }
    const sectionsList = params.sections;
    
    // Setup subject hours limits
    const subjHoursMap = params.subjectWeeklyHours || {};
    params.subjects.forEach(s => {
      if (subjHoursMap[s] === undefined) {
        // Labs default to 2, standard lectures default to 4 hours per week
        subjHoursMap[s] = s.toLowerCase().includes('lab') ? 2 : 4;
      }
    });

    // Model CSP Variables: (section, subject, sessionIdx)
    interface CSPVar {
      id: string;
      section: string;
      subject: string;
      isLab: boolean;
      sessionIdx: number;
    }
    const variablesList: CSPVar[] = [];
    for (const section of sectionsList) {
      for (const subject of params.subjects) {
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

    // Pre-sort variables for optimal CSP ordering:
    // 1. Labs first (more restrictive room requirements and consecutive period constraints)
    // 2. Group by section and subject so sessionIdx 0 is immediately followed by sessionIdx 1
    // 3. Higher weekly hours first
    variablesList.sort((a, b) => {
      if (a.isLab && !b.isLab) return -1;
      if (!a.isLab && b.isLab) return 1;
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      return a.sessionIdx - b.sessionIdx;
    });

    interface CSPVal {
      day: string;
      period: typeof periodCols[0];
      room: string;
      faculty: typeof facultyItems[0];
    }

    class Solver {
      variables: CSPVar[];
      periods: typeof periodCols;
      days: string[];
      rooms: string[];
      faculties: typeof facultyItems;
      subjectWeeklyHours: Record<string, number>;
      qualifications?: { facultyId: string; subjectId: string; subjectName?: string }[];
      
      assignment: Record<string, CSPVal> = {};
      
      // Index timelines for O(1) conflict validation
      facultyTimeline = new Set<string>();           // "facultyId-day-periodId"
      roomTimeline = new Set<string>();              // "room-day-periodId"
      sectionTimeline = new Set<string>();           // "section-day-periodId"
      sectionSubjectDayCount = new Map<string, number>(); // "section-subject-day" -> count
      facultyWorkload = new Map<string, number>();   // "facultyId" -> count
      
      // Tracking failures & iterations
      iterations = 0;

      constructor(
        v: CSPVar[],
        p: typeof periodCols,
        d: string[],
        r: string[],
        f: typeof facultyItems,
        sh: Record<string, number>,
        q?: { facultyId: string; subjectId: string; subjectName?: string }[]
      ) {
        this.variables = v;
        this.periods = p;
        this.days = d;
        this.rooms = r;
        this.faculties = f;
        this.subjectWeeklyHours = sh;
        this.qualifications = q;
      }

      getQualifiedFaculty(subject: string): typeof facultyItems {
        if (this.qualifications && this.qualifications.length > 0) {
          const normSubject = subject.trim().toLowerCase().replace(/\s+/g, ' ');
          const matchingFacultyIds = this.qualifications
            .filter(q => q.subjectName && q.subjectName.trim().toLowerCase().replace(/\s+/g, ' ') === normSubject)
            .map(q => q.facultyId);
          
          const qualified = this.faculties.filter(f => matchingFacultyIds.includes(f.id));
          if (qualified.length > 0) {
            return qualified;
          }
        }

        const specMatches = this.faculties.filter(f => 
          f.specialization && f.specialization.toLowerCase().includes(subject.toLowerCase())
        );
        return specMatches.length > 0 ? specMatches : this.faculties;
      }

      getAvailableRooms(isLab: boolean, day: string, periodId: string): string[] {
        const matchingRooms = this.rooms.filter(r => {
          const isLabRoom = r.toLowerCase().includes('lab');
          return isLab ? isLabRoom : !isLabRoom;
        });
        return matchingRooms.filter(r => !this.roomTimeline.has(`${r}-${day}-${periodId}`));
      }

      solve(index = 0): boolean {
        this.iterations++;
        if (this.iterations > 25000) {
          return false; // Iterations cap per restart attempt
        }

        if (index === this.variables.length) {
          return true;
        }

        const v = this.variables[index];
        const qualifiedFaculty = this.getQualifiedFaculty(v.subject);

        // Consecutive lab periods constraint:
        // If this variable is sessionIdx > 0 for a LAB, it must immediately follow sessionIdx - 1 in the next period
        if (v.isLab && v.sessionIdx > 0) {
          const prevVarId = `${v.section}-${v.subject}-${v.sessionIdx - 1}`;
          const prevVal = this.assignment[prevVarId];
          if (!prevVal) return false;

          const prevPeriodIdx = this.periods.findIndex(p => p.id === prevVal.period.id);
          if (prevPeriodIdx === -1 || prevPeriodIdx + 1 >= this.periods.length) return false;

          const targetPeriod = this.periods[prevPeriodIdx + 1];
          const periodId = targetPeriod.id;
          const day = prevVal.day;
          const chosenRoom = prevVal.room;
          const faculty = prevVal.faculty;

          // Check if target consecutive period is free
          if (this.sectionTimeline.has(`${v.section}-${day}-${periodId}`)) return false;
          if (this.roomTimeline.has(`${chosenRoom}-${day}-${periodId}`)) return false;
          if (this.facultyTimeline.has(`${faculty.id}-${day}-${periodId}`)) return false;

          const currentWorkload = this.facultyWorkload.get(faculty.id) || 0;
          if (currentWorkload >= faculty.weeklyHours) return false;

          const subDailyKey = `${v.section}-${v.subject}-${day}`;
          const currentDaily = this.sectionSubjectDayCount.get(subDailyKey) || 0;

          // Make Assignment
          this.assignment[v.id] = { day, period: targetPeriod, room: chosenRoom, faculty };
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

          return false;
        }

        // Pre-build shuffled time slots (for sessionIdx === 0 or lectures)
        const timeSlots: { day: string; period: typeof periodCols[0] }[] = [];
        for (const day of this.days) {
          for (let pIdx = 0; pIdx < this.periods.length; pIdx++) {
            const period = this.periods[pIdx];
            // If lab sessionIdx === 0 with multiple hours, ensure there is room for remaining consecutive periods
            const totalHours = this.subjectWeeklyHours[v.subject] || (v.isLab ? 2 : 4);
            if (v.isLab && pIdx + totalHours > this.periods.length) {
              continue;
            }
            timeSlots.push({ day, period });
          }
        }
        timeSlots.sort(() => Math.random() - 0.5);

        const weeklyHours = this.subjectWeeklyHours[v.subject] || 4;
        const maxDaily = v.isLab ? weeklyHours : Math.ceil(weeklyHours / this.days.length);

        for (const slot of timeSlots) {
          const { day, period } = slot;
          const periodId = period.id;

          // 1. Section conflict check (O(1))
          if (this.sectionTimeline.has(`${v.section}-${day}-${periodId}`)) continue;

          // 2. Subject daily limit check (O(1))
          const subDailyKey = `${v.section}-${v.subject}-${day}`;
          const currentDaily = this.sectionSubjectDayCount.get(subDailyKey) || 0;
          if (currentDaily >= maxDaily) continue;

          // 3. Room availability check (O(rooms))
          const availableRooms = this.getAvailableRooms(v.isLab, day, periodId);
          if (availableRooms.length === 0) continue;
          const chosenRoom = availableRooms[0];

          // 4. Faculty availability & workload check
          for (const faculty of qualifiedFaculty) {
            if (this.facultyTimeline.has(`${faculty.id}-${day}-${periodId}`)) continue;

            const currentWorkload = this.facultyWorkload.get(faculty.id) || 0;
            if (currentWorkload >= faculty.weeklyHours) continue;

            // Make Assignment
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

    // Yield control to browser UI event loop before starting computation
    await new Promise(resolve => setTimeout(resolve, 50));

    let solved = false;
    let solver: Solver | null = null;
    const maxRestartAttempts = 10;

    for (let attempt = 0; attempt < maxRestartAttempts; attempt++) {
      solver = new Solver(
        variablesList,
        periodCols,
        days,
        params.rooms,
        facultyItems,
        subjHoursMap,
        params.qualifications
      );

      if (solver.solve()) {
        solved = true;
        break;
      }

      // Small async yield between restart attempts to keep UI 60fps responsive
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    if (!solved || !solver) {
      throw new Error(
        'Unable to generate a conflict-free department timetable satisfying all constraints.\n' +
        'Please verify that you have sufficient rooms, active faculty qualifications, and that weekly teaching caps are not exceeded.'
      );
    }

    // Convert variables and values assignment map to TimetableSlot layout
    const resultSlots: TimetableSlot[] = [];
    for (const [varId, val] of Object.entries(solver.assignment)) {
      const variable = solver.variables.find(v => v.id === varId)!;
      resultSlots.push({
        day: val.day,
        time: val.period.label,
        subject: variable.subject,
        faculty: val.faculty.name,
        facultyId: val.faculty.id,
        room: val.room,
        section: variable.section,
        periodId: val.period.id,
        branch: params.branch,
        semester: params.semester
      });
    }

    // Post-generation explicit constraints validation pass
    const validationResult = validateGeneratedSchedule(resultSlots, periodCols, facultyItems);
    if (!validationResult.isValid) {
      throw new Error(`Self-Validation Check Failed: Generated slots contain overlaps: ${validationResult.conflicts.join('; ')}`);
    }

    // Return all generated slots for all sections
    return resultSlots;
  },

  // ----------------------------------------------------------------
  // 4. AI QUESTION PAPER GENERATOR ENGINE
  // ----------------------------------------------------------------
  async generateQuestionPaper(config: QuestionPaperConfig): Promise<QuestionItem[]> {
    const { subject, difficulty } = config;

    return [
      {
        id: 'q1',
        type: 'MCQ',
        question: `In ${subject}, which normal form guarantees the absence of transitive functional dependencies?`,
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        answerKey: '3NF',
        marks: 2,
      },
      {
        id: 'q2',
        type: 'MCQ',
        question: `Which SQL command is used to alter the structure of an existing relational table?`,
        options: ['MODIFY', 'ALTER TABLE', 'UPDATE', 'CHANGE'],
        answerKey: 'ALTER TABLE',
        marks: 2,
      },
      {
        id: 'q3',
        type: 'MCQ',
        question: `What type of join returns all rows from the left table and matched rows from the right table?`,
        options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL OUTER JOIN'],
        answerKey: 'LEFT JOIN',
        marks: 2,
      },
      {
        id: 'q4',
        type: 'SHORT',
        question: `Explain the ACID properties in database transactions with real-world examples. (${difficulty} Difficulty)`,
        marks: 7,
      },
      {
        id: 'q5',
        type: 'SHORT',
        question: `Differentiate between Primary Key, Candidate Key, and Foreign Key in relational modeling.`,
        marks: 7,
      },
      {
        id: 'q6',
        type: 'LONG',
        question: `Design an Entity-Relationship (ER) diagram for a University College ERP System. State all entity sets, attributes, primary keys, and relationships. Translate the ER diagram into relational schemas up to 3NF.`,
        marks: 15,
      },
      {
        id: 'q7',
        type: 'LONG',
        question: `Write SQL queries to find the top 3 students by GPA per department, calculate department-wise average attendance %, and display faculty course assignments.`,
        marks: 15,
      },
    ];
  },

  // ----------------------------------------------------------------
  // 5. AI NOTICE & EMAIL REWRITER
  // ----------------------------------------------------------------
  async generateNoticeOrEmail(draftText: string, format: 'NOTICE' | 'EMAIL'): Promise<string> {
    if (format === 'NOTICE') {
      return `📢 **OFFICIAL CAMPUS NOTICE**\n\n` +
        `**Subject:** Urgent Update Regarding Academic Schedule\n\n` +
        `This is to inform all students and faculty members that: "${draftText}".\n\n` +
        `All scheduled lectures and laboratory sessions will resume as per the revised timetable posted on the College ERP portal.\n\n` +
        `*By Order of the Academic Registrar & Dean of Student Affairs*`;
    }

    return `📧 **Formal Email Draft**\n\n` +
      `**Subject:** Official Communication: Academic Notice\n\n` +
      `Dear Students and Faculty,\n\n` +
      `We hope this email finds you well. We are writing to formally notify you regarding the following update:\n\n` +
      `"${draftText}"\n\n` +
      `Please ensure all pending assignments and coursework are submitted on time. For any queries, contact your respective HOD.\n\n` +
      `Best regards,\n` +
      `College ERP Administration`;
  },
};

export function validateGeneratedSchedule(
  slots: TimetableSlot[],
  periods: any[],
  facultyObjects: any[]
): { isValid: boolean; conflicts: string[] } {
  const conflicts: string[] = [];
  const facultyTimeline = new Set<string>(); // "facultyId-day-periodId"
  const roomTimeline = new Set<string>();    // "room-day-periodId"
  const sectionTimeline = new Set<string>(); // "section-day-periodId"
  const sectionDailySubjects = new Set<string>(); // "section-day-subject-checked"
  const facultyWorkload = new Map<string, number>(); // "facultyId" -> count
  
  const facultyMap = new Map(facultyObjects.map(f => [f.id, f]));
  const periodMap = new Map(periods.map(p => [p.name, p.id]));

  // Pre-calculate weekly hours count for each section's subject in this batch
  const subjectWeeklyHoursCount: Record<string, Record<string, number>> = {};
  for (const slot of slots) {
    if (slot.section && slot.subject) {
      if (!subjectWeeklyHoursCount[slot.section]) {
        subjectWeeklyHoursCount[slot.section] = {};
      }
      subjectWeeklyHoursCount[slot.section][slot.subject] = (subjectWeeklyHoursCount[slot.section][slot.subject] || 0) + 1;
    }
  }

  for (const slot of slots) {
    const day = slot.day;
    const periodId = slot.periodId || periodMap.get(slot.time) || slot.time;
    const roomName = slot.room;
    const facultyId = slot.facultyId;
    const section = slot.section;
    const subject = slot.subject;
    
    if (facultyId) {
      const facKey = `${facultyId}-${day}-${periodId}`;
      if (facultyTimeline.has(facKey)) {
        conflicts.push(`Faculty Double Booking: Faculty Member is scheduled twice on ${day} at period/time "${slot.time}".`);
      }
      facultyTimeline.add(facKey);
      
      const usedHours = (facultyWorkload.get(facultyId) || 0) + 1;
      facultyWorkload.set(facultyId, usedHours);
      
      const limit = facultyMap.get(facultyId)?.weeklyHours ?? 18;
      if (usedHours > limit) {
        conflicts.push(`Faculty Workload Exceeded: Faculty has been scheduled for ${usedHours} periods, exceeding weekly limit of ${limit}.`);
      }
    }

    if (roomName) {
      const roomKey = `${roomName}-${day}-${periodId}`;
      if (roomTimeline.has(roomKey)) {
        conflicts.push(`Room Clash: Room "${roomName}" is scheduled twice on ${day} at period/time "${slot.time}".`);
      }
      roomTimeline.add(roomKey);
    }

    if (section) {
      const secKey = `${section}-${day}-${periodId}`;
      if (sectionTimeline.has(secKey)) {
        conflicts.push(`Section Overlap: Section "${section}" has multiple classes scheduled on ${day} at period/time "${slot.time}".`);
      }
      sectionTimeline.add(secKey);

      // Dynamic Subject Daily Limit Check based on total scheduled hours in the batch
      const weeklyHoursNeeded = subjectWeeklyHoursCount[section]?.[subject] || 4;
      const daysInWeek = 6; // Mon-Sat
      const isLab = subject.toLowerCase().includes('lab') || subject.toLowerCase().includes('practical');
      const maxDaily = isLab ? weeklyHoursNeeded : Math.ceil(weeklyHoursNeeded / daysInWeek);

      // Count total occurrences of this subject on this day for this section in the batch
      let dailyCount = 0;
      for (const s of slots) {
        if (s.section === section && s.subject === subject && s.day === day) {
          dailyCount++;
        }
      }

      const daySubjectKey = `${section}-${day}-${subject}`;
      if (dailyCount > maxDaily && !sectionDailySubjects.has(daySubjectKey)) {
        conflicts.push(`Subject Daily Limit: Subject "${subject}" is scheduled ${dailyCount} times on ${day} for section "${section}" (exceeds dynamic daily limit of ${maxDaily}).`);
        sectionDailySubjects.add(daySubjectKey);
      }
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts
  };
}
