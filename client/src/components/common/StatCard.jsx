import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, ChevronRight, Info } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  secondaryText,
  icon: Icon,
  badgeText,
  badgeType = 'neutral', // 'positive' | 'negative' | 'neutral' | 'accent'
  onClick,
  isClickable = false,
  tooltip,
  className = '',
}) => {
  const badgeStyles = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    negative: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    accent: 'bg-secondary-container/30 text-secondary border-secondary/20',
  };

  const formattedValue =
    typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : value ?? '—';

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`group relative bg-white border border-border rounded-xl p-5 md:p-6 transition-all duration-200 shadow-card hover:shadow-elevated ${
        isClickable
          ? 'cursor-pointer hover:border-secondary/40 hover:-translate-y-0.5 active:translate-y-0'
          : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-outline">
            {title}
          </span>
          {tooltip && (
            <span title={tooltip} className="cursor-help text-outline/60 hover:text-outline">
              <Info className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-bold font-headline text-on-surface tracking-tight">
          {formattedValue}
        </div>

        {badgeText && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono border ${
              badgeStyles[badgeType] || badgeStyles.neutral
            }`}
          >
            {badgeType === 'positive' && <ArrowUpRight className="w-3 h-3 mr-0.5" />}
            {badgeType === 'negative' && <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {badgeType === 'neutral' && <Minus className="w-3 h-3 mr-0.5" />}
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-on-surface-variant font-medium">
        <span>{secondaryText || 'Operational metrics'}</span>
        {isClickable && (
          <span className="flex items-center text-secondary font-semibold group-hover:translate-x-0.5 transition-transform duration-150">
            View breakdown
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </span>
        )}
      </div>
    </div>
  );
};
