import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Sparkles, Clock, CheckCircle2, RefreshCw, Send, Check, UserCheck, AlertCircle, Edit, X, Save, Download } from 'lucide-react';
import { aiService, type TimetableSlot } from '../../services/ai.service';
import { timetableService } from '../../services/timetable.service';
import { facultyService } from '../../services/faculty.service';
import { subjectService } from '../../services/subject.service';
import { roomService } from '../../services/room.service';
import { sectionService } from '../../services/section.service';
import { facultySubjectService } from '../../services/faculty-subject.service';
import { departmentService } from '../../services/department.service';

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

// Helper to normalize strings for comparison
const normalize = (val: string) => val ? val.trim().toLowerCase().replace(/\s+/g, ' ') : '';
const extractSemNum = (semStr: string) => {
  const match = semStr.match(/\d+/);
  return match ? match[0] : semStr;
};

const formatTimeTo12h = (time24: string): string => {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hour12).padStart(2, '0')}:${minStr} ${ampm}`;
};

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

const isSameLab = (slotA: any, slotB: any) => {
  if (!slotA || !slotB) return false;
  if (!isLabSlot(slotA) || !isLabSlot(slotB)) return false;
  const subjA = (slotA.subject || '').trim().toLowerCase();
  const subjB = (slotB.subject || '').trim().toLowerCase();
  return subjA !== '' && subjA === subjB;
};

export const AITimetableGenerator = () => {
  const [semester, setSemester] = useState('Semester 5');
  const [branch, setBranch] = useState('Information Technology');
  const [section, setSection] = useState('Section A');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [schedule, setSchedule] = useState<TimetableSlot[] | null>(null);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);
  const [activeSectionTab, setActiveSectionTab] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'generator' | 'periods'>('generator');
  const [benchmarkTime, setBenchmarkTime] = useState<number | null>(null);
  
  const [periods, setPeriods] = useState<any[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [periodSuccess, setPeriodSuccess] = useState<string | null>(null);

  // Database Fetches
  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll(),
  });
  const departments = departmentsResponse?.data || [];

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects-list'],
    queryFn: () => subjectService.getAll(),
  });

  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms-list'],
    queryFn: () => roomService.getAll(),
  });

  const { data: sections = [], isLoading: loadingSections } = useQuery({
    queryKey: ['sections-list'],
    queryFn: () => sectionService.getAll(),
  });

  const { data: qualifications = [], isLoading: loadingQualifications } = useQuery({
    queryKey: ['faculty-subjects-list'],
    queryFn: () => facultySubjectService.getAll(),
  });

  const { data: facultyRes, isLoading: loadingFaculty } = useQuery({
    queryKey: ['faculty-list', 'timetable'],
    queryFn: () => facultyService.getAll({ limit: 100 }),
  });
  const dbFacultyList = facultyRes?.data || [];

  // Local Validation States
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Auto-select first active section tab when sections list changes
  useEffect(() => {
    const semNum = extractSemNum(semester);
    const targetDept = departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch));
    const targetDeptId = targetDept?.id;
    const activeSections = sections.filter(sec => 
      sec.semester === semNum && 
      (!targetDeptId || sec.departmentId === targetDeptId)
    );
    if (activeSections.length > 0 && (!activeSectionTab || !activeSections.some(s => s.name === activeSectionTab))) {
      setActiveSectionTab(activeSections[0].name);
    }
  }, [sections, semester, branch, departments, activeSectionTab]);

  // Period timings loader
  const fetchPeriods = async () => {
    try {
      setLoadingPeriods(true);
      const data = await timetableService.getPeriods();
      setPeriods(data);
    } catch (err: any) {
      setPeriodError('Failed to load periods.');
    } finally {
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleEditPeriod = (period: any) => {
    setEditingPeriodId(period.id);
    setEditStartTime(period.startTime);
    setEditEndTime(period.endTime);
    setPeriodError(null);
    setPeriodSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingPeriodId(null);
    setPeriodError(null);
  };

  const handleSavePeriod = async (id: string) => {
    setPeriodError(null);
    setPeriodSuccess(null);
    try {
      await timetableService.updatePeriod(id, editStartTime, editEndTime);
      setPeriodSuccess('Period timings updated successfully!');
      setEditingPeriodId(null);
      await fetchPeriods();
      setTimeout(() => setPeriodSuccess(null), 3000);
    } catch (err: any) {
      setPeriodError(err.response?.data?.message || err.message || 'Failed to update period.');
    }
  };

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
      setValidationError(err.response?.data?.message || err.message || 'Validation service is currently unavailable.');
      setIsValid(null);
      setConflicts([]);
    } finally {
      setIsValidating(false);
    }
  };

  // Synchronize and validate DB state when inputs change
  useEffect(() => {
    const errors: string[] = [];
    const targetDept = departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch));
    const targetDeptId = targetDept?.id;
    const semNum = extractSemNum(semester);

    if (!loadingSubjects && !loadingSections && !loadingQualifications && !loadingRooms) {
      // 1. Check sections existence
      const activeSections = sections.filter(sec => 
        sec.semester === semNum && 
        (!targetDeptId || sec.departmentId === targetDeptId)
      );

      if (activeSections.length === 0) {
        errors.push(`No Section records defined for ${semester} under "${branch}". Go to Section Manager to create Section A.`);
      } else {
        // Automatically link target section to the first section found if not matched
        const matchedSection = activeSections.find(s => normalize(s.name) === normalize(section));
        if (!matchedSection) {
          setSection(activeSections[0].name);
        }
      }

      // 2. Check active subjects for semester & department
      const activeSubjects = subjects.filter(sub => 
        sub.semester === semNum && 
        (!targetDeptId || sub.departmentId === targetDeptId)
      );

      if (activeSubjects.length === 0) {
        errors.push(`No Subject records found in database for ${semester} under "${branch}". Go to Subject Manager to define subjects.`);
      } else {
        activeSubjects.forEach(sub => {
          // Check weekly hours
          if (!sub.weeklyHours || sub.weeklyHours <= 0) {
            errors.push(`Subject "${sub.name}" (${sub.code}) has no weekly hours (weeklyHours) set. Go to Subject Manager.`);
          }
          // Check qualifications
          const qualifiedFacultyCount = qualifications.filter(q => q.subjectId === sub.id).length;
          if (qualifiedFacultyCount === 0) {
            errors.push(`No faculty members are qualified to teach subject "${sub.name}" (${sub.code}). Go to Faculty Qualifications to assign at least one.`);
          }
        });
      }

      // 3. Check rooms availability
      if (rooms.length === 0) {
        errors.push('No Room records configured in the database. Go to Room Manager to define at least one classroom.');
      }

      // 4. Check Deficit Faculty Capacity across all sections
      if (activeSubjects.length > 0 && dbFacultyList.length > 0 && activeSections.length > 0) {
        const singleSectionHours = activeSubjects.reduce((sum, s) => sum + (s.weeklyHours || 0), 0);
        const totalRequiredHours = singleSectionHours * activeSections.length;

        // Get unique faculty members qualified to teach any of the active subjects
        const qualifiedFacultyIds = new Set(
          qualifications
            .filter(q => activeSubjects.some(s => s.id === q.subjectId))
            .map(q => q.facultyId)
        );

        const activeQualifiedFaculty = dbFacultyList.filter((f: any) => qualifiedFacultyIds.has(f.id));
        const totalAvailableFacultyHours = activeQualifiedFaculty.reduce((sum: number, f: any) => sum + (f.weeklyHours || 18), 0);

        if (totalRequiredHours > totalAvailableFacultyHours) {
          errors.push(`Deficit Faculty Capacity: The subjects for all ${activeSections.length} sections require a total of ${totalRequiredHours} hours/week (each section requires ${singleSectionHours} hours/week), but the qualified faculty members have a combined workload capacity limit of only ${totalAvailableFacultyHours} hours/week. Please qualify more faculty members or increase workload limits.`);
        }
      }
    }

    setValidationErrors(errors);
  }, [semester, branch, section, subjects, sections, qualifications, rooms, departments, dbFacultyList, loadingSubjects, loadingSections, loadingQualifications, loadingRooms]);

  useEffect(() => {
    if (dbFacultyList.length > 0 && selectedFacultyIds.length === 0) {
      setSelectedFacultyIds(dbFacultyList.map((f: any) => f.id));
    }
  }, [dbFacultyList]);

  useEffect(() => {
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

  const toggleFacultySelection = (id: string) => {
    setSelectedFacultyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationErrors.length > 0) {
      alert('Cannot trigger generation: database setup is incomplete! Please review validation errors.');
      return;
    }

    if (selectedFacultyIds.length === 0) {
      alert('Please select at least one active Faculty member!');
      return;
    }

    setIsGenerating(true);
    setSchedule(null);
    setBenchmarkTime(null);
    setPublishedSuccess(false);
    setConflicts([]);
    setIsValid(null);
    setValidationError(null);

    const semNum = extractSemNum(semester);
    const targetDept = departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch));
    const targetDeptId = targetDept?.id;

    // Filter active sections, subjects & rooms directly from DB records
    const activeSections = sections.filter(sec => 
      sec.semester === semNum && 
      (!targetDeptId || sec.departmentId === targetDeptId)
    );

    const activeSubjects = subjects.filter(sub => 
      sub.semester === semNum && 
      (!targetDeptId || sub.departmentId === targetDeptId)
    );

    const subjectNames = activeSubjects.map(s => s.name);
    const roomNames = rooms.map(r => r.name);

    // Map subject name to its database weekly hours count
    const subjectWeeklyHoursMap: Record<string, number> = {};
    activeSubjects.forEach(s => {
      subjectWeeklyHoursMap[s.name] = s.weeklyHours || (s.name.toLowerCase().includes('lab') ? 2 : 4);
    });

    // Map active faculty details
    const activeFacultyObjects = dbFacultyList
      .filter((f: any) => selectedFacultyIds.includes(f.id))
      .map((f: any) => ({
        id: f.id,
        name: `${f.firstName} ${f.lastName}`.trim(),
        weeklyHours: f.weeklyHours
      }));

    const t0 = performance.now();
    try {
      const generated = await aiService.generateTimetable({
        semester,
        subjects: subjectNames,
        subjectWeeklyHours: subjectWeeklyHoursMap, // Pass weekly hours map!
        facultyList: activeFacultyObjects.map((f: any) => f.name),
        facultyObjects: activeFacultyObjects,
        rooms: roomNames,
        branch,
        sections: activeSections.map(s => s.name), // Pass all active sections!
        qualifications: qualifications.map((q: any) => ({
          facultyId: q.facultyId,
          subjectId: q.subjectId,
          subjectName: q.subject?.name
        }))
      });
      const t1 = performance.now();
      setBenchmarkTime(t1 - t0);
      setSchedule(generated);
      if (activeSections.length > 0) {
        setActiveSectionTab(activeSections[0].name);
      }
      await validateSchedule(semester, generated);
    } catch (err: any) {
      setBenchmarkTime(null);
      setValidationError(err.message || 'Scheduling solver was unable to find a conflict-free solution. Please check faculty constraints.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download/print the timetable PDF.');
      return;
    }

    const timeCols = (periods && periods.length > 0)
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

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let tableHeadersHtml = '<th style="width: 80px;">Day</th>';
    timeCols.forEach(col => {
      tableHeadersHtml += `
        <th>
          <div class="period-name">${col.name}</div>
          <div class="period-time">${col.label}</div>
        </th>
      `;
    });

    const semNum = extractSemNum(semester);
    const targetDept = departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch));
    const targetDeptId = targetDept?.id;
    let activeSections = sections.filter(sec => 
      sec.semester === semNum && 
      (!targetDeptId || sec.departmentId === targetDeptId)
    );

    if (activeSections.length === 0) {
      activeSections = [{ id: 'fallback', name: activeSectionTab } as any];
    }

    let pagesHtml = '';

    activeSections.forEach((sec, secIdx) => {
      const sectionSlots = sortedSchedule.filter(s => s.section === sec.name);
      let tableRowsHtml = '';

      days.forEach(day => {
        tableRowsHtml += `<tr><td class="day-cell">${day}</td>`;
        const daySlots = timeCols.map(col =>
          sectionSlots.find(s => s.day === day && (s.periodId === col.id || s.time === col.label))
        );

        let i = 0;
        while (i < timeCols.length) {
          const slot = daySlots[i];
          let span = 1;
          if (slot && isLabSlot(slot)) {
            while (i + span < timeCols.length && isSameLab(slot, daySlots[i + span])) {
              span++;
            }
          }

          if (slot) {
            const spanAttr = span > 1 ? ` colspan="${span}"` : '';
            tableRowsHtml += `
              <td${spanAttr}>
                <div class="subject-title">${slot.subject}</div>
                <div class="slot-details">
                  <span class="room-badge">${slot.room}</span>
                  <span class="faculty-name">${slot.faculty}</span>
                </div>
              </td>
            `;
          } else {
            tableRowsHtml += `<td class="empty-cell">-</td>`;
          }

          i += span;
        }
        tableRowsHtml += '</tr>';
      });

      pagesHtml += `
        <div class="timetable-page">
          <div class="header">
            <div class="college-title">University College of Engineering & Technology</div>
            <div class="sub-title">Office of the Dean Academics • Timetable Management Division</div>
            <div class="doc-type">OFFICIAL CLASS TIMETABLE REPORT</div>
          </div>

          <div class="info-bar">
            <div class="info-item"><span>Semester:</span> ${semester}</div>
            <div class="info-item"><span>Department/Branch:</span> ${branch}</div>
            <div class="info-item"><span>Section:</span> ${sec.name}</div>
            <div class="info-item"><span>Academic Session:</span> 2026-2027</div>
          </div>

          <table>
            <thead>
              <tr>
                ${tableHeadersHtml}
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <div>
              <div class="sig-line">Prepared By (Timetable Coordinator)</div>
            </div>
            <div>
              <div class="sig-line">Approved By (Dean Academics / HOD)</div>
            </div>
          </div>
        </div>
        ${secIdx < activeSections.length - 1 ? '<div class="page-break"></div>' : ''}
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Academic Timetable - ${semester}</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 10px; color: #0f172a; line-height: 1.5; background: #fff; }
            .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .college-title { font-size: 20px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 1px; }
            .sub-title { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 4px; }
            .doc-type { font-size: 12px; font-weight: 800; background: #f1f5f9; display: inline-block; padding: 5px 14px; border-radius: 6px; margin-top: 8px; border: 1px solid #cbd5e1; }
            
            .info-bar { display: flex; justify-content: space-between; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 11px; font-weight: 700; }
            .info-item span { color: #64748b; font-weight: 500; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
            th { background: #0f172a; color: white; border: 1px solid #334155; padding: 8px 6px; text-align: center; }
            .period-name { font-size: 10px; font-weight: 900; text-transform: uppercase; }
            .period-time { font-size: 8px; color: #cbd5e1; font-weight: 550; margin-top: 2px; }
            
            td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; vertical-align: middle; height: 55px; }
            .day-cell { background: #f1f5f9; font-weight: 900; font-size: 11px; color: #0f172a; text-transform: uppercase; text-align: center; }
            .subject-title { font-size: 11px; font-weight: 800; color: #0f172a; word-wrap: break-word; }
            .slot-details { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 6px; }
            .room-badge { font-size: 8px; font-weight: 800; background: #e2e8f0; color: #334155; padding: 2px 5px; border-radius: 4px; border: 0.5px solid #cbd5e1; }
            .faculty-name { font-size: 8px; color: #475569; font-weight: 700; font-style: italic; }
            .empty-cell { color: #94a3b8; font-style: italic; font-size: 12px; }

            .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 10px; font-weight: 600; color: #475569; }
            .sig-line { border-top: 1.5px dashed #94a3b8; width: 150px; margin-top: 30px; padding-top: 4px; }

            @media print {
              body { background: #fff; padding: 0; margin: 0; }
              .page-break { page-break-after: always; break-after: page; }
            }
          </style>
        </head>
        <body>
          ${pagesHtml}

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePublish = async () => {
    if (!schedule || isValid === false) return;
    setIsPublishing(true);
    try {
      await timetableService.publish(semester, schedule);
      setPublishedSuccess(true);
    } catch (err: any) {
      setValidationError(err.response?.data?.message || err.message || 'Publishing failed.');
      setIsValid(null);
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

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-stone-200 dark:border-stone-850 pb-px">
        <button
          onClick={() => {
            setActiveTab('generator');
            setEditingPeriodId(null);
            setPeriodError(null);
            setPeriodSuccess(null);
          }}
          className={`px-4 py-2.5 text-xs font-black tracking-wider uppercase border-b-2 font-['Outfit'] cursor-pointer transition-colors ${
            activeTab === 'generator'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          Timetable Generator
        </button>
        <button
          onClick={() => {
            setActiveTab('periods');
            setEditingPeriodId(null);
            setPeriodError(null);
            setPeriodSuccess(null);
          }}
          className={`px-4 py-2.5 text-xs font-black tracking-wider uppercase border-b-2 font-['Outfit'] cursor-pointer transition-colors ${
            activeTab === 'periods'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          Lecture Period Settings
        </button>
      </div>

      {activeTab === 'generator' ? (
        <>
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

          {validationError && !schedule && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-455 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider font-['Outfit']">
                <AlertCircle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
                Scheduling Generation Failed
              </div>
              <p className="text-xs font-bold leading-relaxed whitespace-pre-line">
                {validationError}
              </p>
            </div>
          )}

          {/* Input Parameters Form */}
          <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Target Semester
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('periods')}
                  className="text-[10px] font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 underline cursor-pointer"
                >
                  ✏️ Edit Lecture Period Timings
                </button>
              </div>
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
                Target Branch / Department
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white cursor-pointer"
              >
                <option value="Information Technology">Information Technology</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Target Sections (Generated Together)
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl border border-amber-200/60 bg-amber-50/10 min-h-[38px] items-center dark:border-stone-700 dark:bg-stone-800/20">
                {sections.filter(sec => 
                  sec.semester === extractSemNum(semester) && 
                  (!departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id || sec.departmentId === departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id)
                ).length === 0 ? (
                  <span className="text-[10px] text-stone-400 italic font-bold pl-1">No sections found</span>
                ) : (
                  sections.filter(sec => 
                    sec.semester === extractSemNum(semester) && 
                    (!departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id || sec.departmentId === departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id)
                  ).map(sec => (
                    <span key={sec.id} className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-white border border-stone-200 text-[10px] font-black text-stone-700 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300">
                      {sec.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider font-['Outfit']">
                <AlertCircle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
                Timetable Constraints Unmet
              </div>
              <ul className="list-disc pl-5 text-[11px] font-bold space-y-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>
                    {err} 
                    {err.includes('Subject Manager') && (
                      <Link to="/admin/subjects" className="ml-1.5 underline text-emerald-600 dark:text-emerald-400 font-extrabold hover:text-emerald-700">Subject Manager ↗</Link>
                    )}
                    {err.includes('Faculty Qualifications') && (
                      <Link to="/admin/faculty-subjects" className="ml-1.5 underline text-emerald-600 dark:text-emerald-400 font-extrabold hover:text-emerald-700">Qualifications Manager ↗</Link>
                    )}
                    {err.includes('Room Manager') && (
                      <Link to="/admin/rooms" className="ml-1.5 underline text-emerald-600 dark:text-emerald-400 font-extrabold hover:text-emerald-700">Room Manager ↗</Link>
                    )}
                    {err.includes('Section Manager') && (
                      <Link to="/admin/sections" className="ml-1.5 underline text-emerald-600 dark:text-emerald-400 font-extrabold hover:text-emerald-700">Section Manager ↗</Link>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 italic">
                Please fix the database setup issues listed above before scheduling.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/30 dark:border-stone-800 dark:bg-stone-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Course Subjects ({subjects.filter(s => s.semester === extractSemNum(semester) && (!departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id || s.departmentId === departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id)).length})
                </label>
                <Link to="/admin/subjects" className="text-[10px] font-extrabold text-emerald-600 hover:underline">Manage Subjects</Link>
              </div>
              
              {loadingSubjects ? (
                <div className="text-[11px] text-stone-500 animate-pulse">Loading subjects...</div>
              ) : subjects.filter(s => s.semester === extractSemNum(semester) && (!departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id || s.departmentId === departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id)).length === 0 ? (
                <div className="text-[11px] text-stone-400 italic font-semibold">No subjects registered for this semester.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {subjects.filter(s => s.semester === extractSemNum(semester) && (!departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id || s.departmentId === departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id)).map(subj => (
                    <span key={subj.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-stone-200 text-[10px] font-bold text-stone-700 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">{subj.code}</span>: {subj.name} ({subj.weeklyHours}h - {subj.type})
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/30 dark:border-stone-800 dark:bg-stone-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Available Rooms & Labs ({rooms.length})
                </label>
                <Link to="/admin/rooms" className="text-[10px] font-extrabold text-emerald-600 hover:underline">Manage Rooms</Link>
              </div>

              {loadingRooms ? (
                <div className="text-[11px] text-stone-500 animate-pulse">Loading rooms...</div>
              ) : rooms.length === 0 ? (
                <div className="text-[11px] text-stone-400 italic font-semibold">No rooms configured.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {rooms.map(room => (
                    <span key={room.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-stone-200 text-[10px] font-bold text-stone-700 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300">
                      <span>Room {room.name}</span> ({room.type})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Assigned Faculty Members (Enforced Database Records) <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                🔒 Valid DB Foreign Keys Only
              </span>
            </div>

            {loadingFaculty ? (
              <div className="p-3 text-xs text-stone-500 font-bold animate-pulse">Loading active Faculty database records...</div>
            ) : dbFacultyList.length === 0 ? (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-900 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>No registered Faculty members found in database! Please register faculty members first.</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5 p-3 rounded-2xl border border-amber-200 bg-amber-50/30 dark:border-stone-700 dark:bg-stone-800/40">
                {dbFacultyList.map((faculty: any) => {
                  const isSelected = selectedFacultyIds.includes(faculty.id);
                  return (
                    <button
                      key={faculty.id}
                      type="button"
                      onClick={() => toggleFacultySelection(faculty.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-500 shadow-md'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-amber-50'
                      }`}
                    >
                      <UserCheck className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-stone-400'}`} />
                      <span>{faculty.firstName} {faculty.lastName} ({faculty.employeeId})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isGenerating || validationErrors.length > 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all cursor-pointer font-['Outfit'] disabled:opacity-40 disabled:cursor-not-allowed"
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
      {schedule && (() => {
        const activeSectionSlots = sortedSchedule.filter(s => s.section === activeSectionTab);
        const activeSectionConflicts = conflicts.filter(c => {
          const isSlotA = c.slotA && c.slotA.section === activeSectionTab;
          const isSlotB = c.slotB && c.slotB.section === activeSectionTab;
          return isSlotA || isSlotB || (!c.slotA && !c.slotB);
        });
        const hasActiveClashes = activeSectionConflicts.length > 0;

        return (
          <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-6">
            {/* Section Tab Selector */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-stone-50 dark:bg-stone-950/40 rounded-2xl border border-stone-200/60 dark:border-stone-850">
              {sections.filter(sec => 
                sec.semester === extractSemNum(semester) && 
                (!departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id || sec.departmentId === departments.find(d => normalize(d.name) === normalize(branch) || normalize(d.code) === normalize(branch))?.id)
              ).map(sec => {
                const secSlotsCount = sortedSchedule.filter(s => s.section === sec.name).length;
                const secConflictsCount = conflicts.filter(c => 
                  (c.slotA && c.slotA.section === sec.name) || 
                  (c.slotB && c.slotB.section === sec.name)
                ).length;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSectionTab(sec.name)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer font-['Outfit'] ${
                      activeSectionTab === sec.name
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-white hover:bg-stone-100/70 border border-stone-200 text-stone-600 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300'
                    }`}
                  >
                    <span>{sec.name}</span>
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                      activeSectionTab === sec.name
                        ? 'bg-emerald-700 text-emerald-100'
                        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}>
                      {secSlotsCount} slots
                    </span>
                    {secConflictsCount > 0 && (
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-3 border-b border-amber-100 dark:border-stone-800 gap-3">
              <div>
                <h3 className="text-base font-black text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Optimized Timetable for {semester} • {activeSectionTab}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-semibold">
                  {benchmarkTime !== null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-mono font-bold mr-2 text-[10px] border border-amber-200 dark:border-amber-900/60">
                      ⏱️ {benchmarkTime.toFixed(1)}ms
                    </span>
                  )}
                  {activeSectionSlots.length} Lectures scheduled for {activeSectionTab} •{' '}
                  {isValidating ? (
                    <span className="animate-pulse text-amber-600 font-bold">Auditing clashes...</span>
                  ) : validationError ? (
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold">Validation Unverified (Server Error)</span>
                  ) : (
                    <>
                      <span className={activeSectionConflicts.filter(c => c.type === 'FACULTY_CLASH').length > 0 ? 'text-rose-600 dark:text-rose-455 font-extrabold' : ''}>
                        {activeSectionConflicts.filter(c => c.type === 'FACULTY_CLASH').length} Faculty Clashes
                      </span>
                      {' • '}
                      <span className={activeSectionConflicts.filter(c => c.type === 'ROOM_CLASH').length > 0 ? 'text-rose-600 dark:text-rose-455 font-extrabold' : ''}>
                        {activeSectionConflicts.filter(c => c.type === 'ROOM_CLASH').length} Room Clashes
                      </span>
                      {' • '}
                      <span className={activeSectionConflicts.filter(c => c.type === 'STUDENT_CLASH').length > 0 ? 'text-rose-600 dark:text-rose-455 font-extrabold' : ''}>
                        {activeSectionConflicts.filter(c => c.type === 'STUDENT_CLASH').length} Student Clashes
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isValidating ? (
                  <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-850 dark:text-stone-300 text-xs font-black animate-pulse flex items-center gap-1.5 font-['Outfit'] border border-stone-200">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-stone-500" />
                    Auditing...
                  </span>
                ) : validationError ? (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-black border border-amber-250 dark:border-amber-900/60 flex items-center gap-1.5 font-['Outfit']">
                    ⚠ Unverified
                  </span>
                ) : hasActiveClashes ? (
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-350 text-xs font-black border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5 font-['Outfit']">
                    ⚠ Clashes Detected ({activeSectionConflicts.length})
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-black border border-emerald-250 dark:border-emerald-900/60 flex items-center gap-1.5 font-['Outfit']">
                    ✓ Verified Conflict Free ({activeSectionTab})
                  </span>
                )}
                
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-750 shadow-md transition-all cursor-pointer font-['Outfit']"
                >
                  <Download className="h-4 w-4 text-stone-500" />
                  Download PDF
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing || isValid === false || isValidating}
                  className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black text-white shadow-lg transition-all cursor-pointer font-['Outfit'] ${
                    isValid === false 
                      ? 'bg-stone-300 dark:bg-stone-800 shadow-none cursor-not-allowed opacity-60 text-stone-500' 
                      : validationError 
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25' 
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
                ) : validationError ? (
                  <>
                    <Send className="h-4 w-4" />
                    Publish (Unverified)
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

          {/* Validation Service/Connection Errors */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-250 text-stone-900 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                  ⚠️ Verification Alert: Could Not Perform Conflict Audit
                </p>
                <p className="text-xs font-semibold leading-relaxed text-stone-600 dark:text-stone-300">
                  {validationError}
                </p>
              </div>
              <button
                type="button"
                onClick={() => validateSchedule(semester, schedule)}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 border border-stone-200 dark:border-stone-700 text-xs font-black transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center"
              >
                <RefreshCw className="h-3.5 w-3.5 text-stone-500" />
                Retry Verification Check
              </button>
            </div>
          )}

          {/* Real Validation Failure Conflicts */}
          {isValid === false && conflicts.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 text-rose-950 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-xs text-rose-800 dark:text-rose-400">
                <span>⚠️ SYSTEM ALERT: TIMETABLE CONFLICTS DETECTED</span>
              </div>
              <ul className="list-disc pl-5 text-xs space-y-1.5 font-bold">
                {activeSectionConflicts.map((conflict, index) => (
                  <li key={index} className="leading-relaxed">
                    {conflict.message}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] font-semibold text-rose-700/80 dark:text-rose-400/80 italic">
                Publishing is blocked until these overlaps are resolved. Adjust the generated timetable or update source parameters.
              </p>
            </div>
          )}

          <div className="overflow-x-auto border border-stone-200 dark:border-stone-850 rounded-2xl bg-white dark:bg-stone-900">
            <table className="w-full border-collapse text-center text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-850/60 border-b border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-extrabold uppercase tracking-wider font-['Outfit']">
                  <th className="py-4 px-3 border-r border-stone-200 dark:border-stone-800 w-20">Day</th>
                  {((periods && periods.length > 0)
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
                      ]
                  ).map((col, idx) => (
                    <th key={idx} className="py-3 px-3 border-r border-stone-200 dark:border-stone-800 min-w-[140px]">
                      <div className="text-[11px] font-black text-stone-900 dark:text-white">{col.name}</div>
                      <div className="text-[9px] text-stone-500 font-semibold mt-0.5">{col.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName) => {
                  const DAY_SHORT: Record<string, string> = {
                    'Monday': 'Mo',
                    'Tuesday': 'Tu',
                    'Wednesday': 'We',
                    'Thursday': 'Th',
                    'Friday': 'Fr',
                    'Saturday': 'Sa'
                  };
                  const timeCols = (periods && periods.length > 0)
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

                  const daySlots = timeCols.map(col =>
                    activeSectionSlots.find(s => s.day === dayName && (s.periodId === col.id || s.time === col.label))
                  );
                  const rowCells: { colIndex: number; slot: any; colSpan: number }[] = [];
                  let i = 0;
                  while (i < timeCols.length) {
                    const currentSlot = daySlots[i];
                    let span = 1;
                    if (currentSlot && isLabSlot(currentSlot)) {
                      while (i + span < timeCols.length && isSameLab(currentSlot, daySlots[i + span])) {
                        span++;
                      }
                    }
                    rowCells.push({ colIndex: i, slot: currentSlot, colSpan: span });
                    i += span;
                  }

                  return (
                    <tr key={dayName} className="hover:bg-amber-50/10 dark:hover:bg-stone-800/5 transition-colors">
                      <td className="py-4 px-3 font-black text-amber-900 dark:text-amber-400 border-r border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/20 text-xs font-['Outfit']">
                        {DAY_SHORT[dayName] || dayName}
                      </td>
                      {rowCells.map(({ colIndex, slot, colSpan }) => (
                        <td
                          key={colIndex}
                          colSpan={colSpan > 1 ? colSpan : undefined}
                          className="p-3 border-r border-stone-200 dark:border-stone-800 relative align-middle"
                        >
                          {slot ? (
                            <div className="space-y-1 bg-amber-50/20 dark:bg-stone-850/20 p-2.5 rounded-xl border border-amber-100/40 dark:border-stone-750/30">
                              {/* Subject Name */}
                              <div className="text-xs font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                                {slot.subject}
                              </div>
                              
                              {/* Room & Faculty initials */}
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
          </div>
        );
      })()}
      </>
      ) : (
        <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-850 dark:bg-stone-900 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-stone-900 dark:text-white font-['Outfit'] flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              Period & Timing Management
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Configure the 7 fixed lecture periods for the institution. Timetable slots will automatically display updated times.
            </p>
          </div>

          {periodSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-250 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{periodSuccess}</span>
            </div>
          )}

          {periodError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-250 text-rose-950 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>{periodError}</span>
            </div>
          )}

          {/* Warning Banner showing count of TimetableSlots linked to period being edited */}
          {editingPeriodId && (() => {
            const editingPeriod = periods.find(p => p.id === editingPeriodId);
            const slotCount = editingPeriod?._count?.timetableSlots || 0;
            if (slotCount > 0) {
              return (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-300 text-xs font-semibold leading-relaxed">
                  ⚠️ <strong className="text-amber-900 dark:text-amber-300">{slotCount} classes</strong> are currently scheduled in this period. Editing the timings will automatically update how they display to students and faculty across all semesters.
                </div>
              );
            }
            return null;
          })()}

          {loadingPeriods ? (
            <div className="py-8 text-center text-xs font-semibold text-stone-500 animate-pulse">Loading lecture periods...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-amber-100 dark:border-stone-850 text-stone-400 uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-4">Period Name</th>
                    <th className="py-3 px-4 text-center">Order</th>
                    <th className="py-3 px-4">Start Time</th>
                    <th className="py-3 px-4">End Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 dark:divide-stone-850 text-stone-700 dark:text-stone-300 font-semibold">
                  {periods.map((period) => {
                    const isEditing = editingPeriodId === period.id;
                    return (
                      <tr key={period.id} className="hover:bg-amber-50/20 dark:hover:bg-stone-850/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-white">
                          {period.name}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-500">
                          {period.order}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-white">
                          {isEditing ? (
                            <input
                              type="time"
                              value={editStartTime}
                              onChange={(e) => setEditStartTime(e.target.value)}
                              className="rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-1.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                            />
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-300">
                              {formatTimeTo12h(period.startTime)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-white">
                          {isEditing ? (
                            <input
                              type="time"
                              value={editEndTime}
                              onChange={(e) => setEditEndTime(e.target.value)}
                              className="rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-1.5 text-xs font-bold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-white"
                            />
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-300">
                              {formatTimeTo12h(period.endTime)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSavePeriod(period.id)}
                                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black tracking-wider uppercase shadow-md shadow-amber-600/10 cursor-pointer flex items-center gap-1 transition-all"
                              >
                                <Save className="h-3 w-3" />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-black tracking-wider uppercase border border-stone-200 dark:border-stone-750 cursor-pointer flex items-center gap-1 transition-all"
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditPeriod(period)}
                              disabled={!!editingPeriodId}
                              className="px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 dark:bg-stone-800/80 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-[11px] font-black tracking-wider uppercase border border-stone-200 dark:border-stone-750 hover:border-amber-500 dark:hover:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-all"
                            >
                              <Edit className="h-3 w-3 text-stone-500" />
                              Edit Times
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AITimetableGenerator;
