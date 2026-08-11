import { useState, useEffect } from 'react';
import { CheckSquare, CheckCircle2, XCircle, RefreshCw, Calendar, BookOpen } from 'lucide-react';
import { attendanceService, type SubjectAttendanceSummary } from '../../services/attendance.service';
import { useAuth } from '../../context/AuthContext';

export const StudentAttendance = () => {
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  const defaultStudentsList = [
    { rollNo: 'STU-2026-001', name: 'Emma Watson' },
    { rollNo: 'STU-2026-002', name: 'Aayush Khandelwal' },
    { rollNo: 'STU-2026-003', name: 'Aayush K' },
    { rollNo: 'STU-2026-004', name: 'Chintan J' },
    { rollNo: '2026IT001', name: 'Rahul Sharma' },
    { rollNo: '2026IT002', name: 'Aman Verma' },
  ];

  const getRollNo = () => {
    if (user?.email === 'student@college.edu') return 'STU-2026-001';
    if (user?.email === 'aayushkkhandelwal@gmail.com') return 'STU-2026-002';
    if (user?.email === 'aayushkkhandelwal1511@gmail.com') return 'STU-2026-003';
    if (user?.email === 'chintanj982@gmail.com') return 'STU-2026-004';
    return user?.id || 'STU-2026-001';
  };

  const [selectedRollNo, setSelectedRollNo] = useState(getRollNo());
  const [attendanceBreakdown, setAttendanceBreakdown] = useState<SubjectAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subject' | 'daily'>('subject');

  const loadAttendance = async (roll: string) => {
    setLoading(true);
    try {
      const summary = await attendanceService.getStudentSummary(roll);
      setAttendanceBreakdown(summary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance(selectedRollNo);
  }, [selectedRollNo]);

  // Sample Daily Attendance History Log for Selected Student
  const dailyLogs = [
    { date: '2026-08-11', subject: 'Database Management Systems', code: 'CS-501', status: 'PRESENT', time: '09:00 - 10:00 AM', room: 'Room 201' },
    { date: '2026-08-11', subject: 'Operating Systems', code: 'CS-502', status: 'PRESENT', time: '11:00 - 12:00 PM', room: 'Lab 3' },
    { date: '2026-08-10', subject: 'Computer Networks', code: 'CS-503', status: 'PRESENT', time: '09:00 - 10:00 AM', room: 'Lab 2' },
    { date: '2026-08-10', subject: 'Software Engineering', code: 'CS-504', status: 'ABSENT', time: '10:00 - 11:00 AM', room: 'Room 201' },
    { date: '2026-08-08', subject: 'DBMS Lab Practical', code: 'CS-501L', status: 'PRESENT', time: '02:00 - 04:00 PM', room: 'Lab 1' },
    { date: '2026-08-07', subject: 'Artificial Intelligence', code: 'CS-505', status: 'PRESENT', time: '10:00 - 11:00 AM', room: 'Room 104' },
    { date: '2026-08-06', subject: 'Operating Systems', code: 'CS-502', status: 'PRESENT', time: '09:00 - 10:00 AM', room: 'Lab 3' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
            <CheckSquare className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            Individual Student Attendance Portal
          </h1>
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
            Detailed breakdown of subject-wise attendance and daily class logs ({selectedRollNo})
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAttendance(selectedRollNo)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Admin / Faculty Individual Student Selector */}
      {role !== 'STUDENT' && (
        <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-2">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Select Individual Student Record
          </label>
          <select
            value={selectedRollNo}
            onChange={(e) => setSelectedRollNo(e.target.value)}
            className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-extrabold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white cursor-pointer"
          >
            {defaultStudentsList.map((st) => (
              <option key={st.rollNo} value={st.rollNo}>
                {st.name} ({st.rollNo})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-amber-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('subject')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer font-['Outfit'] ${
            activeTab === 'subject'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Subject-wise Summary
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer font-['Outfit'] ${
            activeTab === 'daily'
              ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Daily Date History Logs ({dailyLogs.length})
        </button>
      </div>

      {/* TAB 1: SUBJECT-WISE SUMMARY */}
      {activeTab === 'subject' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {attendanceBreakdown.map((item) => {
            const totalClasses = item.present + item.absent;
            return (
              <div
                key={item.subject}
                className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-black font-mono">
                    {item.code}
                  </span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                    {item.percent}%
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white">
                    {item.subject}
                  </h3>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
                    Faculty: {item.faculty} • Total Classes: <strong className="text-stone-800 dark:text-stone-200">{totalClasses}</strong>
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-stone-100 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-amber-100 dark:border-stone-800">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Present: {item.present} classes
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <XCircle className="h-3.5 w-3.5" /> Absent: {item.absent} classes
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: DAILY DATE HISTORY LOGS */}
      {activeTab === 'daily' && (
        <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
          <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            Class Attendance Log for {selectedRollNo}
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-amber-100 dark:border-stone-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50/60 dark:bg-stone-800/60 text-stone-400 uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Time & Venue</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-stone-800 font-semibold text-stone-700 dark:text-stone-300">
                {dailyLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {log.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-white">
                      {log.subject} ({log.code})
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{log.time}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{log.room}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {log.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          PRESENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-black">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          ABSENT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
