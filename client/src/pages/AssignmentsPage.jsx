import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { assignmentService } from '../services/assignmentService';
import { expenditureService } from '../services/expenditureService';
import { baseService } from '../services/baseService';
import { DataTable } from '../components/common/DataTable';
import { Pagination } from '../components/common/Pagination';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { AssignmentModal } from '../components/assignments/AssignmentModal';
import { ExpenditureModal } from '../components/assignments/ExpenditureModal';
import { UserCheck, Flame, Plus, RotateCcw, Calendar, CheckCircle2 } from 'lucide-react';

export const AssignmentsPage = () => {
  const { user, isAdmin, isCommander } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'expenditures'

  // Assignments State
  const [assignments, setAssignments] = useState([]);
  const [assignPagination, setAssignPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loadingAssign, setLoadingAssign] = useState(true);

  // Expenditures State
  const [expenditures, setExpenditures] = useState([]);
  const [expendPagination, setExpendPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loadingExpend, setLoadingExpend] = useState(true);

  // Shared Filters
  const [bases, setBases] = useState([]);
  const [search, setSearch] = useState('');
  const [baseId, setBaseId] = useState(isCommander ? (user?.baseId?._id || user?.baseId || '') : '');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isExpendModalOpen, setIsExpendModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load bases
  useEffect(() => {
    const loadBases = async () => {
      try {
        const res = await baseService.getBases();
        setBases(res.items || []);
      } catch (err) {
        console.error('Failed to load bases:', err);
      }
    };
    loadBases();
  }, []);

  // Fetch Assignments
  const fetchAssignments = useCallback(
    async (page = 1) => {
      setLoadingAssign(true);
      try {
        const params = { page, limit: 10 };
        if (search) params.personnelName = search;
        if (baseId) params.baseId = baseId;
        if (status) params.status = status;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const res = await assignmentService.getAssignments(params);
        setAssignments(res.items || []);
        if (res.pagination) setAssignPagination(res.pagination);
      } catch (err) {
        toastError(err.message || 'Failed to fetch active assignments.');
      } finally {
        setLoadingAssign(false);
      }
    },
    [search, baseId, status, dateFrom, dateTo, toastError]
  );

  // Fetch Expenditures
  const fetchExpenditures = useCallback(
    async (page = 1) => {
      setLoadingExpend(true);
      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (baseId) params.baseId = baseId;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const res = await expenditureService.getExpenditures(params);
        setExpenditures(res.items || []);
        if (res.pagination) setExpendPagination(res.pagination);
      } catch (err) {
        toastError(err.message || 'Failed to fetch ordnance expenditures.');
      } finally {
        setLoadingExpend(false);
      }
    },
    [search, baseId, dateFrom, dateTo, toastError]
  );

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAssignments(1);
    } else {
      fetchExpenditures(1);
    }
  }, [activeTab, fetchAssignments, fetchExpenditures]);

  // Submit Assignment
  const handleCreateAssignment = async (formData) => {
    setIsSubmitting(true);
    try {
      await assignmentService.createAssignment(formData);
      success('Asset issued to personnel and available balance updated.', 'Assignment Created');
      setIsAssignModalOpen(false);
      fetchAssignments(1);
    } catch (err) {
      toastError(err.message || 'Unable to deploy assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Expenditure
  const handleCreateExpenditure = async (formData) => {
    setIsSubmitting(true);
    try {
      await expenditureService.createExpenditure(formData);
      success('Ordnance expenditure committed to ledger and inventory decreased.', 'Expenditure Logged');
      setIsExpendModalOpen(false);
      fetchExpenditures(1);
    } catch (err) {
      toastError(err.message || 'Unable to record expenditure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return an Assignment
  const handleReturnAssignment = async (id) => {
    try {
      await assignmentService.updateAssignment(id, {
        status: 'RETURNED',
        returnedAt: new Date().toISOString(),
      });
      success('Asset returned to base armory and restored to available stock.', 'Asset Returned');
      fetchAssignments(assignPagination.page);
    } catch (err) {
      toastError(err.message || 'Failed to process asset return.');
    }
  };

  const assignmentColumns = [
    {
      header: 'Assignment ID',
      accessor: 'assignmentNumber',
      cellClassName: 'font-mono text-xs font-semibold text-primary',
      render: (row) => (
        <div>
          <div className="font-bold">{row.assignmentNumber}</div>
          <div className="text-[10px] text-outline font-mono truncate max-w-[120px]">
            {row.assetCode || 'Armory Custody'}
          </div>
        </div>
      ),
    },
    {
      header: 'Date Issued',
      accessor: 'assignmentDate',
      render: (row) => (
        <span className="font-mono text-xs">
          {row.assignmentDate ? new Date(row.assignmentDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Base Installation',
      accessor: 'baseId',
      render: (row) => (
        <span className="font-medium text-on-surface">
          {row.baseId?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Equipment',
      accessor: 'equipmentId',
      render: (row) => (
        <div>
          <div className="font-bold text-on-surface">{row.equipmentId?.name || '—'}</div>
          <div className="text-[10px] text-secondary font-mono">
            {row.equipmentId?.type}
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Personnel',
      accessor: 'personnelName',
      render: (row) => (
        <div>
          <div className="font-semibold text-on-surface">{row.personnelName}</div>
          {row.personnelId && (
            <div className="text-[10px] font-mono text-outline">
              ID: {row.personnelId}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono font-bold text-on-surface',
      render: (row) => `${row.quantity} units`,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'ACTIVE'} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          {row.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => handleReturnAssignment(row._id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-surface-container hover:bg-slate-200 text-on-surface rounded-lg transition-colors"
              title="Return to depot armory"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Return</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const expenditureColumns = [
    {
      header: 'Expenditure ID',
      accessor: 'expenditureNumber',
      cellClassName: 'font-mono text-xs font-semibold text-error',
      render: (row) => (
        <div>
          <div className="font-bold">{row.expenditureNumber}</div>
          <div className="text-[10px] text-outline font-mono truncate max-w-[120px]">
            {row.personnelName || 'Range Incident'}
          </div>
        </div>
      ),
    },
    {
      header: 'Date Expended',
      accessor: 'date',
      render: (row) => (
        <span className="font-mono text-xs">
          {row.date ? new Date(row.date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Base Installation',
      accessor: 'baseId',
      render: (row) => (
        <span className="font-medium text-on-surface">
          {row.baseId?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Expended Asset',
      accessor: 'equipmentId',
      render: (row) => (
        <div>
          <div className="font-bold text-on-surface">{row.equipmentId?.name || '—'}</div>
          <div className="text-[10px] text-outline font-mono">
            {row.equipmentId?.type}
          </div>
        </div>
      ),
    },
    {
      header: 'Quantity Expended',
      accessor: 'quantity',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono font-bold text-error',
      render: (row) => `-${row.quantity} units`,
    },
    {
      header: 'Reason / Incident',
      accessor: 'reason',
      render: (row) => (
        <span className="text-xs text-on-surface-variant truncate block max-w-xs">
          {row.reason}
        </span>
      ),
    },
    {
      header: 'Authorized By',
      accessor: 'recordedBy',
      render: (row) => (
        <span className="text-xs text-outline font-medium">
          {row.recordedBy?.fullName || 'Range Commander'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            Assignments & Expenditures
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
            Manage unit personnel draw and irreversible ordnance expenditures.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'assignments' ? (
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>Issue Assignment</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsExpendModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-error hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Flame className="w-4 h-4" />
              <span>Record Munition Expenditure</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-headline border-b-2 transition-all ${
            activeTab === 'assignments'
              ? 'border-primary text-primary'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Active Unit Assignments</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 font-mono text-[10px] text-slate-700 font-bold">
            {assignPagination.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expenditures')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-headline border-b-2 transition-all ${
            activeTab === 'expenditures'
              ? 'border-error text-error'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Ordnance Expenditures</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-50 font-mono text-[10px] text-rose-700 font-bold">
            {expendPagination.total}
          </span>
        </button>
      </div>

      {/* Shared Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        baseId={baseId}
        onBaseChange={setBaseId}
        bases={bases}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={(type, val) => {
          if (type === 'dateFrom') setDateFrom(val);
          if (type === 'dateTo') setDateTo(val);
        }}
        showBaseFilter={!isCommander}
        showDateFilter={true}
        searchPlaceholder={
          activeTab === 'assignments'
            ? 'Search personnel name, squad, armory tag...'
            : 'Search expenditure reason, incident note...'
        }
        onApply={() => (activeTab === 'assignments' ? fetchAssignments(1) : fetchExpenditures(1))}
        onReset={() => {
          setSearch('');
          setBaseId(isCommander ? (user?.baseId?._id || user?.baseId || '') : '');
          setDateFrom('');
          setDateTo('');
          if (activeTab === 'assignments') fetchAssignments(1);
          else fetchExpenditures(1);
        }}
      />

      {/* Tab 1: Assignments Table */}
      {activeTab === 'assignments' && (
        <>
          <DataTable
            columns={assignmentColumns}
            data={assignments}
            isLoading={loadingAssign}
            emptyTitle="No active asset assignments"
            emptyDescription="All installation equipment remains securely held in depot armories."
            emptyAction={
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Issue First Assignment</span>
              </button>
            }
          />
          <Pagination
            page={assignPagination.page}
            totalPages={assignPagination.totalPages}
            total={assignPagination.total}
            limit={assignPagination.limit}
            onPageChange={(p) => fetchAssignments(p)}
          />
        </>
      )}

      {/* Tab 2: Expenditures Table */}
      {activeTab === 'expenditures' && (
        <>
          <DataTable
            columns={expenditureColumns}
            data={expenditures}
            isLoading={loadingExpend}
            emptyTitle="Zero recorded expenditures"
            emptyDescription="No munitions or consumables have been permanently consumed in this period."
            emptyAction={
              <button
                type="button"
                onClick={() => setIsExpendModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-error hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Record Expenditure</span>
              </button>
            }
          />
          <Pagination
            page={expendPagination.page}
            totalPages={expendPagination.totalPages}
            total={expendPagination.total}
            limit={expendPagination.limit}
            onPageChange={(p) => fetchExpenditures(p)}
          />
        </>
      )}

      {/* Issue Assignment Modal */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSubmit={handleCreateAssignment}
        isSubmitting={isSubmitting}
      />

      {/* Record Expenditure Modal */}
      <ExpenditureModal
        isOpen={isExpendModalOpen}
        onClose={() => setIsExpendModalOpen(false)}
        onSubmit={handleCreateExpenditure}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
