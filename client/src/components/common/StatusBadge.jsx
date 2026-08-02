import React from 'react';
import { Circle, UserCheck, PlayCircle, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';

const STATUS_CONFIG = {
  'Open': {
    label: 'Open',
    bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
    icon: Circle
  },
  'Assigned': {
    label: 'Assigned',
    bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    dot: 'bg-blue-500',
    icon: UserCheck
  },
  'In Progress': {
    label: 'In Progress',
    bg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500',
    icon: PlayCircle
  },
  'Resolved': {
    label: 'Resolved',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    icon: CheckCircle2
  },
  'Closed': {
    label: 'Closed',
    bg: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800',
    dot: 'bg-green-500',
    icon: CheckCircle2
  },
  'Reopened': {
    label: 'Reopened',
    bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
    icon: RotateCcw
  }
};

export default function StatusBadge({ status, size = 'md', showIcon = true }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Open'];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2'
  }[size] || 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm transition-all ${config.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
}
