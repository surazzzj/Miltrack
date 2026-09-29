import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { auditService } from '../services/auditService';
import { DataTable } from '../components/common/DataTable';
import { Pagination } from '../components/common/Pagination';
import { FilterBar } from '../components/common/FilterBar';
import { RoleBadge } from '../components/common/RoleBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { AuditDetailDrawer } from '../components/audit/AuditDetailDrawer';
import { History, Eye, ShieldCheck, Terminal, Filter } from 'lucide-react';

export const AuditLogsPage = () => {
  const { user, isAdmin } = useAuth();
  const { error: toastError } = useToast();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected Log Drawer
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchAuditLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 15 };
        if (search) params.search = search;
        if (action) params.action = action;
        if (entityType) params.entityType = entityType;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const res = await auditService.getAuditLogs(params);
        setLogs(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        toastError(err.message || 'Failed to fetch cryptographic audit ledger.');
      } finally {
        setLoading(false);
      }
    },
    [search, action, entityType, dateFrom, dateTo, toastError]
  );

  useEffect(() => {
    fetchAuditLogs(1);
  }, [fetchAuditLogs]);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      cellClassName: 'font-mono text-xs text-on-surface whitespace-nowrap',
      render: (row) => (
        <span>
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      header: 'Operation Action',
      accessor: 'action',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-surface-container border border-border">
          {row.action}
        </span>
      ),
    },
    {
      header: 'Operator Personnel',
      accessor: 'userName',
      render: (row) => (
        <div>
          <div className="font-bold text-on-surface text-xs">{row.userName || 'Unauthenticated'}</div>
          <div className="mt-0.5">
            <RoleBadge role={row.role} showIcon={false} className="text-[9px] py-0 px-1.5" />
          </div>
        </div>
      ),
    },
    {
      header: 'Target Entity',
      accessor: 'entityType',
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-secondary">{row.entityType}</span>
          <span className="text-[10px] text-outline font-mono block truncate max-w-[120px]">
            {row.entityId || 'Global'}
          </span>
        </div>
      ),
    },
    {
      header: 'IP Origin',
      accessor: 'ipAddress',
      cellClassName: 'font-mono text-xs text-outline',
      render: (row) => row.ipAddress || '127.0.0.1',
    },
    {
      header: 'Integrity',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'COMPLETED'} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setSelectedLog(row);
              setIsDrawerOpen(true);
            }}
            className="p-1.5 text-outline hover:text-on-surface hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Inspect Audit Frame & State Delta"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Inspect Diff</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            Immutable Audit Ledger
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
            Complete cryptographic audit trail of all asset modifications, approvals, and mutations.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-mono font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>FIPS 140-3 COMPLIANT LEDGER</span>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={(type, val) => {
          if (type === 'dateFrom') setDateFrom(val);
          if (type === 'dateTo') setDateTo(val);
        }}
        showBaseFilter={false}
        showDateFilter={true}
        searchPlaceholder="Search operator name, mutation action or entity..."
        onApply={() => fetchAuditLogs(1)}
        onReset={() => {
          setSearch('');
          setAction('');
          setEntityType('');
          setDateFrom('');
          setDateTo('');
          fetchAuditLogs(1);
        }}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        emptyTitle="No audit records registered"
        emptyDescription="The immutable ledger has not recorded any transactions matching your parameters."
        onRowClick={(row) => {
          setSelectedLog(row);
          setIsDrawerOpen(true);
        }}
      />

      {/* Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={(p) => fetchAuditLogs(p)}
      />

      {/* Audit Detail Drawer with State Delta */}
      <AuditDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
      />
    </div>
  );
};
