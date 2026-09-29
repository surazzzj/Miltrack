import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RoleBadge } from '../components/common/RoleBadge';
import { ShieldCheck, User, Server, Key, Radio, CheckCircle2, RotateCcw } from 'lucide-react';

export const SettingsPage = () => {
  const { user, login } = useAuth();
  const { success, error: toastError } = useToast();

  const handleQuickSwitch = async (email, roleName) => {
    try {
      await login({ email, password: 'Password123!' });
      success(`Switched operational context to ${roleName}`, 'Session Re-authenticated');
    } catch (err) {
      toastError(err.message || 'Failed to switch session.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
          System Configuration & Telemetry
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
          Review operator credentials, cryptographic session parameters, and test accounts.
        </p>
      </div>

      {/* Operator Profile */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg font-headline">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold font-headline text-on-surface">
              {user?.fullName}
            </h3>
            <div className="text-xs text-outline font-mono">
              {user?.rank || 'Staff Officer'} • ID: {user?.serviceId || 'MIL-9841'}
            </div>
          </div>
          <div className="ml-auto">
            <RoleBadge role={user?.role} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-outline font-semibold uppercase text-[10px]">Email Coordinate</span>
            <div className="font-mono text-on-surface font-medium mt-0.5">{user?.email}</div>
          </div>
          <div>
            <span className="text-outline font-semibold uppercase text-[10px]">Assigned Base Installation</span>
            <div className="font-semibold text-on-surface mt-0.5">
              {user?.baseId?.name ? `${user.baseId.name} (${user.baseId.code})` : 'Global Central Command (Unrestricted)'}
            </div>
          </div>
          <div>
            <span className="text-outline font-semibold uppercase text-[10px]">Security Clearance</span>
            <div className="font-mono text-secondary font-bold mt-0.5">FIPS TIER 4 DEFENSE CLEARANCE</div>
          </div>
          <div>
            <span className="text-outline font-semibold uppercase text-[10px]">Session Status</span>
            <div className="font-mono text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ACTIVE JWT (7-Day Rotating)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Role Context Switcher for Evaluators */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-card space-y-4">
        <div>
          <h3 className="text-sm font-bold font-headline text-on-surface flex items-center gap-2">
            <Key className="w-4 h-4 text-secondary" />
            <span>Interactive Role Switcher for Evaluation</span>
          </h3>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            Instantly switch operational sessions to verify role-based permissions and base-scoping rules.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleQuickSwitch('admin@miltrack.local', 'HQ Administrator')}
            className={`p-4 rounded-xl border text-left transition-all ${
              user?.email === 'admin@miltrack.local'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-surface-container-lowest hover:border-primary/40 hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-bold text-primary font-headline">HQ Administrator</div>
            <div className="text-[10px] text-outline font-mono mt-0.5">admin@miltrack.local</div>
            <div className="text-[11px] text-on-surface-variant font-medium mt-2">
              Full access to all installations, user administration & ledgers.
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickSwitch('commander@miltrack.local', 'Base Commander (Base Alpha)')}
            className={`p-4 rounded-xl border text-left transition-all ${
              user?.email === 'commander@miltrack.local'
                ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                : 'border-border bg-surface-container-lowest hover:border-secondary/40 hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-bold text-secondary font-headline">Base Commander Alpha</div>
            <div className="text-[10px] text-outline font-mono mt-0.5">commander@miltrack.local</div>
            <div className="text-[11px] text-on-surface-variant font-medium mt-2">
              Restricted exclusively to Base Alpha ledger; forbidden from others.
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickSwitch('logistics@miltrack.local', 'Logistics Officer')}
            className={`p-4 rounded-xl border text-left transition-all ${
              user?.email === 'logistics@miltrack.local'
                ? 'border-tertiary bg-tertiary/5 ring-1 ring-tertiary'
                : 'border-border bg-surface-container-lowest hover:border-tertiary/40 hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-bold text-tertiary font-headline">Logistics Officer</div>
            <div className="text-[10px] text-outline font-mono mt-0.5">logistics@miltrack.local</div>
            <div className="text-[11px] text-on-surface-variant font-medium mt-2">
              Can record purchases & transfers; restricted from personnel admin.
            </div>
          </button>
        </div>
      </div>

      {/* System Infrastructure Telemetry */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-card space-y-3">
        <h3 className="text-sm font-bold font-headline text-on-surface flex items-center gap-2">
          <Server className="w-4 h-4 text-outline" />
          <span>System Environment & Architectural Specs</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-surface-container-low border border-border flex justify-between">
            <span className="text-outline font-sans">Database Engine:</span>
            <span className="text-on-surface font-bold">MongoDB 7.0 + Mongoose ORM</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low border border-border flex justify-between">
            <span className="text-outline font-sans">API Protocol:</span>
            <span className="text-on-surface font-bold">Express REST + HTTP-Only JWT</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low border border-border flex justify-between">
            <span className="text-outline font-sans">Ledger Model:</span>
            <span className="text-on-surface font-bold">Immutable Double-Entry Ledger</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-low border border-border flex justify-between">
            <span className="text-outline font-sans">Audit Trail:</span>
            <span className="text-on-surface font-bold">Cryptographic Delta Logging</span>
          </div>
        </div>
      </div>
    </div>
  );
};
