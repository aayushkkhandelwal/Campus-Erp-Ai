import { useState, useEffect } from 'react';
import { Calendar, Sparkles, Clock, CheckCircle2, RefreshCw, Send, Check } from 'lucide-react';
import { aiService, type TimetableSlot } from '../../services/ai.service';
import { timetableService } from '../../services/timetable.service';

export const AITimetableGenerator = () => {
  const [semester, setSemester] = useState('Semester 5');
  const [subjectsText, setSubjectsText] = useState('DBMS, Operating Systems, Computer Networks, Software Engineering, AI');
  const [facultyText, setFacultyText] = useState('Dr. Amit Sharma, Dr. Sarah Jenkins, Prof. Alan Turing, Dr. Robert Langdon');
  const [roomsText, setRoomsText] = useState('Room 201, Room 104, Lab 1, Lab 3');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [schedule, setSchedule] = useState<TimetableSlot[] | null>(null);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Conflict Validation State
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateSchedule = async (targetSem: string, slots: TimetableSlot[]) => {
    setIsValidating(true);
    setValidationError(null);
    try {
      const result = await timetableService.validate(targetSem, slots);
      setIsValid(result.isValid);
      setConflicts(result.conflicts || []);
    } catch (err: any) {
      setValidationError(err.response?.data?.message || err.message || 'Validation failed');
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    // Load previously published schedule if available
    const existing = timetableService.getStored();
    if (existing && existing.semester === semester) {
      setSchedule(existing.slots);
      setPublishedSuccess(true);
      validateSchedule(semester, existing.slots);
    } else {
      setSchedule(null);
      setPublishedSuccess(false);
      setConflicts([]);
      setIsValid(null);
      setValidationError(null);
    }
  }, [semester]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setPublishedSuccess(false);
    setConflicts([]);
    setIsValid(null);
    setValidationError(null);

    const subjects = subjectsText.split(',').map((s) => s.trim()).filter(Boolean);
    const facultyList = facultyText.split(',').map((s) => s.trim()).filter(Boolean);
    const rooms = roomsText.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      const generated = await aiService.generateTimetable({
        semester,
        subjects,
        facultyList,
        rooms,
      });
      setSchedule(generated);
      await validateSchedule(semester, generated);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!schedule || isValid === false) return;
    setIsPublishing(true);
    try {
      await timetableService.publish(semester, schedule);
      setPublishedSuccess(true);
    } catch (err: any) {
      setValidationError(err.response?.data?.message || err.message || 'Publishing failed due to validation conflicts.');
      setIsValid(false);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <Calendar className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            AI Conflict-Free Timetable Generator
          </h1>
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
            Automated schedule optimizer: Eliminates faculty double-booking, room clashes, and student overlaps
          </p>
        </div>
      </div>

      {publishedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 text-xs font-extrabold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>✓ Timetable for {semester} is Published & Live! Faculty and Students can now view their updated schedule.</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-mono text-[10px]">
            STATUS: PUBLISHED
          </span>
        </div>
      )}

      {/* Input Parameters Form */}
      <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Target Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 3">Semester 3</option>
                <option value="Semester 5">Semester 5</option>
                <option value="Semester 7">Semester 7</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Available Rooms & Labs
              </label>
              <input
                type="text"
                value={roomsText}
                onChange={(e) => setRoomsText(e.target.value)}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Course Subjects (Comma Separated)
              </label>
              <input
                type="text"
                value={subjectsText}
                onChange={(e) => setSubjectsText(e.target.value)}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Assigned Faculty Members
              </label>
              <input
                type="text"
                value={facultyText}
                onChange={(e) => setFacultyText(e.target.value)}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Zero-clash constraint algorithm active
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-3 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Optimizing Schedule Constraints...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-yellow-200" />
                  Generate AI Timetable
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Schedule Grid */}
      {schedule && (
        <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-amber-100 dark:border-stone-800 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Optimized Timetable for {semester}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {schedule.length} Lectures scheduled across 5 days •{' '}
                {isValidating ? (
                  <span className="animate-pulse">Auditing clashes...</span>
                ) : (
                  <>
                    <span className={conflicts.filter(c => c.type === 'FACULTY_CLASH').length > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : ''}>
                      {conflicts.filter(c => c.type === 'FACULTY_CLASH').length} Faculty Clashes
                    </span>
                    {' • '}
                    <span className={conflicts.filter(c => c.type === 'ROOM_CLASH').length > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : ''}>
                      {conflicts.filter(c => c.type === 'ROOM_CLASH').length} Room Clashes
                    </span>
                    {' • '}
                    <span className={conflicts.filter(c => c.type === 'STUDENT_CLASH').length > 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : ''}>
                      {conflicts.filter(c => c.type === 'STUDENT_CLASH').length} Student Clashes
                    </span>
                  </>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {isValidating ? (
                <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 text-xs font-black animate-pulse flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-stone-500" />
                  Auditing Conflicts...
                </span>
              ) : isValid === false ? (
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-350 text-xs font-black border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5">
                  ⚠ Clashes Detected
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-black border border-emerald-250 dark:border-emerald-900/60 flex items-center gap-1.5">
                  ✓ Verified Conflict Free
                </span>
              )}
              
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing || isValid === false || isValidating}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black text-white shadow-lg transition-all cursor-pointer ${
                  isValid === false 
                    ? 'bg-stone-300 dark:bg-stone-800 shadow-none cursor-not-allowed opacity-60 text-stone-500' 
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                }`}
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : publishedSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    Timetable Submitted & Live
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit & Publish Timetable
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation Failure Warnings */}
          {isValid === false && (conflicts.length > 0 || validationError) && (
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 text-rose-950 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-xs text-rose-800 dark:text-rose-400">
                <span>⚠️ SYSTEM ALERT: TIMETABLE CONFLICTS DETECTED</span>
              </div>
              {validationError && !conflicts.length ? (
                <p className="text-xs font-bold leading-relaxed">{validationError}</p>
              ) : (
                <ul className="list-disc pl-5 text-xs space-y-1.5 font-bold">
                  {conflicts.map((conflict, index) => (
                    <li key={index} className="leading-relaxed">
                      {conflict.message}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] font-semibold text-rose-700/80 dark:text-rose-400/80 italic">
                Publishing is blocked until these overlaps are resolved. Adjust the generated timetable or update source parameters.
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-amber-100 dark:border-stone-800 text-stone-400 uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Allocated Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-stone-800">
                {schedule.map((slot, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-4 font-black text-amber-800 dark:text-amber-400">{slot.day}</td>
                    <td className="py-3 px-4 font-bold text-stone-600 dark:text-stone-400">{slot.time}</td>
                    <td className="py-3 px-4 font-extrabold text-stone-900 dark:text-white">{slot.subject}</td>
                    <td className="py-3 px-4 font-semibold text-stone-700 dark:text-stone-300">{slot.faculty}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-stone-800 dark:text-amber-300 font-bold font-mono">
                        {slot.room}
                      </span>
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

export default AITimetableGenerator;
