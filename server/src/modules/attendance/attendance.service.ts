import prisma from '../../prisma/client';

export interface AttendanceRecordInput {
  studentId?: string;
  studentRollNo: string;
  studentName: string;
  present: boolean;
}

export const saveAttendanceBatch = async (
  subject: string,
  date: string,
  records: AttendanceRecordInput[],
  markedBy?: string,
  userRole?: string,
  finalize: boolean = true
) => {
  // Check if batch is already finalized
  const existingBatch = await prisma.attendanceRecord.findFirst({
    where: { subject, date, isFinalized: true },
  });

  if (existingBatch && userRole !== 'ADMIN') {
    throw new Error('Attendance for this class session is finalized and locked. Only an Administrator can modify locked attendance.');
  }

  const results = await Promise.all(
    records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: {
          subject_date_studentRollNo: {
            subject,
            date,
            studentRollNo: r.studentRollNo,
          },
        },
        update: {
          studentName: r.studentName,
          present: r.present,
          markedBy,
          isFinalized: finalize,
        },
        create: {
          subject,
          date,
          studentId: r.studentId || null,
          studentRollNo: r.studentRollNo,
          studentName: r.studentName,
          present: r.present,
          markedBy,
          isFinalized: finalize,
        },
      })
    )
  );

  return results;
};

export const getAttendance = async (subject?: string, date?: string) => {
  const where: any = {};
  if (subject) where.subject = subject;
  if (date) where.date = date;

  return prisma.attendanceRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
};

export const getStudentSummary = async (studentRollNo: string) => {
  const records = await prisma.attendanceRecord.findMany({
    where: { studentRollNo },
  });

  const subjectMap = new Map<
    string,
    { subject: string; present: number; absent: number }
  >();

  records.forEach((r) => {
    if (!subjectMap.has(r.subject)) {
      subjectMap.set(r.subject, { subject: r.subject, present: 0, absent: 0 });
    }
    const item = subjectMap.get(r.subject)!;
    if (r.present) {
      item.present += 1;
    } else {
      item.absent += 1;
    }
  });

  const breakdown = Array.from(subjectMap.values()).map((s) => {
    const total = s.present + s.absent;
    const percent = total > 0 ? Math.round((s.present / total) * 100) : 100;
    return {
      subject: s.subject,
      present: s.present,
      absent: s.absent,
      total,
      percent,
    };
  });

  return {
    studentRollNo,
    totalClasses: records.length,
    totalPresent: records.filter((r) => r.present).length,
    totalAbsent: records.filter((r) => !r.present).length,
    breakdown,
  };
};
