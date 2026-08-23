const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Helper to normalize names for comparison
const normalize = (val) => val ? val.trim().toLowerCase().replace(/\s+/g, ' ') : '';

// Helper to convert "Semester 5" -> "5"
const extractSemesterNumber = (semStr) => {
  const match = semStr.match(/\d+/);
  return match ? match[0] : semStr;
};

async function dryRun() {
  console.log('==================================================================');
  console.log('   TIMETABLE RELATIONAL BACKFILL DRY-RUN REPORT (DEDUPED & AUDITED)');
  console.log('==================================================================\n');

  try {
    // 1. Fetch current database entities
    const slots = await prisma.timetableSlot.findMany();
    const subjects = await prisma.subject.findMany({ include: { department: true } });
    const departments = await prisma.department.findMany();
    const faculties = await prisma.faculty.findMany();
    
    // In our dry-run, we will simulate the creation of Section records 
    // since Section is a new table and currently has 0 rows.
    const mockSections = [];
    
    // Local cache for subjects to simulate find-or-create dedup logic
    const mockSubjects = [...subjects];
    let simulatedSubjectCreates = 0;

    // Faculty-Subject join table assignments simulated list
    const mockFacultySubjects = [];

    console.log(`Auditing ${slots.length} existing TimetableSlot rows...\n`);
    
    let cleanMatches = 0;
    let autoCreatesNeeded = 0;
    let warnings = 0;

    const reportRows = [];

    // First, verify/resolve default department (IT)
    const defaultDept = departments.find(d => normalize(d.name).includes('it') || normalize(d.name).includes('information technology'));
    const defaultDeptId = defaultDept ? defaultDept.id : (departments[0]?.id || 'mock-dept-id');

    for (const slot of slots) {
      const semNum = extractSemesterNumber(slot.semester);
      const branchText = slot.branch || 'Information Technology';
      const secText = slot.section || 'Section A';
      
      // A. Match Department (Branch)
      const matchedDept = departments.find(d => 
        normalize(d.name) === normalize(branchText) || 
        normalize(d.code) === normalize(branchText)
      ) || defaultDept;

      // B. Resolve Subject using find-or-create logic
      let matchedSubject = mockSubjects.find(s => 
        normalize(s.name) === normalize(slot.subject)
      );

      let createdThisRun = false;
      if (!matchedSubject) {
        // Simulate create with normalized LAB classification
        const isLab = slot.subject.toLowerCase().includes('lab') || slot.subject.toLowerCase().includes('practical');
        matchedSubject = {
          id: `sim-subj-${normalize(slot.subject).replace(/\s+/g, '-')}`,
          name: slot.subject,
          code: `${slot.subject.toUpperCase().slice(0, 3)}-${100 + mockSubjects.length}`,
          semester: semNum,
          credits: isLab ? 2 : 4,
          weeklyHours: isLab ? 2 : 4,
          type: isLab ? 'LAB' : 'CLASSROOM',
          departmentId: matchedDept?.id || defaultDeptId,
          departmentName: matchedDept?.name || 'Information Technology'
        };
        mockSubjects.push(matchedSubject);
        simulatedSubjectCreates++;
        createdThisRun = true;
      }

      // C. Match/Simulate Section
      let matchedSection = null;
      if (matchedDept) {
        matchedSection = mockSections.find(s => 
          normalize(s.name) === normalize(secText) &&
          s.semester === semNum &&
          s.departmentId === matchedDept.id
        );
        
        if (!matchedSection) {
          matchedSection = {
            id: `mock-sec-${mockSections.length + 1}`,
            name: secText,
            semester: semNum,
            departmentId: matchedDept.id,
            departmentName: matchedDept.name
          };
          mockSections.push(matchedSection);
        }
      }

      // D. Resolve Faculty
      let matchedFaculty = null;
      if (slot.facultyId) {
        matchedFaculty = faculties.find(f => f.id === slot.facultyId);
      } else if (slot.faculty) {
        matchedFaculty = faculties.find(f => 
          normalize(`${f.firstName} ${f.lastName}`) === normalize(slot.faculty)
        );
      }

      // E. Simulate FacultySubject assignment
      let facultySubjectStatus = 'N/A';
      if (matchedFaculty && matchedSubject) {
        const alreadyAssigned = mockFacultySubjects.some(fs => 
          fs.facultyId === matchedFaculty.id && fs.subjectId === matchedSubject.id
        );
        if (!alreadyAssigned) {
          mockFacultySubjects.push({
            facultyId: matchedFaculty.id,
            facultyName: `${matchedFaculty.firstName} ${matchedFaculty.lastName}`,
            subjectId: matchedSubject.id,
            subjectName: matchedSubject.name
          });
          facultySubjectStatus = `LINKED: ${matchedFaculty.firstName} ${matchedFaculty.lastName} qualified to teach ${matchedSubject.name}`;
        } else {
          facultySubjectStatus = 'ALREADY ASSIGNED (DEDUPED)';
        }
      }

      const rowReport = {
        slotId: slot.id,
        semester: slot.semester,
        day: slot.day,
        time: slot.time,
        originalSubject: slot.subject,
        originalSection: slot.section,
        originalBranch: slot.branch,
        subjectMatch: matchedSubject 
          ? `${createdThisRun ? '[AUTO-CREATE SIMULATED]' : '[FOUND IN DB/CACHE]'} "${matchedSubject.name}" (${matchedSubject.type}, Hours: ${matchedSubject.weeklyHours})` 
          : 'MISSING',
        sectionMatch: matchedSection 
          ? `[RESOLVED] "${matchedSection.name}" (Dept: ${matchedSection.departmentName}, Sem: ${matchedSection.semester})` 
          : 'ORPHAN',
        facultyMatch: matchedFaculty 
          ? `[RESOLVED] "${matchedFaculty.firstName} ${matchedFaculty.lastName}" (ID: ${matchedFaculty.id})`
          : 'NONE',
        qualificationLink: facultySubjectStatus,
        status: createdThisRun ? 'SIMULATED_CREATE_SUBJECT' : 'MATCHED_OK'
      };

      if (createdThisRun) {
        autoCreatesNeeded++;
      } else {
        cleanMatches++;
      }

      reportRows.push(rowReport);
    }

    // Print summary
    console.log('------------------------------------------------------------------');
    console.log('SUMMARY STATS:');
    console.log(`- Total Timetable Slots Processed:               ${slots.length}`);
    console.log(`- Clean Matches found in existing DB subjects:   ${slots.length - simulatedSubjectCreates}`);
    console.log(`- Distinct new Subject rows to be created:       ${simulatedSubjectCreates}`);
    console.log(`- Unique FacultySubject qualifications to link:  ${mockFacultySubjects.length}`);
    console.log(`- Distinct Section records to be created:        ${mockSections.length}`);
    console.log('------------------------------------------------------------------\n');

    console.log('FACULTY-SUBJECT QUALIFICATIONS GENERATED:');
    mockFacultySubjects.forEach((fs, idx) => {
      console.log(`  ${idx + 1}. Faculty "${fs.facultyName}" -> Subject "${fs.subjectName}"`);
    });
    console.log('');

    console.log('SECTIONS GENERATED:');
    mockSections.forEach((sec, idx) => {
      console.log(`  ${idx + 1}. Section "${sec.name}" (Semester ${sec.semester}, Dept: ${sec.departmentName})`);
    });
    console.log('');

    console.log('FULL 42-ROW DETAILED MATCHING LOG:');
    reportRows.forEach((r, idx) => {
      console.log(`[Slot ${idx + 1}/${slots.length}] ID: ${r.slotId} | ${r.semester} | ${r.day} ${r.time}`);
      console.log(`  - Subject: "${r.originalSubject}" -> ${r.subjectMatch}`);
      console.log(`  - Section: "${r.originalSection}" (${r.originalBranch}) -> ${r.sectionMatch}`);
      console.log(`  - Faculty: ${r.facultyMatch}`);
      console.log(`  - Qualification: ${r.qualificationLink}`);
      console.log('  --------------------------------------------------------------');
    });

  } catch (err) {
    console.error('Dry-run failed with error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

dryRun();
