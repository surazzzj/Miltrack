import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

const CLASS_COLORS = {
  VEHICLE: '#0f172a',
  WEAPON: '#0284c7',
  AMMUNITION: '#e11d48',
  COMMUNICATION: '#0d9488',
  PROTECTIVE: '#d97706',
  OTHER: '#64748b',
};

export const ClassificationChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-xs text-outline font-mono">
        No asset categorization data available.
      </div>
    );
  }

  const totalQuantity = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const pct = totalQuantity > 0 ? Math.round((item.value / totalQuantity) * 100) : 0;
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-elevated border border-slate-800 text-xs">
          <div className="font-bold">{item.name}</div>
          <div className="font-mono text-slate-300 mt-1">
            {new Intl.NumberFormat('en-US').format(item.value)} units ({pct}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 h-[280px]">
      <div className="w-48 h-48 relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CLASS_COLORS[entry.type] || entry.color || '#64748b'}
                />
              ))}
            </Pie>
            <Tooltip content={customTooltip} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-mono text-outline">Total</span>
          <span className="text-sm font-bold font-headline text-on-surface">
            {new Intl.NumberFormat('en-US').format(totalQuantity)}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs w-full max-w-xs">
        {data.map((entry) => {
          const color = CLASS_COLORS[entry.type] || entry.color || '#64748b';
          const pct = totalQuantity > 0 ? Math.round((entry.value / totalQuantity) * 100) : 0;
          return (
            <div key={entry.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <div className="min-w-0 flex-1 truncate">
                <div className="font-medium text-on-surface truncate text-[11px]">{entry.name}</div>
                <div className="font-mono text-[10px] text-outline">{pct}% ({entry.value})</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
