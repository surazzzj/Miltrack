import React from 'react';

export const CardSkeleton = () => {
  return (
    <div className="bg-white border border-border rounded-xl p-6 shadow-card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 bg-slate-200 rounded w-24" />
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-8 bg-slate-200 rounded w-32 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-40" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full bg-white border border-border rounded-xl shadow-card overflow-hidden animate-pulse">
      <div className="bg-surface-container-low px-6 py-4 border-b border-border flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3.5 bg-slate-100 rounded"
                style={{ width: `${Math.max(40, 90 - (c * 15))}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="bg-white border border-border rounded-xl p-6 shadow-card animate-pulse flex flex-col justify-between h-[340px]">
      <div className="flex justify-between items-center mb-6">
        <div className="h-4 bg-slate-200 rounded w-44" />
        <div className="h-4 bg-slate-100 rounded w-20" />
      </div>
      <div className="flex items-end gap-3 h-48 w-full px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-100 rounded-t"
            style={{ height: `${25 + (i * 9) % 70}%` }}
          />
        ))}
      </div>
      <div className="h-3 bg-slate-100 rounded w-full mt-4" />
    </div>
  );
};
