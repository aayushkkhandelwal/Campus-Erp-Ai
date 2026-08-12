import { useState } from 'react';
import { Sun, Moon, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleButtonProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggleButton = ({
  showLabel = false,
  className = '',
}: ThemeToggleButtonProps) => {
  const { theme, toggleTheme } = useTheme();
  const [isPending, setIsPending] = useState(false);
  const isDark = theme === 'dark';

  const handleClick = () => {
    if (isPending) return;
    setIsPending(true);

    setTimeout(() => {
      toggleTheme();
      setIsPending(false);
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`group relative flex items-center justify-center gap-2 p-2 rounded-xl border border-slate-200/80 bg-slate-100/80 hover:bg-slate-200/80 dark:border-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 select-none disabled:opacity-60 disabled:cursor-wait ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500 dark:text-amber-400" />
      ) : isDark ? (
        <Sun className="h-5 w-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
      )}

      {showLabel && (
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {isPending ? 'Switching...' : isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggleButton;
