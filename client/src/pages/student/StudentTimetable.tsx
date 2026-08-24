import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { timetableService } from '../../services/timetable.service';
import { departmentService } from '../../services/department.service';
import { sectionService } from '../../services/section.service';
import { useAuth } from '../../context/AuthContext';
import type { TimetableSlot } from '../../services/ai.service';

export const StudentTimetable = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  
  // Dynamic filter states
  const [selectedSemester, setSelectedSemester] = useState('Semester 5');
  const [selectedBranch, setSelectedBranch] = useState('Information Technology');
  const [selectedSection, setSelectedSection] = useState('Section A');

  const [publishedSlots, setPublishedSlots] = useState<TimetableSlot[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 1. Fetch logged-in student's profile directly via GET /api/v1/students/me
  const { data: studentProfile } = useQuery({
    queryKey: ['student-me-profile', user?.email],
    queryFn: async () => {
      const response = await api.get('/students/me');
      return response.data?.data || null;
    },
    enabled: isStudent,
  });

  // Auto-populate semester and department from the student's profile
  useEffect(() => {
    if (studentProfile) {
      if (studentProfile.semester) {
        const semClean = String(studentProfile.semester).replace(/semester/i, '').trim();
        setSelectedSemester(`Semester ${semClean}`);
      }
      if (studentProfile.department?.name) {
        setSelectedBranch(studentProfile.department.name);
      }
    }
  }, [studentProfile]);

  // 2. Fetch departments/branches dynamically (for Admin/Faculty lookup)
  const { data: departments = [] } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll().then(res => res.data || []),
    enabled: !isStudent,
  });

  // 3. Fetch sections dynamically (for Admin/Faculty lookup)
  const { data: sections = [] } = useQuery({
    queryKey: ['sections-list'],
    queryFn: () => sectionService.getAll(),
    enabled: !isStudent,
  });

  // Compute available sections based on active department & semester selection
  const currentDept = departments.find((d: any) => d.name === selectedBranch);
  const currentDeptId = currentDept?.id;
  const semNum = selectedSemester.match(/\d+/) ? selectedSemester.match(/\d+/)![0] : '5';

  const sectionsForCurrentFilters = sections.filter((s: any) => 
    s.semester === semNum && 
    (!currentDeptId || s.departmentId === currentDeptId)
  );

  // Automatically adjust selectedSection if it falls out of the filtered sections scope (Admin/Faculty only)
  useEffect(() => {
    if (!isStudent && sectionsForCurrentFilters.length > 0) {
      const match = sectionsForCurrentFilters.find((s: any) => s.name === selectedSection);
      if (!match) {
        setSelectedSection(sectionsForCurrentFilters[0].name);
      }
    }
  }, [isStudent, selectedSemester, selectedBranch, sectionsForCurrentFilters]);

  // Fetch timetable slots matching selected semester
  useEffect(() => {
    const fetchTimetable = async () => {
      const slots = await timetableService.getPublished(selectedSemester);
      setPublishedSlots(slots || []);
      setIsLive(slots && slots.length > 0);
      try {
        const pData = await timetableService.getPeriods();
        setPeriods(pData);
      } catch (err) {
        console.warn('Failed to load periods:', err);
      }
    };
    fetchTimetable();

    const getLatestTimestampOrCount = (slotsList: TimetableSlot[]) => {
      if (!slotsList || slotsList.length === 0) return '0-0';
      const maxUpdatedAt = slotsList.reduce((max, slot) => {
        const slotTime = (slot as any).updatedAt ? new Date((slot as any).updatedAt).getTime() : 0;
        return slotTime > max ? slotTime : max;
      }, 0);
      return `${slotsList.length}-${maxUpdatedAt}`;
    };

    const interval = setInterval(async () => {
      const newSlots = await timetableService.getPublished(selectedSemester);
      setPublishedSlots(currentSlots => {
        const currentHash = getLatestTimestampOrCount(currentSlots);
        const newHash = getLatestTimestampOrCount(newSlots);
        if (currentHash !== newHash && newSlots && newSlots.length > 0) {
          setIsLive(true);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
          return newSlots;
        }
        return currentSlots;
      });
      try {
        const pData = await timetableService.getPeriods();
        setPeriods(pData);
      } catch {}
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedSemester]);

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

  // Client-side filter: Match slots by branch (if defined on the slot) without strict section filtering
  const filteredPublishedSlots = publishedSlots.filter((slot) => {
    const slotBranch = slot.branch ? slot.branch.trim().toLowerCase() : '';
    const selectedBranchLower = selectedBranch.trim().toLowerCase();

    // If slot has a branch, match against selectedBranch; otherwise accept semester-matched slot
    return !slotBranch || !selectedBranchLower || slotBranch === selectedBranchLower;
  });

  const formatTimeTo12h = (time24: string) => {
    if (!time24) return '';
    const [hourStr, minStr] = time24.split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minStr} ${ampm}`;
  };

  const DAY_SHORT: Record<string, string> = {
    'Monday': 'Mo',
    'Tuesday': 'Tu',
    'Wednesday': 'We',
    'Thursday': 'Th',
    'Friday': 'Fr',
    'Saturday': 'Sa'
  };

  const timeColumns = (periods && periods.length > 0)
    ? periods.map(p => ({
        id: p.id,
        name: p.name,
        label: `${formatTimeTo12h(p.startTime)} - ${formatTimeTo12h(p.endTime)}`
      }))
    : [
        { id: undefined, name: 'Period 1', label: '08:15 AM - 09:15 AM' },
        { id: undefined, name: 'Period 2', label: '09:15 AM - 10:15 AM' },
        { id: undefined, name: 'Period 3', label: '10:15 AM - 11:15 AM' },
        { id: undefined, name: 'Period 4', label: '11:15 AM - 12:15 PM' },
        { id: undefined, name: 'Period 5', label: '12:15 PM - 01:15 PM' },
        { id: undefined, name: 'Period 6', label: '01:15 PM - 02:15 PM' }
      ];

  const getSlot = (dayName: string, col: any) => {
    if (isLive) {
      return filteredPublishedSlots.find(s => {
        const matchesDay = s.day ? s.day.toLowerCase() === dayName.toLowerCase() : true;
        if (!matchesDay) return false;

        // Match by periodId (precise relational match)
        if (col.id && s.periodId && col.id === s.periodId) return true;

        // Fallback matching by period name or time string
        if (col.name && (s as any).period?.name === col.name) return true;
        if (s.time === col.label) return true;
        if (s.time && col.label && s.time.replace(/\s+/g, '').toLowerCase() === col.label.replace(/\s+/g, '').toLowerCase()) return true;

        return false;
      });
    } else {
      const dayData = defaultTimetable.find(d => d.day === dayName);
      if (!dayData) return null;
      return dayData.slots.find(s => s.time === col.label || col.label.includes(s.time.replace(' PM','').replace(' AM','')));
    }
  };

  // Helper to detect if a slot represents a lab/practical session
  const isLabSlot = (slot: any) => {
    if (!slot) return false;
    if (slot.type && typeof slot.type === 'string' && (slot.type.toUpperCase() === 'LAB' || slot.type.toUpperCase() === 'PRACTICAL')) {
      return true;
    }
    if (slot.subjectType && typeof slot.subjectType === 'string' && slot.subjectType.toUpperCase() === 'LAB') {
      return true;
    }
    if (slot.subject && typeof slot.subject === 'string' && slot.subject.toUpperCase().includes('LAB')) {
      return true;
    }
    return false;
  };

  // Check if two slots belong to the same consecutive lab session
  const isSameLab = (slotA: any, slotB: any) => {
    if (!slotA || !slotB) return false;
    if (!isLabSlot(slotA) || !isLabSlot(slotB)) return false;
    const subjA = (slotA.subject || '').trim().toLowerCase();
    const subjB = (slotB.subject || '').trim().toLowerCase();
    return subjA !== '' && subjA === subjB;
  };

  // Group row slots for a day into rendering cells with dynamic colSpan for consecutive matching labs
  const getDayRowCells = (dayName: string) => {
    const daySlots = timeColumns.map((col) => getSlot(dayName, col));
    const cells: { colIndex: number; slot: any; colSpan: number }[] = [];
    let i = 0;

    while (i < timeColumns.length) {
      const currentSlot = daySlots[i];
      let span = 1;

      if (currentSlot && isLabSlot(currentSlot)) {
        while (
          i + span < timeColumns.length &&
          isSameLab(currentSlot, daySlots[i + span])
        ) {
          span++;
        }
      }

      cells.push({
        colIndex: i,
        slot: currentSlot,
        colSpan: span,
      });

      i += span;
    }

    return cells;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2.5 font-['Outfit']">
            <Calendar className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            Class Timetable
          </h1>
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1 font-mono">
            SKIT • {selectedBranch} • {selectedSemester}
          </p>
        </div>

        {isLive && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-black border border-emerald-100 dark:border-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Live Published Schedule
          </span>
        )}
      </div>

      {/* Filter Selection Panel (Hidden for Students, Visible for Admin & Faculty) */}
      {isStudent ? (
        <div className="rounded-3xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-white font-['Outfit']">
                Enrolled Academic Schedule
              </div>
              <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                SKIT • {selectedBranch} • {selectedSemester}
              </div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 text-[10px] font-extrabold uppercase tracking-wider w-fit">
            Auto-Synced with Enrollment
          </span>
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Target Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-800 dark:bg-stone-950/40 dark:text-white"
            >
              {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Branch (Department)
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-800 dark:bg-stone-950/40 dark:text-white"
            >
              {departments.length > 0 ? (
                departments.map((d: any) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))
              ) : (
                <option value="Information Technology">Information Technology</option>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-800 dark:bg-stone-950/40 dark:text-white"
            >
              {sectionsForCurrentFilters.length > 0 ? (
                sectionsForCurrentFilters.map((s: any) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))
              ) : (
                <option value="Section A">Section A</option>
              )}
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-stone-200 dark:border-stone-850 rounded-3xl shadow-sm bg-white dark:bg-stone-900">
        <table className="w-full border-collapse text-center text-xs">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-850/60 border-b border-stone-200 dark:border-stone-850 text-stone-700 dark:text-stone-300 font-extrabold uppercase tracking-wider font-['Outfit']">
              <th className="py-4 px-3 border-r border-stone-200 dark:border-stone-800 w-20">Day</th>
              {timeColumns.map((col, idx) => (
                <th key={idx} className="py-3 px-3 border-r border-stone-200 dark:border-stone-800 min-w-[140px]">
                  <div className="text-[11px] font-black text-stone-900 dark:text-white">{col.name}</div>
                  <div className="text-[9px] text-stone-500 font-semibold mt-0.5">{col.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName) => {
              const rowCells = getDayRowCells(dayName);
              return (
                <tr key={dayName} className="hover:bg-amber-50/5 dark:hover:bg-stone-850/5 transition-colors">
                  <td className="py-4 px-3 font-black text-amber-900 dark:text-amber-400 border-r border-stone-200 dark:border-stone-850 bg-stone-50/50 dark:bg-stone-950/20 text-xs font-['Outfit']">
                    {DAY_SHORT[dayName] || dayName}
                  </td>
                  {rowCells.map(({ colIndex, slot, colSpan }) => (
                    <td
                      key={colIndex}
                      colSpan={colSpan > 1 ? colSpan : undefined}
                      className="p-3 border-r border-stone-200 dark:border-stone-850 relative align-middle"
                    >
                      {slot ? (
                        <div className="space-y-1 bg-amber-50/20 dark:bg-stone-800/20 p-2.5 rounded-xl border border-amber-100/40 dark:border-stone-750/30">
                          <div className="text-xs font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                            {slot.subject}
                          </div>
                          
                          <div className="flex items-center justify-between text-[9px] font-bold text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-stone-800/40 pt-1 mt-1 font-mono">
                            <span className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded text-[8px] tracking-wide text-stone-600 dark:text-stone-300">
                              {slot.room}
                            </span>
                            <span className="italic shrink-0 font-black text-amber-600 dark:text-amber-400">
                              {slot.faculty ? (slot.faculty.split(' ').map((n: string) => n[0]).join('') || slot.faculty) : ''}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400 dark:text-stone-600 font-medium italic">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom duration-300 font-bold text-xs">
          <CheckCircle2 className="h-5 w-5 text-white" />
          <span>📅 Timetable has been updated</span>
        </div>
      )}
    </div>
  );
};

export default StudentTimetable;
