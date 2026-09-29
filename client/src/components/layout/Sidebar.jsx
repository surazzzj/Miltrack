import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  ClipboardList,
  Crosshair,
  MapPin,
  History,
  Users,
  Settings,
  Shield,
  Radio,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/RoleBadge';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isCommander } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Operations Center',
      icon: LayoutDashboard,
      badge: 'LIVE',
    },
    {
      to: '/purchases',
      label: 'Procurement Lots',
      icon: ShoppingCart,
    },
    {
      to: '/transfers',
      label: 'Asset Movements',
      icon: ArrowLeftRight,
    },
    {
      to: '/assignments',
      label: 'Assignments & Draw',
      icon: ClipboardList,
    },
    {
      to: '/equipment',
      label: 'Equipment Registry',
      icon: Crosshair,
    },
    {
      to: '/bases',
      label: 'Installation Depots',
      icon: MapPin,
    },
    {
      to: '/audit-logs',
      label: 'Audit Ledger',
      icon: History,
    },
  ];

  // Admin-only nav item
  if (isAdmin) {
    navItems.push({
      to: '/users',
      label: 'Personnel & Access',
      icon: Users,
    });
  }

  // System Settings
  navItems.push({
    to: '/settings',
    label: 'Platform Config',
    icon: Settings,
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-primary text-white border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-white shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-headline font-extrabold text-sm tracking-widest text-white uppercase flex items-center gap-1.5">
              MILTRACK
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <div className="text-[10px] tracking-wider text-slate-400 uppercase font-mono">
              Asset Logistics Core
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Base Scoping Callout */}
      <div className="px-4 py-3 mx-4 mt-4 rounded-lg bg-slate-900/80 border border-slate-800">
        <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-1">
          <Shield className="w-3 h-3 text-secondary" />
          <span>Operational Jurisdiction</span>
        </div>
        <div className="text-xs font-semibold text-white truncate">
          {user?.baseId?.name || (isAdmin ? 'Central Command (Global)' : 'Tactical Unit')}
        </div>
        {user?.baseId?.code && (
          <div className="text-[10px] font-mono text-secondary mt-0.5">
            Depot Code: {user.baseId.code}
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">
          Tactical Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-secondary text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-bold tracking-wider">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Operator User Card in Footer */}
      <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white font-mono shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate font-headline">
              {user?.fullName || 'Operator'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {user?.email || 'authenticated'}
            </div>
          </div>
        </div>
        <div className="mt-2.5">
          <RoleBadge
            role={user?.role}
            className="w-full justify-center bg-slate-800 text-slate-200 border-slate-700 text-[11px]"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 fixed inset-y-0 left-0 z-30 shadow-elevated">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-primary/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-primary z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
