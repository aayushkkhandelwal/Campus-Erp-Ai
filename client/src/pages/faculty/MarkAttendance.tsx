import { useState, useEffect } from 'react';
import { CheckSquare, Check, X, Save, UserCheck, Edit3, RefreshCw, Eye, Clock, CalendarCheck, AlertCircle, Lock, Unlock } from 'lucide-react';
import { attendanceService, type StudentAttendanceItem } from '../../services/attendance.service';
import { studentService } from '../../services/student.service';
import { timetableService } from '../../services/timetable.service';
import { type TimetableSlot } from '../../services/ai.service';
import { useAuth } from '../../context/AuthContext';
import { IndividualAttendanceModal, type IndividualStudentData } from '../../components/attendance/IndividualAttendanceModal';

export const MarkAttendance = () => {
  const { user } = useAuth();
  const role = user?.role || 'FACULTY';

  const [subject, setSubject] = useState('DBMS (CS-501)');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<IndividualStudentData | null>(null);
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);

  // Timetable Slot Integration
  const [activeSlot, setActiveSlot] = useState<TimetableSlot | null>(null);
  const [manualOverride, setManualOverride] = useState(false);
  const [todayDayName, setTodayDayName] = useState('');

  const isReadOnly = isFinalized && role !== 'ADMIN' && !adminUnlocked;

  useEffect(() => {
    const checkTimetable = async () => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const now = new Date();
      const currentDay = days[now.getDay()];
      setTodayDayName(currentDay);

      const targetDay = (currentDay === 'Saturday' || currentDay === 'Sunday') ? 'Monday' : currentDay;
      const slots = await timetableService.getPublished();
      const todaySlots = slots.filter((s) => s.day === targetDay || s.day === currentDay);

      if (todaySlots.length > 0) {
        const facultyName = user?.fullName || 'Dr. Robert Langdon';
        const facultySlot = todaySlots.find((s) => s.faculty?.toLowerCase().includes(facultyName.toLowerCase())) || todaySlots[0];
        setActiveSlot(facultySlot);
        if (facultySlot?.subject) {
          setSubject(facultySlot.subject);
        }
      } else {
        setActiveSlot(null);
      }
    };
    checkTimetable();
  }, [user]);

  useEffect(() => {
    const loadBatch = async () => {
      const existing = await attendanceService.getBatch(subject, date);
      if (existing && existing.length > 0) {
        setStudents(existing);
        setIsEditing(true);
        const locked = existing.some((r: any) => r.isFinalized);
        setIsFinalized(locked);
      } else {
        setIsFinalized(false);
        try {
          const res = await studentService.getAll();
          if (res.data && res.data.length > 0) {
            const realStudents: StudentAttendanceItem[] = res.data.map((s) => ({
              id: s.id,
              name: `${s.firstName} ${s.lastName}`.trim(),
              rollNo: s.studentId,
              present: true,
            }));
            setStudents(realStudents);
          } else {
            setStudents([]);
          }
        } catch {
          setStudents([]);
        }
        setIsEditing(false);
      }
    };
    loadBatch();
  }, [subject, date]);

  const toggleStatus = (id: string) => {
    if (isReadOnly) return;
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, present: !s.present } : s))
    );
  };

  const markAllPresent = () => {
    if (isReadOnly) return;
    setStudents((prev) => prev.map((s) => ({ ...s, present: true })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setIsSubmitting(true);
    try {
      await attendanceService.saveBatch(subject, date, students, user?.fullName);
      setSavedSuccess(true);
      setIsEditing(true);
      setIsFinalized(true);
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
          Timetable-linked live attendance system for scheduled lectures
        </p>
      </div>

      {/* Active Timetable Slot Banner */}
      {activeSlot ? (
        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/40 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-md">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 text-[10px] font-black uppercase tracking-wider">
                  🟢 Scheduled Timetable Class ({activeSlot.day})
                </span>
              </div>
              <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit'] mt-1">
                {activeSlot.subject} • {activeSlot.room}
              </h3>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Scheduled Slot: {activeSlot.time} | Assigned Faculty: {activeSlot.faculty}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setManualOverride(!manualOverride)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 underline cursor-pointer hover:text-emerald-900 self-start md:self-center whitespace-nowrap"
          >
            {manualOverride ? 'Lock to Timetable' : 'Manual Change'}
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 dark:border-amber-900/50 dark:bg-amber-950/30 text-center space-y-2">
          <Clock className="h-8 w-8 text-amber-500 mx-auto" />
          <h3 className="text-base font-black text-amber-900 dark:text-amber-200 font-['Outfit']">
            No Active Class Scheduled Right Now ({todayDayName})
          </h3>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 max-w-md mx-auto">
            You currently have no teaching lectures scheduled for this time slot on the timetable.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setManualOverride(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md cursor-pointer transition-colors"
            >
              Enable Manual Subject Selection
            </button>
          </div>
        </div>
      )}

      {/* Finalized Session Alert & Admin Override Toggle */}
      {isFinalized && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600 shrink-0" />
            <span>
              This class session is <strong>Finalized & Locked</strong>. Records cannot be edited by standard Faculty.
            </span>
          </div>
          {role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => setAdminUnlocked(!adminUnlocked)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow cursor-pointer transition-colors whitespace-nowrap"
            >
              {adminUnlocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {adminUnlocked ? 'Re-lock Session' : 'Admin Correction Override'}
            </button>
          )}
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          Attendance records for {subject} on {date} successfully {isEditing ? 'updated' : 'saved & finalized'}! Student dashboards updated live.
        </div>
      )}

      {/* Select Controls & Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Target Subject
              </label>
              {activeSlot && !manualOverride ? (
                <div className="w-full rounded-2xl border border-emerald-300 bg-emerald-50/50 px-4 py-2.5 text-sm font-bold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <span>{subject}</span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase">LOCKED TO SLOT</span>
                </div>
              ) : (
                <select
                  value={subject}
                  disabled={isReadOnly}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 font-semibold disabled:opacity-60"
                >
                  <option value="DBMS (CS-501)">DBMS (CS-501) - Sem 5</option>
                  <option value="Operating Systems (CS-502)">Operating Systems (CS-502) - Sem 5</option>
                  <option value="Computer Networks (CS-503)">Computer Networks (CS-503) - Sem 5</option>
                  <option value="Software Engineering (CS-504)">Software Engineering (CS-504) - Sem 5</option>
                  <option value="Java Programming (CS-303)">Java Programming (CS-303) - Sem 3</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Attendance Date
              </label>
              <input
                type="date"
                value={date}
                disabled={isReadOnly}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 font-semibold disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-100 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold">
              {isFinalized ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-bold">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  Status: Finalized & Locked
                </span>
              ) : isEditing ? (
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
            disabled={isReadOnly}
            onClick={markAllPresent}
            className="w-full mt-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Mark All Present
          </button>
        </div>
      </div>

      {/* Attendance Form Table */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
        {students.length === 0 ? (
          <div className="py-8 text-center text-stone-500 dark:text-stone-400 text-xs font-bold flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            No enrolled students found for this section.
          </div>
        ) : (
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
                          disabled={isReadOnly}
                          onClick={() => toggleStatus(student.id)}
                          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                            isReadOnly ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                          } ${
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
                disabled={isSubmitting || isReadOnly}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving Attendance...
                  </>
                ) : isReadOnly ? (
                  <>
                    <Lock className="h-4 w-4" />
                    Session Finalized & Locked
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? 'Update & Finalize Batch' : 'Submit & Finalize Batch'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
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
