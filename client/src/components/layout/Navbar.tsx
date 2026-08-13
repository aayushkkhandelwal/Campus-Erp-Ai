import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Search, 
  Bell, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  X,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeSliderSwitch } from '../ui/ThemeSliderSwitch';

interface NavbarProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Navbar = ({ onToggleSidebar, sidebarOpen }: NavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: 'New Semester Enrollment', time: '10m ago', unread: true, type: 'info' },
    { id: 2, title: 'Department Meeting at 3:00 PM', time: '1h ago', unread: true, type: 'warning' },
    { id: 3, title: 'Grade Submissions Finalized', time: '3h ago', unread: false, type: 'success' },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    if (query.includes('student')) navigate('/students');
    else if (query.includes('faculty') || query.includes('teacher')) navigate('/faculty');
    else if (query.includes('dept') || query.includes('department')) navigate('/departments');
    else if (query.includes('profile')) navigate('/profile');
    else if (query.includes('setting')) navigate('/settings');
    else navigate('/dashboard');
    setSearchQuery('');
    setSearchOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 sm:px-4 md:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors duration-200">
      {/* Mobile Hamburger + Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {sidebarOpen ? (
              <X className="h-5.5 w-5.5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Menu className="h-5.5 w-5.5 text-slate-700 dark:text-slate-300" />
            )}
          </button>
        )}

        <Link to="/dashboard" className="flex items-center gap-2 sm:gap-2.5 group">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md group-hover:scale-105 transition-transform duration-200 overflow-hidden">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-1">
              Campus<span className="text-indigo-600 dark:text-indigo-400">ERP</span>
            </span>
            <span className="hidden sm:block text-[10px] font-bold tracking-wider text-slate-400 uppercase truncate max-w-[140px]">
              Academic Management
            </span>
          </div>
        </Link>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-2 sm:mx-4">
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students, faculty, departments..."
            className="w-full rounded-full border border-slate-200 bg-slate-100/70 pl-10 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-900 transition-all duration-200 font-medium"
          />
        </form>

        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="md:hidden p-2 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ml-auto block"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        {/* Dark / Light Mode Slider Switch */}
        <ThemeSliderSwitch size="sm" />

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-600 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-colors ${
                      n.unread
                        ? 'bg-slate-50 dark:bg-slate-800/60'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {n.type === 'info' && <Bell className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />}
                    {n.type === 'warning' && <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                    {n.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200 leading-tight">
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 font-black text-xs text-white shadow-sm shadow-indigo-500/20">
              {getInitials(user?.fullName)}
            </div>
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                {user?.fullName || 'Academic User'}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {user?.role || 'ADMIN'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden lg:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {user?.fullName || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@college.edu'}</p>
              </div>

              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                <UserIcon className="h-4 w-4 text-indigo-600" />
                My Profile
              </Link>

              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="h-4 w-4 text-violet-600" />
                Settings
              </Link>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
