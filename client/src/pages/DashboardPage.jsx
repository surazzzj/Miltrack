import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dashboardService } from '../services/dashboardService';
import { baseService } from '../services/baseService';
import { StatCard } from '../components/common/StatCard';
import { FilterBar } from '../components/common/FilterBar';
import { CardSkeleton, ChartSkeleton } from '../components/common/LoadingSkeleton';
import { NetMovementModal } from '../components/dashboard/NetMovementModal';
import { VelocityTrendChart } from '../components/dashboard/VelocityTrendChart';
import { ClassificationChart } from '../components/dashboard/ClassificationChart';
import { BaseDistributionList } from '../components/dashboard/BaseDistributionList';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import {
  Package,
  Layers,
  ArrowLeftRight,
  UserCheck,
  Flame,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, isAdmin, isCommander } = useAuth();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [bases, setBases] = useState([]);

  // Filters state
  const [baseId, setBaseId] = useState(user?.baseId?._id || user?.baseId || '');
  const [equipmentType, setEquipmentType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  // Net Movement Modal state
  const [isNetMovementModalOpen, setIsNetMovementModalOpen] = useState(false);

  // Fetch bases for the filter dropdown
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const res = await baseService.getBases();
        setBases(res.items || []);
      } catch (err) {
        console.error('Failed to load bases for filter:', err);
      }
    };
    fetchBases();
  }, []);

  // Fetch dashboard summary and analytics
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {};
      if (baseId) params.baseId = baseId;
      if (equipmentType) params.equipmentType = equipmentType;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await dashboardService.getSummary(params);
      setData(response);
    } catch (err) {
      toastError(err.message || 'Failed to load dashboard metrics from ledger.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseId, equipmentType, dateFrom, dateTo, toastError]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleApplyFilters = () => {
    fetchDashboardData();
  };

  const handleResetFilters = () => {
    setBaseId(isCommander ? (user?.baseId?._id || user?.baseId || '') : '');
    setEquipmentType('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Page Title & Mission Description */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            Asset Operations Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
            Monitor asset balances, movements, assignments and expenditures across bases.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-white text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors self-start md:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-secondary ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        baseId={baseId}
        onBaseChange={setBaseId}
        bases={bases}
        equipmentType={equipmentType}
        onEquipmentTypeChange={setEquipmentType}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={(type, val) => {
          if (type === 'dateFrom') setDateFrom(val);
          if (type === 'dateTo') setDateTo(val);
        }}
        showBaseFilter={!isCommander}
        showTypeFilter={true}
        showDateFilter={true}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* KPI Cards: Primary 5 metrics */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Opening Balance */}
          <StatCard
            title="Opening Balance"
            value={summary.openingBalance ?? 0}
            secondaryText="Prior interval base inventory"
            icon={Package}
            tooltip="Physical asset balance accumulated prior to the selected timeframe"
          />

          {/* 2. Closing Balance */}
          <StatCard
            title="Closing Balance"
            value={summary.closingBalance ?? 0}
            secondaryText="Current total physical stock"
            icon={Layers}
            badgeText="Physical"
            badgeType="accent"
            tooltip="Formula: Opening Balance + Purchases + Transfer In - Transfer Out - Expenditures"
          />

          {/* 3. Net Movement (CLICKABLE MODAL) */}
          <StatCard
            title="Net Movement"
            value={summary.netMovement ?? 0}
            secondaryText="Purchases & transfers delta"
            icon={ArrowLeftRight}
            isClickable={true}
            onClick={() => setIsNetMovementModalOpen(true)}
            badgeText={summary.netMovement >= 0 ? 'Inflow' : 'Outflow'}
            badgeType={summary.netMovement >= 0 ? 'positive' : 'negative'}
            tooltip="Click to inspect purchases and transfer inflow/outflow breakdown"
          />

          {/* 4. Assigned */}
          <StatCard
            title="Assigned"
            value={summary.assigned ?? 0}
            secondaryText="Allocated to personnel units"
            icon={UserCheck}
            badgeText="Deployed"
            badgeType="neutral"
            tooltip="Assets drawn by personnel in the field. Note: Does not decrease physical stock"
          />

          {/* 5. Expended */}
          <StatCard
            title="Expended"
            value={summary.expended ?? 0}
            secondaryText="Permanently consumed/spent"
            icon={Flame}
            badgeText="Expended"
            badgeType="negative"
            tooltip="Ammunition or non-recoverable assets permanently removed from ledger"
          />
        </div>
      )}

      {/* Secondary Movement Flow Cards (Purchases, Transfer In, Transfer Out, Available) */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-border rounded-xl p-4 shadow-card flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-mono text-outline">Purchases</div>
              <div className="text-lg font-bold font-headline text-emerald-700">
                +{new Intl.NumberFormat('en-US').format(summary.purchases || 0)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4 shadow-card flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-mono text-outline">Transfer In</div>
              <div className="text-lg font-bold font-headline text-sky-700">
                +{new Intl.NumberFormat('en-US').format(summary.transferIn || 0)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4 shadow-card flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-mono text-outline">Transfer Out</div>
              <div className="text-lg font-bold font-headline text-rose-700">
                –{new Intl.NumberFormat('en-US').format(summary.transferOut || 0)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4 shadow-card flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-mono text-outline">Available Stock</div>
              <div className="text-lg font-bold font-headline text-secondary">
                {new Intl.NumberFormat('en-US').format(summary.available || 0)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-secondary-container/20 text-secondary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Asset Movement Velocity Trend */}
        <div className="bg-white border border-border rounded-xl p-5 md:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-headline text-on-surface">
                Asset Movement Velocity Trend
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Weekly procurement inflows vs. inter-depot dispatches
              </p>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <VelocityTrendChart data={charts.velocityTrend || []} />
          )}
        </div>

        {/* Chart 2: Asset Distribution by Classification */}
        <div className="bg-white border border-border rounded-xl p-5 md:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-headline text-on-surface">
                Equipment Classification Distribution
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Breakdown across vehicles, ordnance, armor & telecom
              </p>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ClassificationChart data={charts.classificationDistribution || []} />
          )}
        </div>
      </div>

      {/* Lower Dual Grid: Installation Depots + Recent Operational Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Base Distribution */}
        <div className="bg-white border border-border rounded-xl p-5 md:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-headline text-on-surface">
                Installation Depots Capacity & Readiness
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Active military bases stock distribution & capacity load
              </p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <BaseDistributionList bases={charts.baseDistribution || []} />
          )}
        </div>

        {/* Recent Operational Activity Ledger */}
        <div className="bg-white border border-border rounded-xl p-5 md:p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-headline text-on-surface">
                Recent Ledger Transactions
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Real-time cryptographic audit trail of latest mutations
              </p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <RecentActivityFeed activities={recentActivity} />
          )}
        </div>
      </div>

      {/* Net Movement Breakdown Modal */}
      <NetMovementModal
        isOpen={isNetMovementModalOpen}
        onClose={() => setIsNetMovementModalOpen(false)}
        summary={summary}
        filters={{ baseId, equipmentType, dateFrom, dateTo }}
      />
    </div>
  );
};
