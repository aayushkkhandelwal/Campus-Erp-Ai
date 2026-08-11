import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { timetableService } from '../../services/timetable.service';
import type { TimetableSlot } from '../../services/ai.service';

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

export const StudentTimetable = () => {
  const [publishedSlots, setPublishedSlots] = useState<TimetableSlot[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchTimetable = async () => {
      const slots = await timetableService.getPublished();
      if (slots && slots.length > 0) {
        setPublishedSlots(slots);
        setIsLive(true);
      }
    };
    fetchTimetable();
  }, []);

  const defaultTimetable = [
    {
      day: 'Monday',
      slots: [
        { time: '09:00 - 10:00 AM', subject: 'DBMS (CS-501)', room: 'Room 201', faculty: 'Dr. Amit Sharma' },
        { time: '10:00 - 11:00 AM', subject: 'Artificial Intelligence (CS-505)', room: 'Room 104', faculty: 'Dr. Robert Langdon' },
        { time: '11:00 - 12:00 PM', subject: 'Computer Networks (CS-503)', room: 'Lab 2', faculty: 'Prof. Alan Turing' },
      ],
    },
    {
      day: 'Tuesday',
      slots: [
        { time: '09:00 - 10:00 AM', subject: 'Operating Systems (CS-502)', room: 'Lab 3', faculty: 'Dr. Sarah Jenkins' },
        { time: '10:00 - 11:00 AM', subject: 'Software Engineering (CS-504)', room: 'Room 201', faculty: 'Dr. Robert Langdon' },
        { time: '11:00 - 12:00 PM', subject: 'DBMS (CS-501)', room: 'Room 201', faculty: 'Dr. Amit Sharma' },
      ],
    },
    {
      day: 'Wednesday',
      slots: [
        { time: '09:00 - 11:00 AM', subject: 'DBMS Lab (CS-501L)', room: 'Lab 1', faculty: 'Dr. Amit Sharma' },
        { time: '11:00 - 12:00 PM', subject: 'Computer Networks (CS-503)', room: 'Lab 2', faculty: 'Prof. Alan Turing' },
        { time: '02:00 - 04:00 PM', subject: 'AI Lab (CS-505L)', room: 'Lab 4', faculty: 'Dr. Robert Langdon' },
      ],
    },
    {
      day: 'Thursday',
      slots: [
        { time: '09:00 - 10:00 AM', subject: 'Software Engineering (CS-504)', room: 'Room 201', faculty: 'Dr. Robert Langdon' },
        { time: '10:00 - 11:00 AM', subject: 'Computer Networks (CS-503)', room: 'Lab 2', faculty: 'Prof. Alan Turing' },
        { time: '11:00 - 12:00 PM', subject: 'DBMS (CS-501)', room: 'Room 201', faculty: 'Dr. Amit Sharma' },
      ],
    },
    {
      day: 'Friday',
      slots: [
        { time: '09:00 - 10:00 AM', subject: 'Artificial Intelligence (CS-505)', room: 'Room 104', faculty: 'Dr. Robert Langdon' },
        { time: '10:00 - 11:00 AM', subject: 'Operating Systems (CS-502)', room: 'Lab 3', faculty: 'Dr. Sarah Jenkins' },
        { time: '11:00 - 12:00 PM', subject: 'Software Engineering (CS-504)', room: 'Room 201', faculty: 'Dr. Robert Langdon' },
      ],
    },
  ];

  // Group published slots by day if live & sort chronologically by day and time
  const groupedPublished = publishedSlots
    .reduce((acc, slot) => {
      let dayGroup = acc.find((g) => g.day === slot.day);
      if (!dayGroup) {
        dayGroup = { day: slot.day, slots: [] };
        acc.push(dayGroup);
      }
      dayGroup.slots.push(slot);
      return acc;
    }, [] as { day: string; slots: TimetableSlot[] }[])
    .sort((a, b) => (DAY_ORDER[a.day] || 99) - (DAY_ORDER[b.day] || 99));

  groupedPublished.forEach((group) => {
    group.slots.sort((a, b) => parseStartTime(a.time) - parseStartTime(b.time));
  });

  const timetable = isLive && groupedPublished.length > 0 ? groupedPublished : defaultTimetable;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
            <Calendar className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            My Weekly Class Timetable
          </h1>
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">
            B.Tech Information Technology • Semester 5 (Section A)
          </p>
        </div>

        {isLive && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Live Published Schedule
          </span>
        )}
      </div>

      <div className="space-y-6">
        {timetable.map((dayPlan) => (
          <div
            key={dayPlan.day}
            className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4"
          >
            <h3 className="text-base font-black text-amber-800 dark:text-amber-400 font-['Outfit'] flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              {dayPlan.day}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {dayPlan.slots.map((slot, idx) => {
                const badgeColors = ['bg-indigo-600', 'bg-violet-600', 'bg-amber-500', 'bg-emerald-600'];
                const badgeColor = badgeColors[idx % badgeColors.length];
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 dark:border-stone-800 dark:bg-stone-800/40 space-y-1.5"
                  >
                    <span className={`inline-block px-2.5 py-0.5 rounded-md ${badgeColor} text-white font-bold text-[10px] shadow-sm`}>
                      {slot.time}
                    </span>
                    <h4 className="text-xs font-black text-stone-900 dark:text-white">
                      {slot.subject}
                    </h4>
                    <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                      {slot.room} • {slot.faculty}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentTimetable;
