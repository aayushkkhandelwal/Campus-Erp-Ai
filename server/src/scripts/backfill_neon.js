const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const normalize = (val) => val ? val.trim().toLowerCase().replace(/\s+/g, ' ') : '';

const extractSemesterNumber = (semStr) => {
  const match = semStr.match(/\d+/);
  return match ? match[0] : semStr;
};

async function executeBackfill() {
  console.log('==================================================');
  console.log('   TIMETABLE RELATIONAL DATABASE BACKFILL RUN     ');
  console.log('==================================================\n');

  try {
    // 1. Fetch current records
    const slots = await prisma.timetableSlot.findMany();
    const existingSubjects = await prisma.subject.findMany();
    const departments = await prisma.department.findMany();
    const faculties = await prisma.faculty.findMany();

    console.log(`Processing backfill for ${slots.length} timetable slot rows...\n`);

    const defaultDept = departments.find(d => normalize(d.name).includes('it') || normalize(d.name).includes('information technology'));
    const defaultDeptId = defaultDept ? defaultDept.id : (departments[0]?.id || 'mock-dept-id');

    let subjectsMatched = 0;
    let subjectsCreated = 0;
    let sectionsCreated = 0;
    let slotsUpdated = 0;
    let facultySubjectsLinked = 0;

    // Cache to track subject lookup/creation in memory
    const subjectCache = [...existingSubjects];

    for (const slot of slots) {
      const semNum = extractSemesterNumber(slot.semester);
      const branchText = slot.branch || 'Information Technology';
      const secText = slot.section || 'Section A';

      // A. Match/Resolve Department (Branch)
      const matchedDept = departments.find(d => 
        normalize(d.name) === normalize(branchText) || 
        normalize(d.code) === normalize(branchText)
      ) || defaultDept;

      if (!matchedDept) {
        console.warn(`[WARNING] No matching department found for slot branch: "${branchText}". Skipping slot ID: ${slot.id}`);
        continue;
      }

      // B. Find or Create Subject (normalized name dedup)
      let subjectRecord = subjectCache.find(s => 
        normalize(s.name) === normalize(slot.subject)
      );

      if (!subjectRecord) {
        // Create subject record
        const isLab = slot.subject.toLowerCase().includes('lab') || slot.subject.toLowerCase().includes('practical');
        
        // Generate random unique code
        const safeCodePrefix = slot.subject.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
        const codeNum = 100 + subjectCache.length;
        const code = `${safeCodePrefix}-${codeNum}`;

        subjectRecord = await prisma.subject.create({
          data: {
            name: slot.subject,
            code,
            semester: semNum,
            credits: isLab ? 2 : 4,
            weeklyHours: isLab ? 2 : 4,
            type: isLab ? 'LAB' : 'CLASSROOM',
            departmentId: matchedDept.id
          }
        });
        subjectCache.push(subjectRecord);
        subjectsCreated++;
        console.log(`[CREATE SUBJECT] Created subject "${subjectRecord.name}" (Type: ${subjectRecord.type}, Code: ${subjectRecord.code})`);
      } else {
        subjectsMatched++;
      }

      // C. Find or Create Section
      let sectionRecord = await prisma.section.findUnique({
        where: {
          name_semester_departmentId: {
            name: secText,
            semester: semNum,
            departmentId: matchedDept.id
          }
        }
      });

      if (!sectionRecord) {
        sectionRecord = await prisma.section.create({
          data: {
            name: secText,
            semester: semNum,
            departmentId: matchedDept.id
          }
        });
        sectionsCreated++;
        console.log(`[CREATE SECTION] Created Section "${sectionRecord.name}" (Semester: ${sectionRecord.semester}, Dept: ${matchedDept.name})`);
      }

      // D. Resolve Faculty member
      let matchedFaculty = null;
      if (slot.facultyId) {
        matchedFaculty = faculties.find(f => f.id === slot.facultyId);
      } else if (slot.faculty) {
        matchedFaculty = faculties.find(f => 
          normalize(`${f.firstName} ${f.lastName}`) === normalize(slot.faculty)
        );
      }

      // E. Connect FacultySubject qualification join record
      if (matchedFaculty && subjectRecord) {
        try {
          const qualificationExists = await prisma.facultySubject.findUnique({
            where: {
              facultyId_subjectId: {
                facultyId: matchedFaculty.id,
                subjectId: subjectRecord.id
              }
            }
          });

          if (!qualificationExists) {
            await prisma.facultySubject.create({
              data: {
                facultyId: matchedFaculty.id,
                subjectId: subjectRecord.id
              }
            });
            facultySubjectsLinked++;
            console.log(`[LINK FACULTY-SUBJECT] Qualified "${matchedFaculty.firstName} ${matchedFaculty.lastName}" to teach "${subjectRecord.name}"`);
          }
        } catch (linkErr) {
          // Qualification link might fail if race condition, skip
        }
      }

      // F. Update TimetableSlot foreign relation keys (retaining legacy columns)
      await prisma.timetableSlot.update({
        where: { id: slot.id },
        data: {
          subjectId: subjectRecord.id,
          sectionId: sectionRecord.id
        }
      });
      slotsUpdated++;
    }

    console.log('\n==================================================');
    console.log('   BACKFILL COMPLETED SUCCESSFULLY');
    console.log('==================================================');
    console.log(`- Slots updated with relation links:   ${slotsUpdated}`);
    console.log(`- Subjects created (deduped):          ${subjectsCreated}`);
    console.log(`- Sections created:                    ${sectionsCreated}`);
    console.log(`- Faculty qualifications linked:       ${facultySubjectsLinked}`);
    console.log('==================================================\n');

  } catch (err) {
    console.error('Fatal backfill runtime error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

executeBackfill();
