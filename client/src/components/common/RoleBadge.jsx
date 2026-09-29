import React from 'react';
import { Shield, ShieldAlert, Award } from 'lucide-react';

const roleConfigs = {
  ADMIN: {
    bg: 'bg-primary/10 text-primary border-primary/20',
    icon: ShieldAlert,
    label: 'HQ Administrator',
  },
  BASE_COMMANDER: {
    bg: 'bg-secondary/10 text-secondary border-secondary/20',
    icon: Award,
    label: 'Base Commander',
  },
  LOGISTICS_OFFICER: {
    bg: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    icon: Shield,
    label: 'Logistics Officer',
  },
};

export const RoleBadge = ({ role, showIcon = true, className = '' }) => {
  const config = roleConfigs[role] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Shield,
    label: role || 'Personnel',
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${config.bg} ${className}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
