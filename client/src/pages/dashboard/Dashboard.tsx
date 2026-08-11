import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  TrendingUp,
  UserPlus,
  Building,
  ArrowUpRight,
  Calendar,
  Activity,
  Award,
  Sun,
  CheckSquare,
  FileSpreadsheet,
  Clock,
  BookMarked,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { studentService } from '../../services/student.service';
import { facultyService } from '../../services/faculty.service';
import { departmentService } from '../../services/department.service';
import { timetableService } from '../../services/timetable.service';
import { noticeService } from '../../services/notice.service';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_SCHEDULE_MAP: Record<string, Array<{ time: string; subject: string; room: string; faculty: string; section?: string }>> = {
  Monday: [
    { time: '09:00 - 10:00 AM', subject: 'DBMS (CS-501)', room: 'Room 201', faculty: 'Dr. Amit Sharma' },
    { time: '10:00 - 11:00 AM', subject: 'Artificial Intelligence (CS-505)', room: 'Room 104', faculty: 'Dr. Robert Langdon' },
    { time: '11:00 - 12:00 PM', subject: 'Computer Networks (CS-503)', room: 'Lab 2', faculty: 'Prof. Alan Turing' },
  ],
  Tuesday: [
    { time: '09:00 - 10:00 AM', subject: 'Operating Systems (CS-502)', room: 'Lab 3', faculty: 'Dr. Sarah Jenkins' },
    { time: '10:00 - 11:00 AM', subject: 'Software Engineering (CS-504)', room: 'Room 201', faculty: 'Dr. Robert Langdon' },
    { time: '11:00 - 12:00 PM', subject: 'DBMS (CS-501)', room: 'Room 201', faculty: 'Dr. Amit Sharma' },
  ],
  Wednesday: [
    { time: '09:00 - 11:00 AM', subject: 'DBMS Lab (CS-501L)', room: 'Lab 1', faculty: 'Dr. Amit Sharma' },
    { time: '11:00 - 12:00 PM', subject: 'Computer Networks (CS-503)', room: 'Lab 2', faculty: 'Prof. Alan Turing' },
    { time: '02:00 - 04:00 PM', subject: 'AI Lab (CS-505L)', room: 'Lab 4', faculty: 'Dr. Robert Langdon' },
  ],
  Thursday: [
    { time: '09:00 - 10:00 AM', subject: 'Software Engineering (CS-504)', room: 'Room 201', faculty: 'Dr. Robert Langdon' },
    { time: '10:00 - 11:00 AM', subject: 'Computer Networks (CS-503)', room: 'Lab 2', faculty: 'Prof. Alan Turing' },
    { time: '11:00 - 12:00 PM', subject: 'DBMS (CS-501)', room: 'Room 201', faculty: 'Dr. Amit Sharma' },
  ],
  Friday: [
    { time: '09:00 - 10:00 AM', subject: 'Artificial Intelligence (CS-505)', room: 'Room 104', faculty: 'Dr. Robert Langdon' },
    { time: '10:00 - 11:00 AM', subject: 'Operating Systems (CS-502)', room: 'Lab 3', faculty: 'Dr. Sarah Jenkins' },
    { time: '11:00 - 12:00 PM', subject: 'Software Engineering (CS-504)', room: 'Room 201', faculty: 'Dr. Robert Langdon' },
  ],
};

const defaultEnrollmentData = [
  { year: '2022', students: 120 },
  { year: '2023', students: 210 },
  { year: '2024', students: 350 },
  { year: '2025', students: 480 },
  { year: '2026', students: 550 },
];

const defaultDepartmentDist = [
  { name: 'CSE', value: 450, color: '#6366f1' },
  { name: 'EE', value: 310, color: '#f59e0b' },
  { name: 'ME', value: 220, color: '#f43f5e' },
  { name: 'CE', value: 130, color: '#10b981' },
];

