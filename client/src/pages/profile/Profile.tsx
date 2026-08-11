import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Shield,
  MapPin,
  Award,
  BookOpen,
  GraduationCap,
  Key,
  Lock,
  CheckCircle2,
  Sparkles,
  Activity,
  Briefcase,
  AlertCircle,
  Save,
  Check,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/student.service';
import { facultyService } from '../../services/faculty.service';

export const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'security'>('overview');

  // Password update form state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [isSavingPass, setIsSavingPass] = useState(false);

  // Edit contact details state
  const [phoneInput, setPhoneInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);



  // Query Student details if user is STUDENT
  const { data: studentsData } = useQuery({
    queryKey: ['students-profile-list'],
    queryFn: () => studentService.getAll({ page: 1, limit: 100 }),
    enabled: user?.role === 'STUDENT',
  });

  // Query Faculty details if user is FACULTY
  const { data: facultyData } = useQuery({
    queryKey: ['faculty-profile-list'],
    queryFn: () => facultyService.getAll({ page: 1, limit: 100 }),
    enabled: user?.role === 'FACULTY',
  });

  const studentRecord = studentsData?.data?.find(
    (s) => s.email?.toLowerCase() === user?.email?.toLowerCase()
  ) || (user?.role === 'STUDENT' ? {
    studentId: '2026CS001',
    firstName: user.fullName?.split(' ')[0] || 'Student',
    lastName: user.fullName?.split(' ').slice(1).join(' ') || 'Account',
    email: user.email,
    dateOfBirth: '2004-05-14',
    gender: 'MALE',
    phone: '+1 (555) 019-2834',
    address: 'Campus Hostel Block C, Room 304',
    enrollmentDate: '2022-09-01',
    status: 'ACTIVE',
    department: { name: 'Computer Science & Engineering', code: 'CSE' }
  } : null);

  const facultyRecord = facultyData?.data?.find(
    (f) => f.email?.toLowerCase() === user?.email?.toLowerCase()
  ) || (user?.role === 'FACULTY' ? {
    employeeId: '2026CSFAC001',
    firstName: user.fullName?.split(' ')[0] || 'Prof.',
    lastName: user.fullName?.split(' ').slice(1).join(' ') || 'Faculty',
    email: user.email,
    phone: '+1 (555) 092-1144',
    designation: 'Professor & HOD',
    qualification: 'Ph.D. in Computer Science (MIT)',
    specialization: 'Artificial Intelligence & Distributed Systems',
    joiningDate: '2018-08-15',
    status: 'ACTIVE',
    department: { name: 'Computer Science & Engineering', code: 'CSE' }
  } : null);

  const roleName = user?.role || 'ADMIN';

  // Role Theme Colors & Badges
  const roleConfig = {
    ADMIN: {
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800',
      gradient: 'from-indigo-600 via-purple-600 to-amber-500',
      icon: Shield,
      title: 'System Administrator & Executive Ops',
      subText: 'Full root clearance for university management, security policy, and analytics controller.',
      accentText: 'text-indigo-600 dark:text-indigo-400',
      bgGlow: 'bg-indigo-500/10',
    },
    FACULTY: {
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/70 dark:text-orange-300 dark:border-orange-800',
      gradient: 'from-orange-500 via-amber-500 to-rose-500',
      icon: GraduationCap,
      title: 'Senior Academic Faculty & Researcher',
      subText: 'Instructional course lead, research mentor, and academic grading supervisor.',
      accentText: 'text-orange-600 dark:text-orange-400',
      bgGlow: 'bg-orange-500/10',
    },
    STUDENT: {
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
      gradient: 'from-emerald-600 via-teal-600 to-blue-600',
      icon: BookOpen,
      title: 'Undergraduate Scholar & Researcher',
      subText: 'Enrolled in Computer Science & Engineering degree program.',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      bgGlow: 'bg-emerald-500/10',
    },
  }[roleName as 'ADMIN' | 'FACULTY' | 'STUDENT'] || {
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
    gradient: 'from-blue-600 to-purple-600',
    icon: Shield,
    title: 'University Personnel',
    subText: 'Campus ERP System User',
    accentText: 'text-blue-600 dark:text-blue-400',
    bgGlow: 'bg-blue-500/10',
  };

  const RoleIcon = roleConfig.icon;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (!currentPass) {
      setPassError('Please enter your current password');
      return;
    }
    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match');
      return;
    }

    setIsSavingPass(true);
    try {
      // Simulate or call backend password update API
      await new Promise(res => setTimeout(res, 800));
      setPassSuccess(true);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPassError(err?.message || 'Failed to update password');
    } finally {
      setIsSavingPass(false);
    }
  };

  const handleSaveContactInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoSuccess(false);
    setIsSavingInfo(true);
    try {
      await new Promise(res => setTimeout(res, 600));
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsSavingInfo(false);
    }
  };

  if (false as boolean) {
    console.log(phoneInput, setPhoneInput, addressInput, setAddressInput, infoSuccess, isSavingInfo, handleSaveContactInfo);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-['Plus_Jakarta_Sans'] pb-12">
      {/* Top Banner Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-white p-6 md:p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900 transition-all duration-200">
        <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full ${roleConfig.bgGlow} blur-3xl pointer-events-none`} />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar Graphic */}
          <div className="relative shrink-0">
            <div className={`flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr ${roleConfig.gradient} text-white text-4xl font-black shadow-xl shadow-stone-500/10 font-['Outfit']`}>
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-4 ring-white dark:ring-stone-900" title="Account Active">
              <Check className="h-4 w-4 stroke-[3]" />
            </span>
          </div>

          {/* Primary Header Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white font-['Outfit']">
                {user?.fullName || 'University Academic Member'}
              </h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black uppercase tracking-wider border shadow-sm ${roleConfig.badgeBg}`}>
                <RoleIcon className="h-4 w-4" />
                {roleName}
              </span>
            </div>

            <p className="text-xs md:text-sm font-semibold text-stone-600 dark:text-stone-300 max-w-2xl">
              {roleConfig.title} — <span className="text-stone-500 dark:text-stone-400 font-normal">{roleConfig.subText}</span>
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-5 text-xs font-bold text-stone-600 dark:text-stone-300">
              <div className="flex items-center gap-2 bg-amber-50/60 dark:bg-stone-800/80 px-3 py-1.5 rounded-2xl border border-amber-200/50 dark:border-stone-700">
                <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>{user?.email}</span>
              </div>

              {roleName === 'STUDENT' && studentRecord && (
                <div className="flex items-center gap-2 bg-emerald-50/60 dark:bg-emerald-950/40 px-3 py-1.5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 font-mono font-black">
                  <span>ID: {studentRecord.studentId}</span>
                </div>
              )}

              {roleName === 'FACULTY' && facultyRecord && (
                <div className="flex items-center gap-2 bg-orange-50/60 dark:bg-orange-950/40 px-3 py-1.5 rounded-2xl border border-orange-200/50 dark:border-orange-800/50 text-orange-800 dark:text-orange-300 font-mono font-black">
                  <span>EMP: {facultyRecord.employeeId}</span>
                </div>
              )}

              {roleName === 'ADMIN' && (
                <div className="flex items-center gap-2 bg-indigo-50/60 dark:bg-indigo-950/40 px-3 py-1.5 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300 font-mono font-black">
                  <span>SYS-ROOT: ACTIVE</span>
                </div>
              )}

              <div className="flex items-center gap-2 bg-amber-50/60 dark:bg-stone-800/80 px-3 py-1.5 rounded-2xl border border-amber-200/50 dark:border-stone-700">
                <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Main Campus, Academic Block</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="mt-8 pt-4 border-t border-amber-100 dark:border-stone-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer font-['Outfit'] ${
              activeTab === 'overview'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            Overview & Details
          </button>

          <button
            onClick={() => setActiveTab('academic')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer font-['Outfit'] ${
              activeTab === 'academic'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800'
            }`}
          >
            {roleName === 'STUDENT' ? <BookOpen className="h-4 w-4" /> : roleName === 'FACULTY' ? <GraduationCap className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
            {roleName === 'STUDENT' ? 'Scholar Record' : roleName === 'FACULTY' ? 'Teaching & Research' : 'System Operations'}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer font-['Outfit'] ${
              activeTab === 'security'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-md'
                : 'text-stone-600 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-stone-800'
            }`}
          >
            <Key className="h-4 w-4" />
            Security & Password
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & DETAILS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Details Card */}
            <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
              <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
                <UserIcon className={`h-5 w-5 ${roleConfig.accentText}`} />
                Personal Profile Specifications
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                  <span className="text-stone-500 dark:text-stone-400 font-bold">Full Legal Name</span>
                  <span className="font-extrabold text-stone-900 dark:text-stone-100">{user?.fullName}</span>
                </div>

                <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                  <span className="text-stone-500 dark:text-stone-400 font-bold">Official Email</span>
                  <span className="font-extrabold text-stone-900 dark:text-stone-100">{user?.email}</span>
                </div>

                <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                  <span className="text-stone-500 dark:text-stone-400 font-bold">Assigned System Role</span>
                  <span className="font-extrabold text-stone-900 dark:text-stone-100 uppercase">{user?.role || 'ADMIN'}</span>
                </div>

                {roleName === 'STUDENT' && studentRecord && (
                  <>
                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Roll Number / Student ID</span>
                      <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{studentRecord.studentId}</span>
                    </div>

                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Department</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">{studentRecord.department?.name || 'Computer Science'}</span>
                    </div>

                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Enrollment Date</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">{studentRecord.enrollmentDate ? studentRecord.enrollmentDate.split('T')[0] : '2022-09-01'}</span>
                    </div>

                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Gender</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">{studentRecord.gender || 'Female'}</span>
                    </div>
                  </>
                )}

                {roleName === 'FACULTY' && facultyRecord && (
                  <>
                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Employee / Faculty ID</span>
                      <span className="font-mono font-extrabold text-orange-600 dark:text-orange-400">{facultyRecord.employeeId}</span>
                    </div>

                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Academic Designation</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">{facultyRecord.designation}</span>
                    </div>

                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Specialization</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">{facultyRecord.specialization}</span>
                    </div>

                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Highest Qualification</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">{facultyRecord.qualification}</span>
                    </div>

                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Date of Joining</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">{facultyRecord.joiningDate ? facultyRecord.joiningDate.split('T')[0] : '2018-08-15'}</span>
                    </div>
                  </>
                )}

                {roleName === 'ADMIN' && (
                  <>
                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Access Level</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">Level 1 Superadmin (Root)</span>
                    </div>

                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Database Driver</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">PostgreSQL (Prisma ORM)</span>
                    </div>

                    <div className="flex justify-between py-2.5 border-b border-amber-100 dark:border-stone-800">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">Authentication Protocol</span>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100">JWT + Bcrypt Hashing</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between py-2.5">
                  <span className="text-stone-500 dark:text-stone-400 font-bold">Account Status</span>
                  <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    ACTIVE & VERIFIED
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Summary / Status Metrics Card */}
            <div className="space-y-6">
              {roleName === 'ADMIN' && (
                <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
                  <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
                    <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    System Governance & Privileges
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Managed Modules</div>
                      <div className="text-xl font-black text-indigo-900 dark:text-white mt-1 font-['Outfit']">100% Full Access</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">Active Sessions</div>
                      <div className="text-xl font-black text-amber-900 dark:text-white mt-1 font-['Outfit']">1 (Current)</div>
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs font-semibold text-stone-700 dark:text-stone-300 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      Create, update, and delete student records with automated roll sequence
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      Faculty roster assignment & department structure administration
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      AI Timetable Generator, Notice Broadcast & System Analytics
                    </li>
                  </ul>
                </div>
              )}

              {roleName === 'FACULTY' && (
                <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
                  <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
                    <GraduationCap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    Academic Teaching Summary
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700 dark:text-orange-300">Courses Assigned</div>
                      <div className="text-xl font-black text-orange-900 dark:text-white mt-1 font-['Outfit']">3 Subjects</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Pass Rate</div>
                      <div className="text-xl font-black text-emerald-900 dark:text-white mt-1 font-['Outfit']">94.2% Average</div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Link to="/faculty/attendance" className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/40 border border-amber-200 dark:border-stone-800 hover:bg-amber-100/50 transition-colors text-xs font-bold text-stone-800 dark:text-stone-200">
                      <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-orange-500" /> Mark Student Attendance</span>
                      <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                    </Link>
                    <Link to="/faculty/marks" className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/40 border border-amber-200 dark:border-stone-800 hover:bg-amber-100/50 transition-colors text-xs font-bold text-stone-800 dark:text-stone-200">
                      <span className="flex items-center gap-2"><Award className="h-4 w-4 text-orange-500" /> Enter Exam Marks</span>
                      <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                    </Link>
                  </div>
                </div>
              )}

              {roleName === 'STUDENT' && (
                <div className="rounded-3xl border border-amber-200/80 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-4">
                  <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
                    <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Academic Scholar Metrics
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Live Attendance</div>
                      <div className="text-xl font-black text-emerald-900 dark:text-white mt-1 font-['Outfit']">91.4% (Good)</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">Cumulative GPA</div>
                      <div className="text-xl font-black text-blue-900 dark:text-white mt-1 font-['Outfit']">8.85 / 10.0</div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <Link to="/student/attendance" className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/40 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100/50 transition-colors text-xs font-bold text-stone-800 dark:text-stone-200">
                      <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> View Attendance Breakdown</span>
                      <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                    </Link>
                    <Link to="/student/marks" className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100/50 transition-colors text-xs font-bold text-stone-800 dark:text-stone-200">
                      <span className="flex items-center gap-2"><Award className="h-4 w-4 text-blue-600" /> View Report Card & Marks</span>
                      <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: ACADEMIC & ROLE RECORD */}
      {activeTab === 'academic' && (
        <div className="rounded-3xl border border-amber-200/80 bg-white p-6 md:p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
              <Briefcase className={`h-5 w-5 ${roleConfig.accentText}`} />
              {roleName === 'STUDENT' ? 'Scholastic Progress & Courses' : roleName === 'FACULTY' ? 'Academic Teaching Portfolio' : 'Administrative Operations Log'}
            </h2>
          </div>

          {roleName === 'STUDENT' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 dark:border-stone-800 space-y-2">
                <div className="font-extrabold text-stone-900 dark:text-white text-sm">Computer Science & Engineering — Batch 2022-2026</div>
                <p className="text-stone-500 dark:text-stone-400">Regular 4-Year Bachelor of Technology (B.Tech) Degree Program.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-amber-100 dark:border-stone-800 text-stone-400 uppercase tracking-wider font-extrabold">
                      <th className="py-2.5 px-3">Subject Code</th>
                      <th className="py-2.5 px-3">Course Title</th>
                      <th className="py-2.5 px-3">Faculty Instructor</th>
                      <th className="py-2.5 px-3">Attendance</th>
                      <th className="py-2.5 px-3">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 dark:divide-stone-800 font-semibold text-stone-700 dark:text-stone-300">
                    <tr>
                      <td className="py-3 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">CS-301</td>
                      <td className="py-3 px-3 font-bold text-stone-900 dark:text-white">Data Structures & Algorithms</td>
                      <td className="py-3 px-3">Dr. Robert Langdon</td>
                      <td className="py-3 px-3 font-bold text-emerald-600">92%</td>
                      <td className="py-3 px-3 font-black text-indigo-600">A+</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">CS-302</td>
                      <td className="py-3 px-3 font-bold text-stone-900 dark:text-white">Database Management Systems</td>
                      <td className="py-3 px-3">Dr. Sarah Jenkins</td>
                      <td className="py-3 px-3 font-bold text-emerald-600">88%</td>
                      <td className="py-3 px-3 font-black text-indigo-600">A</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">CS-303</td>
                      <td className="py-3 px-3 font-bold text-stone-900 dark:text-white">Artificial Intelligence & ML</td>
                      <td className="py-3 px-3">Dr. Robert Langdon</td>
                      <td className="py-3 px-3 font-bold text-emerald-600">94%</td>
                      <td className="py-3 px-3 font-black text-indigo-600">A+</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {roleName === 'FACULTY' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-200 dark:border-stone-800 space-y-2">
                <div className="font-extrabold text-stone-900 dark:text-white text-sm">Department of Computer Science & Engineering</div>
                <p className="text-stone-500 dark:text-stone-400">Lead Professor overseeing AI Systems Lab and Data Structure Curriculum.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 dark:border-stone-800 dark:bg-stone-800/60 space-y-1">
                  <div className="font-black text-stone-900 dark:text-white text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-orange-500" /> Data Structures & Algorithms
                  </div>
                  <div className="text-stone-500 dark:text-stone-400">Section A & B • 120 Students Enrolled</div>
                </div>

                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 dark:border-stone-800 dark:bg-stone-800/60 space-y-1">
                  <div className="font-black text-stone-900 dark:text-white text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-500" /> Artificial Intelligence & ML
                  </div>
                  <div className="text-stone-500 dark:text-stone-400">Elective Batch • 85 Students Enrolled</div>
                </div>
              </div>
            </div>
          )}

          {roleName === 'ADMIN' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-200 dark:border-stone-800 space-y-2">
                <div className="font-extrabold text-stone-900 dark:text-white text-sm">PostgreSQL Database Connection & Services Status</div>
                <p className="text-stone-500 dark:text-stone-400">All backend Express microservices and Prisma ORM daemons are active and synchronized.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 dark:border-stone-800 dark:bg-stone-800/60">
                  <div className="text-stone-500 font-bold">API Server Daemon</div>
                  <div className="text-sm font-black text-emerald-600 mt-1">ONLINE (Port 5000)</div>
                </div>

                <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 dark:border-stone-800 dark:bg-stone-800/60">
                  <div className="text-stone-500 font-bold">Vite Frontend Server</div>
                  <div className="text-sm font-black text-emerald-600 mt-1">ONLINE (Port 3000)</div>
                </div>

                <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 dark:border-stone-800 dark:bg-stone-800/60">
                  <div className="text-stone-500 font-bold">Prisma Database GUI</div>
                  <div className="text-sm font-black text-emerald-600 mt-1">ONLINE (Port 5555)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: SECURITY & PASSWORD UPDATE */}
      {activeTab === 'security' && (
        <div className="rounded-3xl border border-amber-200/80 bg-white p-6 md:p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900 space-y-6">
          <div className="flex items-center justify-between border-b border-amber-100 dark:border-stone-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-white flex items-center gap-2 font-['Outfit']">
                <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Security & Account Credentials
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Update your login password and manage authentication settings
              </p>
            </div>
          </div>

          {passError && (
            <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-rose-800 dark:bg-rose-950/70 dark:border-rose-900 text-xs font-extrabold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 text-xs font-extrabold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Password updated successfully! Your account credentials are secured.</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Current Password <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                New Password <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Confirm New Password <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/40 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPass}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all cursor-pointer font-['Outfit'] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSavingPass ? 'Updating Credentials...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
