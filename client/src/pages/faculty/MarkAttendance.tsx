import { useState, useEffect } from 'react';
import { CheckSquare, Check, X, Save, UserCheck, Edit3, RefreshCw, Eye } from 'lucide-react';
import { attendanceService, type StudentAttendanceItem } from '../../services/attendance.service';
import { IndividualAttendanceModal, type IndividualStudentData } from '../../components/attendance/IndividualAttendanceModal';

export const MarkAttendance = () => {
  const [subject, setSubject] = useState('DBMS (CS-501)');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<IndividualStudentData | null>(null);

  const defaultStudents: StudentAttendanceItem[] = [
    { id: 'std-1', name: 'Emma Watson', rollNo: 'STU2026-001', present: true },
    { id: 'std-2', name: 'Liam Chen', rollNo: 'STU2026-002', present: false },
    { id: 'std-3', name: 'Rahul Sharma', rollNo: '2026IT001', present: true },
    { id: 'std-4', name: 'Aman Verma', rollNo: '2026IT002', present: false },
    { id: 'std-5', name: 'Priya Patel', rollNo: '2026IT003', present: true },
    { id: 'std-6', name: 'Rohan Gupta', rollNo: '2026IT004', present: true },
  ];

  const [students, setStudents] = useState<StudentAttendanceItem[]>(defaultStudents);

  useEffect(() => {
    const loadBatch = async () => {
      const existing = await attendanceService.getBatch(subject, date);
      if (existing && existing.length > 0) {
        setStudents(existing);
        setIsEditing(true);
      } else {
        setStudents(defaultStudents);
        setIsEditing(false);
      }
    };
    loadBatch();
  }, [subject, date]);

  const toggleStatus = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, present: !s.present } : s))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, present: true })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await attendanceService.saveBatch(subject, date, students);
      setSavedSuccess(true);
      setIsEditing(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = students.filter((s) => s.present).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
          <CheckSquare className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          Mark Class Attendance
        </h1>
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
          Select subject and date to submit or update daily student attendance records
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          Attendance records for {subject} on {date} successfully {isEditing ? 'updated' : 'saved'}! Student dashboards are updated live.
        </div>
      )}

      {/* Select Controls & Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Select Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              >
                <option value="DBMS (CS-501)">DBMS (CS-501) - Sem 5</option>
                <option value="Operating Systems (CS-502)">Operating Systems (CS-502) - Sem 5</option>
                <option value="Computer Networks (CS-503)">Computer Networks (CS-503) - Sem 5</option>
                <option value="Software Engineering (CS-504)">Software Engineering (CS-504) - Sem 5</option>
                <option value="Java Programming (CS-303)">Java Programming (CS-303) - Sem 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Attendance Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-100 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold">
              {isEditing ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[11px] font-bold">
                  <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                  Mode: Editing Submitted Batch ({date})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-bold">
                  Mode: New Attendance Batch
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-emerald-600 dark:text-emerald-400">Present: {presentCount}</span>
            <span className="text-rose-600 dark:text-rose-400">Absent: {absentCount}</span>
          </div>
          <button
            type="button"
            onClick={markAllPresent}
            className="w-full mt-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors"
          >
            Mark All Present
          </button>
        </div>
      </div>

      {/* Attendance Form Table */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-amber-100 dark:border-stone-800 text-stone-400 uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4 text-center">Individual Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-stone-800">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {student.rollNo}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-stone-900 dark:text-white">
                      {student.name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleStatus(student.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                          student.present
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                        }`}
                      >
                        {student.present ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            Present
                          </>
                        ) : (
                          <>
                            <X className="h-3.5 w-3.5 text-rose-600" />
                            Absent
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent({ rollNo: student.rollNo, name: student.name })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 text-amber-800 dark:bg-stone-800 dark:text-stone-300 border border-amber-200 dark:border-stone-700 text-xs font-extrabold hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        View Attendance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-amber-100 dark:border-stone-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving Attendance...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Update Attendance Batch' : 'Submit Attendance Batch'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <IndividualAttendanceModal
        student={selectedStudent}
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};

export default MarkAttendance;
