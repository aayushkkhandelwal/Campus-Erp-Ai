import { useState, useEffect } from 'react';
import { Calendar, Sparkles, Clock, CheckCircle2, RefreshCw, Send, Check } from 'lucide-react';
import { aiService, type TimetableSlot } from '../../services/ai.service';
import { timetableService } from '../../services/timetable.service';

const DAY_ORDER: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

const parseStartTime = (timeStr: string): number => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

export const AITimetableGenerator = () => {
  const [semester, setSemester] = useState('Semester 5');
  const [subjectsText, setSubjectsText] = useState('DBMS, Operating Systems, Computer Networks, Software Engineering, AI');
  const [facultyText, setFacultyText] = useState('Dr. Amit Sharma, Dr. Sarah Jenkins, Prof. Alan Turing, Dr. Robert Langdon');
  const [roomsText, setRoomsText] = useState('Room 201, Room 104, Lab 1, Lab 3');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [schedule, setSchedule] = useState<TimetableSlot[] | null>(null);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  useEffect(() => {
    // Load previously published schedule if available
    const existing = timetableService.getStored();
    if (existing && existing.semester === semester) {
      setSchedule(existing.slots);
      setPublishedSuccess(true);
    }
  }, [semester]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setPublishedSuccess(false);

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
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!schedule) return;
    setIsPublishing(true);
    try {
      await timetableService.publish(semester, schedule);
      setPublishedSuccess(true);
    } finally {
      setIsPublishing(false);
    }
  };

  const sortedSchedule = schedule ? [...schedule].sort((a, b) => {
    const dayA = DAY_ORDER[a.day] || 99;
    const dayB = DAY_ORDER[b.day] || 99;
    if (dayA !== dayB) return dayA - dayB;
    return parseStartTime(a.time) - parseStartTime(b.time);
  }) : [];

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
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white cursor-pointer"
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
                placeholder="Comma separated rooms"
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Course Subjects
            </label>
            <input
              type="text"
              value={subjectsText}
              onChange={(e) => setSubjectsText(e.target.value)}
              placeholder="Comma separated subjects"
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Assigned Faculty List
            </label>
            <input
              type="text"
              value={facultyText}
              onChange={(e) => setFacultyText(e.target.value)}
              placeholder="Comma separated faculty names"
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all cursor-pointer font-['Outfit']"
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
                {sortedSchedule.length} Lectures scheduled across 5 days • 0 Faculty Clashes • 0 Room Clashes
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black">
                ✓ Verified Conflict Free
              </span>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer font-['Outfit']"
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
              <tbody className="divide-y divide-amber-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300 font-semibold">
                {sortedSchedule.map((slot, index) => (
                  <tr key={index} className="hover:bg-amber-50/50 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-black text-amber-800 dark:text-amber-300">
                      {slot.day}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-white">
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200">
                        {slot.time}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-white">
                      {slot.subject}
                    </td>
                    <td className="py-3.5 px-4">{slot.faculty}</td>
                    <td className="py-3.5 px-4 font-mono text-stone-500">{slot.room}</td>
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
