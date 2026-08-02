import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Flame } from 'lucide-react';

const PRIORITY_CONFIG = {
  'Low': {
    label: 'Low',
    bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
    icon: ShieldCheck
  },
  'Medium': {
    label: 'Medium',
    bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    icon: Shield
  },
  'High': {
    label: 'High',
    bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    icon: ShieldAlert
  },
  'Critical': {
    label: 'Critical',
    bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-soft-pulse',
    icon: Flame
  }
};

export default function PriorityBadge({ priority = 'Medium', size = 'md' }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['Medium'];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2'
  }[size] || 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${config.bg} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
}
