import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Page title mapping based on route
  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard')) return 'Asset Operations Dashboard';
    if (path.startsWith('/purchases')) return 'Procurement & Purchases';
    if (path.startsWith('/transfers')) return 'Inter-Base Asset Transfers';
    if (path.startsWith('/assignments')) return 'Asset Assignments & Expenditures';
    if (path.startsWith('/equipment')) return 'Equipment Inventory Registry';
    if (path.startsWith('/bases')) return 'Military Base Installations';
    if (path.startsWith('/audit-logs')) return 'Immutable Audit Ledger';
    if (path.startsWith('/users')) return 'Personnel & Role Management';
    if (path.startsWith('/settings')) return 'System Configuration';
    return 'Asset Operations Platform';
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col antialiased">
      {/* Sidebar (Desktop persistent + Mobile slide-out) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          title={getPageTitle(location.pathname)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
