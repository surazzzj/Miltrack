import React from 'react';

const statusStyles = {
  // Transfer / Purchase statuses
  PENDING: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Pending',
  },
  IN_TRANSIT: {
    bg: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
    label: 'In Transit',
  },
  COMPLETED: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Completed',
  },
  CANCELLED: {
    bg: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Cancelled',
  },
  // Assignment statuses
  ACTIVE: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Active',
  },
  RETURNED: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Returned',
  },
  TRANSFERRED: {
    bg: 'bg-purple-50 text-purple-800 border-purple-200',
    dot: 'bg-purple-500',
    label: 'Transferred',
  },
  // General active/inactive
  true: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Operational',
  },
  false: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Decommissioned',
  },
};

export const StatusBadge = ({ status, className = '' }) => {
  const normalized = statusStyles[status] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: String(status || 'Unknown'),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase font-mono ${normalized.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${normalized.dot}`} />
      <span>{normalized.label}</span>
    </span>
  );
};
