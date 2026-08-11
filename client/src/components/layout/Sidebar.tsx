import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  User,
  Settings,
  LogOut,
  ChevronRight,
  CheckSquare,
  FileSpreadsheet,
  Calendar,
  Award,
  CreditCard,
  Sparkles,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'ADMIN';

  const adminSections = [
    {
      title: 'General',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'AI ERP Intelligence',
      items: [
        { to: '/admin/ai-timetable', label: 'AI Timetable Gen', icon: Sparkles },
        { to: '/admin/ai-reports', label: 'AI Report Generator', icon: FileText },
        { to: '/admin/ai-notices', label: 'AI Notice & Email Hub', icon: FileText },
      ],
    },
    {
      title: 'Academic Management',
      items: [
        { to: '/departments', label: 'Departments', icon: Building2 },
        { to: '/faculty', label: 'Faculty Members', icon: GraduationCap },
        { to: '/students', label: 'Students Directory', icon: Users },
      ],
    },
    {
      title: 'Administration',
      items: [
        { to: '/profile', label: 'My Profile', icon: User },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const facultySections = [
    {
      title: 'General',
      items: [
        { to: '/dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'AI Teaching Suite',
      items: [
        { to: '/faculty/ai-question-paper', label: 'AI Question Paper Gen', icon: Sparkles },
        { to: '/faculty/ai-performance', label: 'At-Risk Student Analysis', icon: AlertTriangle },
        { to: '/faculty/ai-assignment-checker', label: 'AI Assignment & Plagiarism', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Teaching & Academics',
      items: [
        { to: '/faculty/attendance', label: 'Mark Attendance', icon: CheckSquare },
        { to: '/faculty/marks', label: 'Enter Marks', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Account',
      items: [
        { to: '/profile', label: 'My Profile', icon: User },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const studentSections = [
    {
      title: 'General',
      items: [
        { to: '/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'AI Learning Suite',
      items: [
        { to: '/student/ai-assistant', label: 'AI Tutor & Career Guide', icon: Sparkles },
      ],
    },
    {
      title: 'Academic Information',
      items: [
        { to: '/student/attendance', label: 'My Attendance', icon: CheckSquare },
        { to: '/student/timetable', label: 'My Timetable', icon: Calendar },
        { to: '/student/marks', label: 'Marks & Grades', icon: Award },
      ],
    },
    {
      title: 'Finance & Account',
      items: [
        { to: '/student/fees', label: 'Fees & Payments', icon: CreditCard },
        { to: '/profile', label: 'My Profile', icon: User },
        { to: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const navigationSections =
    role === 'FACULTY'
      ? facultySections
      : role === 'STUDENT'
      ? studentSections
      : adminSections;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed left-0 top-16 bottom-0 z-50 w-64 border-r border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header Close Button */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 md:hidden">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Navigation Menu</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </h3>
              <div className="space-y-0.5 mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-150 ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800/60 shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`h-4 w-4 transition-colors ${
                                isActive
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-slate-400 group-hover:text-indigo-600 dark:text-slate-500 dark:group-hover:text-indigo-400'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>
                          {isActive && <ChevronRight className="h-3.5 w-3.5 text-indigo-500" />}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Logout */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800">
          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-rose-500" />
              <span>Logout</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
