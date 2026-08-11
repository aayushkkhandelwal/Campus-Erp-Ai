import { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Calendar,
  BookOpen,
  Search,
  ShieldCheck
} from 'lucide-react';

export interface IndividualStudentData {
  id?: string;
  rollNo: string;
  name: string;
  department?: string;
  email?: string;
}

interface IndividualAttendanceModalProps {
  student: IndividualStudentData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const IndividualAttendanceModal = ({
  student,
  isOpen,
  onClose
}: IndividualAttendanceModalProps) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');
  const [historySearch, setHistorySearch] = useState('');

  if (!isOpen || !student) return null;

  // Individual Subject Attendance Breakdown for this student
  const subjectBreakdown = [
    { code: 'CS-501', subject: 'Database Management Systems (DBMS)', present: 42, absent: 3, percent: 93, faculty: 'Dr. Amit Sharma' },
    { code: 'CS-502', subject: 'Operating Systems (OS)', present: 37, absent: 5, percent: 88, faculty: 'Dr. Sarah Jenkins' },
    { code: 'CS-503', subject: 'Computer Networks (CN)', present: 40, absent: 2, percent: 95, faculty: 'Prof. Alan Turing' },
    { code: 'CS-504', subject: 'Software Engineering (SE)', present: 36, absent: 4, percent: 90, faculty: 'Dr. Robert Langdon' },
    { code: 'CS-505', subject: 'Artificial Intelligence & ML', present: 39, absent: 3, percent: 92, faculty: 'Dr. Robert Langdon' },
  ];

  const totalPresent = subjectBreakdown.reduce((sum, s) => sum + s.present, 0);
  const totalAbsent = subjectBreakdown.reduce((sum, s) => sum + s.absent, 0);
  const totalClasses = totalPresent + totalAbsent;
  const overallPercent = Math.round((totalPresent / totalClasses) * 100);

  // Daily Date Attendance Log for this student
  const attendanceLogs = [
    { date: '2026-08-11', subject: 'Database Management Systems', code: 'CS-501', status: 'PRESENT', room: 'Room 201', time: '09:00 - 10:00 AM' },
    { date: '2026-08-11', subject: 'Operating Systems', code: 'CS-502', status: 'PRESENT', room: 'Lab 3', time: '11:00 - 12:00 PM' },
    { date: '2026-08-10', subject: 'Computer Networks', code: 'CS-503', status: 'PRESENT', room: 'Lab 2', time: '09:00 - 10:00 AM' },
    { date: '2026-08-10', subject: 'Software Engineering', code: 'CS-504', status: 'ABSENT', room: 'Room 201', time: '10:00 - 11:00 AM' },
    { date: '2026-08-08', subject: 'DBMS Lab Practical', code: 'CS-501L', status: 'PRESENT', room: 'Lab 1', time: '02:00 - 04:00 PM' },
    { date: '2026-08-07', subject: 'Artificial Intelligence', code: 'CS-505', status: 'PRESENT', room: 'Room 104', time: '10:00 - 11:00 AM' },
    { date: '2026-08-06', subject: 'Operating Systems', code: 'CS-502', status: 'PRESENT', room: 'Lab 3', time: '09:00 - 10:00 AM' },
    { date: '2026-08-05', subject: 'Database Management Systems', code: 'CS-501', status: 'ABSENT', room: 'Room 201', time: '11:00 - 12:00 PM' },
  ];

  const filteredLogs = attendanceLogs.filter(
    (log) =>
      log.subject.toLowerCase().includes(historySearch.toLowerCase()) ||
      log.code.toLowerCase().includes(historySearch.toLowerCase()) ||
      log.date.includes(historySearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in font-['Plus_Jakarta_Sans']">
      <div className="relative w-full max-w-4xl rounded-3xl border border-amber-200 bg-white p-6 md:p-8 shadow-2xl dark:border-stone-800 dark:bg-stone-900 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-amber-100 dark:border-stone-800">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white font-black text-2xl font-['Outfit'] shadow-md">
              {student.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-stone-900 dark:text-white font-['Outfit']">
                  {student.name}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" />
                  VERIFIED STUDENT
                </span>
              </div>
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
                Roll No: <span className="font-mono font-extrabold text-amber-700 dark:text-amber-400">{student.rollNo}</span> • Department: <strong className="text-stone-800 dark:text-stone-200">{student.department || 'Computer Science & Engineering'}</strong>
              </p>
            </div>
          </div>

          {/* Overall Percentage Badge */}
          <div className="flex items-center gap-4 bg-amber-50/60 dark:bg-stone-800/80 p-3.5 rounded-2xl border border-amber-200/80 dark:border-stone-700">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Overall Attendance
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                {overallPercent}%
              </div>
            </div>
            <div className="text-right border-l border-amber-200/80 dark:border-stone-700 pl-4">
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {totalPresent} Present
              </div>
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                {totalAbsent} Absent
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-amber-100 dark:border-stone-800 pb-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer font-['Outfit'] ${
              activeTab === 'summary'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Subject-wise Breakdown
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer font-['Outfit'] ${
              activeTab === 'history'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Daily Date Logs ({attendanceLogs.length})
          </button>
        </div>

        {/* TAB 1: SUBJECT-WISE BREAKDOWN */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectBreakdown.map((item) => (
                <div
                  key={item.code}
                  className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white font-mono font-bold text-[10px]">
                      {item.code}
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-['Outfit']">
                      {item.percent}%
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-stone-900 dark:text-white line-clamp-1">
                      {item.subject}
                    </h4>
                    <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
                      Faculty: {item.faculty}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-amber-100 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Present: {item.present}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Absent: {item.absent}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DAILY DATE LOGS */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Filter logs by subject, code, or date..."
                  className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 pl-10 pr-4 py-2 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-amber-200/80 dark:border-stone-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-amber-100 bg-amber-50/60 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Subject & Code</th>
                    <th className="py-3 px-4">Time Slot & Room</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 dark:divide-stone-800 font-semibold text-stone-700 dark:text-stone-300">
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900 dark:text-white">
                        {log.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 dark:text-white">{log.subject}</div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">{log.code}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{log.time}</div>
                        <div className="text-[10px] text-stone-400">{log.room}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
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
    </div>
  );
};
