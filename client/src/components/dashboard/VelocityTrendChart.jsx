import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const VelocityTrendChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-xs text-outline font-mono">
        No movement transaction history recorded in this interval.
      </div>
    );
  }

  // Normalize server data fields (handles both transfersIn/transferIn and period/label)
  const normalizedData = data.map((d) => ({
    label: d.label || d.period || '',
    purchases: d.purchases || 0,
    transferIn: d.transferIn ?? d.transfersIn ?? 0,
    transferOut: d.transferOut ?? d.transfersOut ?? 0,
  }));

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-elevated border border-slate-800 text-xs">
          <div className="font-bold font-mono text-slate-300 mb-1.5">{label}</div>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">
                {new Intl.NumberFormat('en-US').format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={normalizedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={customTooltip} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
          />
          <Bar dataKey="purchases" name="Purchases" fill="#059669" radius={[4, 4, 0, 0]} />
          <Bar dataKey="transferIn" name="Transfer In" fill="#0284c7" radius={[4, 4, 0, 0]} />
          <Bar dataKey="transferOut" name="Transfer Out" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
