import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeSliderSwitchProps {
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ThemeSliderSwitch = ({
  showLabels = false,
  size = 'md',
  className = '',
}: ThemeSliderSwitchProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: {
      track: 'w-14 h-7 p-0.5',
      thumb: 'h-6 w-6',
      translate: isDark ? 'translate-x-7' : 'translate-x-0',
      icon: 'h-3.5 w-3.5',
    },
    md: {
      track: 'w-16 h-8 p-1',
      thumb: 'h-6 w-6',
      translate: isDark ? 'translate-x-8' : 'translate-x-0',
      icon: 'h-3.5 w-3.5',
    },
    lg: {
      track: 'w-20 h-9 p-1',
      thumb: 'h-7 w-7',
      translate: isDark ? 'translate-x-11' : 'translate-x-0',
      icon: 'h-4 w-4',
    },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle dark mode theme slider"
        onClick={toggleTheme}
        className={`relative inline-flex items-center rounded-full cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 select-none ${
          sizeClasses.track
        } ${
          isDark
            ? 'bg-slate-800 border border-indigo-500/30 shadow-inner shadow-slate-950/80'
            : 'bg-slate-200/90 border border-slate-300/60 shadow-inner shadow-slate-300/40'
        }`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        {/* Background Track Icons */}
        <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none text-slate-400 dark:text-slate-500">
          <Sun className={`${sizeClasses.icon} text-amber-500/80 transition-opacity duration-200 ${isDark ? 'opacity-40' : 'opacity-0'}`} />
          <Moon className={`${sizeClasses.icon} text-indigo-400/80 transition-opacity duration-200 ${isDark ? 'opacity-0' : 'opacity-40'}`} />
        </div>

        {/* Sliding Thumb Knob */}
        <span
          className={`pointer-events-none flex items-center justify-center rounded-full shadow-md transform transition-all duration-300 ease-out z-10 ${
            sizeClasses.thumb
          } ${sizeClasses.translate} ${
            isDark
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-900/50 ring-1 ring-purple-400/30'
              : 'bg-white text-amber-500 shadow-slate-400/30 ring-1 ring-amber-300/50'
          }`}
        >
          {isDark ? (
            <Moon className={`${sizeClasses.icon} transform -rotate-12 transition-transform duration-300`} />
          ) : (
            <Sun className={`${sizeClasses.icon} transform rotate-45 transition-transform duration-300`} />
          )}
        </span>
      </button>

      {showLabels && (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </div>
  );
};