const chartColors = ['#6366f1', '#f59e0b', '#f43f5e', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899'];

const recentActivities = [
  {
    id: 1,
    title: 'New Student Enrolled',
    detail: 'Emma Watson registered for Computer Science & Engineering',
    time: '15 mins ago',
    icon: UserPlus,
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50',
  },
  {
    id: 2,
    title: 'Department Guidelines Updated',
    detail: 'Biotechnology curriculum guidelines uploaded by HOD',
    time: '2 hours ago',
    icon: Building,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
  },
  {
    id: 3,
    title: 'Faculty Joined',
    detail: 'Prof. Alan Turing added to Computer Science faculty list',
    time: '1 day ago',
    icon: GraduationCap,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50',
  },
];

export const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  // Live Today's Day & Schedule Calculation
  const todayDate = new Date();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = daysOfWeek[todayDate.getDay()];
  const isWeekend = currentDayName === 'Saturday' || currentDayName === 'Sunday';
  const activeDayName = isWeekend ? 'Monday' : currentDayName;

  const { data: publishedSlots = [] } = useQuery({
    queryKey: ['published-timetable-dashboard'],
    queryFn: () => timetableService.getPublished(),
  });

  const { data: campusNotices = [] } = useQuery({
    queryKey: ['campus-notices-dashboard'],
    queryFn: () => noticeService.getAll(),
  });

  const rawTodaySlots = publishedSlots.filter((s) => s.day === activeDayName);

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

  const todaySlots = (
    rawTodaySlots.length > 0
      ? rawTodaySlots
      : DEFAULT_SCHEDULE_MAP[activeDayName] || DEFAULT_SCHEDULE_MAP['Monday']
  ).sort((a, b) => parseStartTime(a.time) - parseStartTime(b.time));

  // Admin Data Queries
  const { data: studentData } = useQuery({
    queryKey: ['students-list'],
    queryFn: () => studentService.getAll(),
    enabled: role === 'ADMIN',
  });

  const { data: facultyData } = useQuery({
    queryKey: ['faculty-list'],
    queryFn: () => facultyService.getAll(),
    enabled: role === 'ADMIN',
  });

  const { data: departmentData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll(),
    enabled: role === 'ADMIN',
  });

  const studentCount = studentData?.total ?? studentData?.data?.length ?? 0;
  const facultyCount = facultyData?.total ?? facultyData?.data?.length ?? 0;
  const departmentCount = departmentData?.total ?? departmentData?.data?.length ?? 0;

  // Dynamic Department Distribution Chart
  const realDeptDist = (departmentData?.data || []).map((d, idx) => ({
    name: d.code || d.name,
    value: d.studentCount || 0,
    color: chartColors[idx % chartColors.length],
  }));

  const departmentDist = realDeptDist.length > 0 ? realDeptDist : defaultDepartmentDist;

  // Dynamic Enrollment Trend
  const enrollmentData = defaultEnrollmentData.map((item) =>
    item.year === '2026' ? { ...item, students: Math.max(item.students, studentCount) } : item
  );

  // ---------------------------------------------------
  // 1. FACULTY DASHBOARD VIEW
  // ---------------------------------------------------
  if (role === 'FACULTY') {
    return (
      <div className="space-y-6">
        {/* Faculty Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/15">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold backdrop-blur-md mb-3 border border-white/30">
                <Sun className="h-3.5 w-3.5 text-amber-200" />
                Faculty Portal • Computer Science Dept
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight font-['Outfit']">
                Welcome back, {user?.fullName || 'Dr. Amit Sharma'}! 👨‍🏫
              </h1>
              <p className="mt-1 text-sm text-indigo-100 font-medium">
                Here is your teaching schedule, assigned subjects, and quick attendance tasks for today.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/faculty/attendance"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-indigo-700 shadow-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                <CheckSquare className="h-4 w-4 text-indigo-600" />
                Mark Attendance
              </Link>
              <Link
                to="/faculty/marks"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-900/30 backdrop-blur-md px-5 py-3 text-xs font-black text-white border border-white/30 hover:bg-indigo-900/50 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Enter Marks
              </Link>
            </div>
          </div>
        </div>

        {/* Assigned Subjects & Quick Task Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Assigned Subjects
              </span>
              <div className="p-2.5 rounded-2xl text-white bg-gradient-to-br from-indigo-500 to-violet-600">
                <BookMarked className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
              3 Subjects
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              DBMS, Operating Systems, Java Programming
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Today's Lectures
              </span>
              <div className="p-2.5 rounded-2xl text-white bg-gradient-to-br from-violet-500 to-purple-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
              2 Classes Scheduled
            </div>
            <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Next: DBMS at 09:00 AM (Room 201)
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pending Grade Entry
              </span>
              <div className="p-2.5 rounded-2xl text-white bg-gradient-to-br from-rose-500 to-pink-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
              Mid-Sem Internal
            </div>
            <p className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              45 Student Grade Sheets Pending
            </p>
          </div>
        </div>

        {/* Assigned Subjects & Timetable Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Today's Class Schedule ({activeDayName})
              </h3>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 px-3 py-1 rounded-full">
                Semester 5 & 3
              </span>
            </div>

            <div className="space-y-3">
              {todaySlots.map((slot, idx) => {
                const badgeColors = ['bg-indigo-600', 'bg-violet-600', 'bg-amber-500', 'bg-emerald-600'];
                const badgeColor = badgeColors[idx % badgeColors.length];
                return (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${badgeColor} text-white font-black text-xs shrink-0 shadow-sm`}>
                        {slot.time}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{slot.subject}</h4>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{slot.room} • Semester 5 (Section A) • 45 Students</p>
                      </div>
                    </div>
                    <Link
                      to="/faculty/attendance"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-black shadow-md cursor-pointer shrink-0"
                    >
                      Mark Present
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assigned Subjects Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-violet-600" />
              Assigned Subjects
            </h3>
            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">DBMS (CS-501)</span>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">Sem 5</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">4 Credits • 45 Students Enrolled</p>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">Operating Systems (CS-502)</span>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">Sem 5</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">4 Credits • 42 Students Enrolled</p>
              </div>

              <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">Java Programming (CS-303)</span>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md">Sem 3</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">3 Credits • 50 Students Enrolled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------
  // 2. STUDENT DASHBOARD VIEW
  // ---------------------------------------------------
  if (role === 'STUDENT') {
    return (
      <div className="space-y-6">
        {/* Student Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/15">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold backdrop-blur-md mb-3 border border-white/30">
                <Sun className="h-3.5 w-3.5 text-amber-200" />
                Student Portal • B.Tech IT (Semester 5 - Section A)
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight font-['Outfit']">
                Welcome, {user?.fullName || 'Rahul Sharma'}! 🎓
              </h1>
              <p className="mt-1 text-sm text-indigo-100 font-medium">
                Enrollment No: <span className="font-mono font-bold">{user?.email === 'aayushkkhandelwal@gmail.com' ? 'STU-2026-002' : user?.email === 'aayushkkhandelwal1511@gmail.com' ? 'STU-2026-003' : user?.email === 'chintanj982@gmail.com' ? 'STU-2026-004' : 'STU-2026-001'}</span> • Keep up your 93% attendance score!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/student/attendance"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-indigo-700 shadow-lg hover:bg-slate-50 transition-all cursor-pointer"
              >
                <CheckSquare className="h-4 w-4 text-indigo-600" />
                View Attendance
              </Link>
              <Link
                to="/student/fees"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-900/30 backdrop-blur-md px-5 py-3 text-xs font-black text-white border border-white/30 hover:bg-indigo-900/50 transition-all cursor-pointer"
              >
                <CreditCard className="h-4 w-4" />
                Pay Dues ($300)
              </Link>
            </div>
          </div>
        </div>

        {/* Student Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Overall Attendance
              </span>
              <div className="p-2.5 rounded-2xl text-white bg-gradient-to-br from-emerald-500 to-teal-600">
                <CheckSquare className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
              93%
            </div>
            <p className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              42 Present / 3 Absent
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Current GPA
              </span>
              <div className="p-2.5 rounded-2xl text-white bg-gradient-to-br from-indigo-500 to-violet-600">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
              3.85 / 4.0
            </div>
            <p className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Grade A+ (Rank #3 in class)
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pending Tuition Fee
              </span>
              <div className="p-2.5 rounded-2xl text-white bg-gradient-to-br from-rose-500 to-pink-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
              $300 Due
            </div>
            <p className="mt-2 text-xs font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Due before 15 October
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Upcoming Exam
              </span>
              <div className="p-2.5 rounded-2xl text-white bg-gradient-to-br from-amber-500 to-orange-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
              12 October
            </div>
            <p className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              Mid-Sem DBMS @ 09:00 AM
            </p>
          </div>
        </div>

        {/* Timetable & Notice Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Today's Classes Schedule ({activeDayName})
            </h3>
            <div className="space-y-3">
              {todaySlots.map((slot, idx) => {
                const badgeColors = ['bg-indigo-600', 'bg-violet-600', 'bg-amber-500', 'bg-emerald-600'];
                const badgeColor = badgeColors[idx % badgeColors.length];
                return (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className={`p-2.5 rounded-xl ${badgeColor} text-white font-bold text-xs shrink-0 shadow-sm`}>{slot.time}</span>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{slot.subject} ({slot.room})</h4>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Faculty: {slot.faculty}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-100 shrink-0">✓ Scheduled</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-rose-500" />
                Latest Campus Notices
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-100">
                LIVE
              </span>
            </div>
            <div className="space-y-3">
              {campusNotices.slice(0, 3).map((notice) => (
                <div key={notice.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{notice.title}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{notice.content}</p>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">{notice.author} • {notice.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------
  // 3. ADMIN DASHBOARD VIEW (DEFAULT)
  // ---------------------------------------------------
  const statCards = [
    {
      title: 'Total Students',
      value: studentCount.toLocaleString(),
      change: '+12.5% this year',
      icon: Users,
      color: 'from-indigo-600 to-violet-600',
      badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
      link: '/students',
    },
    {
      title: 'Faculty Members',
      value: facultyCount.toLocaleString(),
      change: '+4 new this term',
      icon: GraduationCap,
      color: 'from-violet-600 to-purple-600',
      badgeBg: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
      link: '/faculty',
    },
    {
      title: 'Academic Departments',
      value: departmentCount.toLocaleString(),
      change: 'All 6 accredited',
      icon: Building2,
      color: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
      link: '/departments',
    },
    {
      title: 'Active Courses',
      value: '42',
      change: '14 Core, 28 Elective',
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
      link: '/departments',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Sunrise Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/15">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/20 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold backdrop-blur-md mb-3 border border-white/30">
              <Sun className="h-3.5 w-3.5 text-amber-200" />
              Academic Year 2026-2027 • Central Administration
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight font-['Outfit']">
              Good day, {user?.fullName || 'Administrator'}! ☀️
            </h1>
            <p className="mt-1 text-sm text-indigo-100 font-medium max-w-xl">
              Welcome to the Campus ERP Central Control Panel. Here is your institutional overview and real-time operational summary.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/students/add"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-indigo-700 shadow-lg hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4 text-indigo-600" />
              Admit Student
            </Link>
          </div>
        </div>
      </div>

      {/* AI Dashboard Insights Banner */}
      <div className="rounded-3xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/80 via-violet-50/50 to-amber-50/50 p-5 dark:border-slate-800 dark:bg-slate-900 flex items-start gap-4 shadow-sm shadow-slate-200/40 dark:shadow-none">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shrink-0">
          <Sparkles className="h-6 w-6 text-amber-300" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white font-['Outfit']">
              AI Executive Insight Engine
            </h3>
            <span className="text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
              Automated Narrative
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
            "Attendance in Semester 5 has dropped by 8% over the last two weeks. DBMS (CS-501) has the highest absentee rate (14%). Overall fee collection is at 91.5% ($1.22M collected). Consider scheduling an academic review for Semester 5."
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-2xl text-white bg-gradient-to-br ${card.color} shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-['Outfit']">
                  {card.value}
                </span>
                <ArrowUpRight className="h-4 w-4 text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                <span>{card.change}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Enrollment Trend Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Outfit']">
                Student Enrollment Trend
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Annual growth across all departments (2021 - 2026)
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span>5 Years</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStudentsWarm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="#4f46e5"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#colorStudentsWarm)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Student Distribution Chart */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-['Outfit'] mb-1">
              Department Distribution
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">
              Student ratio per department
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {departmentDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            {departmentDist.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Campus Activity */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Outfit']">
                Recent Campus Activity
              </h3>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Real-time log</span>
          </div>

          <div className="space-y-4">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  className="flex items-start gap-4 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className={`p-2.5 rounded-2xl ${act.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {act.title}
                    </p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                      {act.detail}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                    {act.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Quick Actions */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white font-['Outfit']">
                Admin Operations
              </h3>
            </div>
            <div className="space-y-2.5">
              <Link
                to="/students/add"
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-indigo-50/70 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:active:bg-indigo-900/50 transition-colors group"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  Admit New Student
                </span>
                <ArrowUpRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/faculty/add"
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-violet-50/70 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-violet-950/60 dark:active:bg-violet-900/50 transition-colors group"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  Register Faculty Member
                </span>
                <ArrowUpRight className="h-4 w-4 text-violet-600 dark:text-violet-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/departments/add"
                className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-amber-50/70 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-amber-950/60 dark:active:bg-amber-900/50 transition-colors group"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  Establish Department
                </span>
                <ArrowUpRight className="h-4 w-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              System Status: Active RBAC Engine 🛡️
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
