import React from 'react';
import { MapPin, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BaseDistributionList = ({ bases = [] }) => {
  const navigate = useNavigate();

  if (!bases || bases.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-xs text-outline font-mono">
        No installation inventory records available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bases.map((base, index) => {
        const itemKey = base.baseId || base._id || base.code || `base-${index}`;
        const capacityUtilization = base.capacityUtilization ?? base.percentage ?? 0;
        const totalAssets = base.totalAssets ?? base.totalUnits ?? 0;
        const available = base.available ?? 0;
        const assigned = base.assigned ?? 0;

        return (
          <div
            key={itemKey}
            onClick={() => navigate('/bases')}
            className="p-3.5 rounded-xl border border-border bg-surface-container-lowest hover:bg-slate-50 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-secondary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-on-surface group-hover:text-secondary">
                  {base.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container text-outline">
                  {base.code}
                </span>
              </div>
              <div className="text-xs font-bold font-headline text-on-surface">
                {new Intl.NumberFormat('en-US').format(totalAssets)} assets
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden my-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityUtilization > 90
                    ? 'bg-rose-500'
                    : capacityUtilization > 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, capacityUtilization))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-outline font-mono">
              <span>
                Avail: <strong className="text-on-surface">{new Intl.NumberFormat('en-US').format(available)}</strong>
              </span>
              <span>
                Assigned: <strong className="text-on-surface">{new Intl.NumberFormat('en-US').format(assigned)}</strong>
              </span>
              <span>Capacity: {capacityUtilization}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
