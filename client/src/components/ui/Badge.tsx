import type { ReactNode } from 'react';
import { cn, getStatusColor, getRoleColor } from '../../utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'status' | 'role';
  value: string;
  className?: string;
}

const colorMap = {
  status: getStatusColor,
  role: getRoleColor,
};

const colorClasses: Record<string, string> = {
  green: 'bg-green-100 text-green-800',
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
};

export const Badge = ({ children, variant = 'status', value, className }: BadgeProps) => {
  const colorFn = colorMap[variant];
  const color = colorFn(value);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClasses[color] || colorClasses.gray,
        className
      )}
    >
      {children}
    </span>
  );
};

