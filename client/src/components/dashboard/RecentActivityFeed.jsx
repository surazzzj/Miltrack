import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Shield, ArrowRight, UserCheck, Layers, ShoppingCart, ArrowLeftRight, Flame } from 'lucide-react';

export const RecentActivityFeed = ({ activities = [] }) => {
  const navigate = useNavigate();

  if (!activities || activities.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-xs text-outline font-mono">
        No operational transactions recorded yet.
      </div>
    );
  }

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const getActionBadge = (type = '', action = '', status = '') => {
    const raw = String(type || action || status || 'ACTIVITY').toUpperCase();
    if (raw.includes('PURCHASE') || raw.includes('COMPLETED') || raw.includes('CREATED')) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: raw.includes('PURCHASE') ? 'PURCHASE' : raw.replace(/_/g, ' '),
        icon: ShoppingCart,
      };
    }
    if (raw.includes('EXPENDITURE') || raw.includes('DELETED') || raw.includes('CANCEL')) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        label: raw.includes('EXPEND') ? 'EXPENDITURE' : raw.replace(/_/g, ' '),
        icon: Flame,
      };
    }
    if (raw.includes('TRANSFER') || raw.includes('TRANSIT')) {
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        label: 'TRANSFER',
        icon: ArrowLeftRight,
      };
    }
    if (raw.includes('ASSIGN')) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        label: 'ASSIGNMENT',
        icon: UserCheck,
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      label: raw.replace(/_/g, ' '),
      icon: Layers,
    };
  };

  return (
    <div className="divide-y divide-border/60">
      {activities.map((act, index) => {
        const badge = getActionBadge(act.type, act.action, act.status);
        const Icon = badge.icon;
        const eventId = act.id || act._id || `act-${index}`;
        const eventTitle =
          act.title ||
          act.details ||
          act.description ||
          `${badge.label} operation recorded`;
        const officerName = act.officer || act.userName || 'Operational Staff';
        const eventTime = act.time || act.timestamp || act.createdAt;
        const code = act.code || act.entityType || null;

        return (
          <div
            key={eventId}
            className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold border tracking-wider uppercase ${badge.bg}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{badge.label}</span>
                </span>
                {code && (
                  <span className="text-[10px] font-mono text-outline font-semibold">
                    {code}
                  </span>
                )}
                {act.baseName && (
                  <span className="text-[10px] text-outline font-mono">
                    • {act.baseName}
                  </span>
                )}
              </div>

              <div className="text-on-surface font-semibold truncate">
                {eventTitle}
              </div>

              <div className="flex items-center gap-2 mt-1 text-[11px] text-outline">
                <span className="font-semibold text-on-surface-variant">
                  {officerName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(eventTime)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="pt-3 text-center">
        <button
          type="button"
          onClick={() => navigate('/audit-logs')}
          className="text-xs font-semibold text-secondary hover:text-secondary-hover inline-flex items-center gap-1 transition-colors"
        >
          <span>View complete cryptographic audit trail</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
