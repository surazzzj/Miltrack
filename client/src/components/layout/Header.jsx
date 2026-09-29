import React, { useState } from 'react';
import { Menu, LogOut, ShieldCheck, Activity, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/RoleBadge';

export const Header = ({ onOpenSidebar, title = 'Asset Operations Platform' }) => {
  const { user, logout, isAdmin } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-border sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Menu Toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="md:hidden p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm md:text-base font-bold font-headline text-on-surface flex items-center gap-2">
            <span>{title}</span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE
            </span>
          </h1>
        </div>
      </div>

      {/* Right: Operational Info & User Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Base Scope Callout */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-border text-xs">
          <Activity className="w-3.5 h-3.5 text-secondary" />
          <span className="text-on-surface-variant font-medium">Jurisdiction:</span>
          <span className="font-bold text-on-surface">
            {user?.baseId?.name || (isAdmin ? 'All Installations' : 'Authorized Base')}
          </span>
        </div>

        {/* User Role Badge */}
        <div className="hidden sm:block">
          <RoleBadge role={user?.role} showIcon={false} />
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-container text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-headline font-bold text-xs shadow-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-on-surface leading-none">
                {user?.fullName || 'User'}
              </div>
              <div className="text-[10px] font-mono text-outline mt-0.5">
                {user?.rank || user?.role}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-outline hidden md:block" />
          </button>

          {userDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setUserDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-elevated z-30 py-2 divide-y divide-border/60">
                <div className="px-4 py-2">
                  <div className="text-xs font-bold text-on-surface">{user?.fullName}</div>
                  <div className="text-[11px] text-outline truncate">{user?.email}</div>
                  <div className="mt-1.5">
                    <RoleBadge role={user?.role} className="text-[10px]" />
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-4 py-1.5 text-[10px] font-mono text-outline uppercase tracking-wider">
                    Service ID: {user?.serviceId || 'MIL-9841'}
                  </div>
                </div>

                <div className="p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-error hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Secure Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
