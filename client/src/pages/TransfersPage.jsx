import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { transferService } from '../services/transferService';
import { baseService } from '../services/baseService';
import { DataTable } from '../components/common/DataTable';
import { Pagination } from '../components/common/Pagination';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { TransferModal } from '../components/transfers/TransferModal';
import { TransferDetailDrawer } from '../components/transfers/TransferDetailDrawer';
import { Plus, Eye, ArrowRight, ArrowLeftRight } from 'lucide-react';

export const TransfersPage = () => {
  const { user, isAdmin, isLogistics, isCommander } = useAuth();
  const { success, error: toastError } = useToast();

  const [transfers, setTransfers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [bases, setBases] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [fromBaseId, setFromBaseId] = useState('');
  const [toBaseId, setToBaseId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  // Fetch transfers
  const fetchTransfers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 10,
        };
        if (search) params.search = search;
        if (fromBaseId) params.fromBaseId = fromBaseId;
        if (toBaseId) params.toBaseId = toBaseId;
        if (status) params.status = status;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const res = await transferService.getTransfers(params);
        setTransfers(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        toastError(err.message || 'Failed to fetch inter-base transfers.');
      } finally {
        setLoading(false);
      }
    },
    [search, fromBaseId, toBaseId, status, dateFrom, dateTo, toastError]
  );

  useEffect(() => {
    fetchTransfers(1);
  }, [fetchTransfers]);

  // Create Transfer
  const handleCreateTransfer = async (formData) => {
    setIsSubmitting(true);
    try {
      await transferService.createTransfer(formData);
      success('Transfer dispatch order created and registered in ledger.', 'Order Initialized');
      setIsModalOpen(false);
      fetchTransfers(1);
    } catch (err) {
      toastError(err.message || 'Unable to create transfer order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Status (e.g. mark IN_TRANSIT, COMPLETED, CANCELLED)
  const handleUpdateStatus = async (id, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await transferService.updateTransferStatus(id, { status: newStatus });
      success(
        `Transfer status updated to ${newStatus}. ${
          newStatus === 'COMPLETED' ? 'Inventory balances synchronized!' : ''
        }`,
        'Status Transitioned'
      );
      if (selectedTransfer && selectedTransfer._id === id) {
        setSelectedTransfer(res.data);
      }
      fetchTransfers(pagination.page);
    } catch (err) {
      toastError(err.message || 'Failed to transition transfer status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const columns = [
    {
      header: 'Transfer ID',
      accessor: 'transferNumber',
      cellClassName: 'font-mono text-xs font-semibold text-primary',
      render: (row) => (
        <div>
          <div className="font-bold">{row.transferNumber}</div>
          <div className="text-[10px] text-outline font-mono truncate max-w-[120px]">
            {row.assetCode || 'Standard Batch'}
          </div>
        </div>
      ),
    },
    {
      header: 'Dispatch Date',
      accessor: 'transferDate',
      render: (row) => (
        <span className="font-mono text-xs">
          {row.transferDate ? new Date(row.transferDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Transfer Route',
      key: 'route',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-on-surface">{row.fromBaseId?.code || 'ORIGIN'}</span>
          <ArrowRight className="w-3.5 h-3.5 text-secondary shrink-0" />
          <span className="font-semibold text-on-surface">{row.toBaseId?.code || 'DEST'}</span>
        </div>
      ),
    },
    {
      header: 'Equipment Asset',
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
      header: 'Quantity',
      accessor: 'quantity',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono font-bold text-on-surface',
      render: (row) => `${row.quantity} units`,
    },
    {
      header: 'Initiated By',
      accessor: 'initiatedBy',
      render: (row) => (
        <span className="text-xs text-on-surface font-medium truncate block max-w-[120px]">
          {row.initiatedBy?.fullName || 'Personnel'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'PENDING'} />,
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
              setSelectedTransfer(row);
              setIsDrawerOpen(true);
            }}
            className="p-1.5 text-outline hover:text-on-surface hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Inspect Transfer Timeline"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Details</span>
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
            Asset Transfers
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
            Orchestrate and verify inter-base logistical asset redeployments.
          </p>
        </div>

        {(isAdmin || isLogistics) && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Transfer Order</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        baseId={fromBaseId}
        onBaseChange={setFromBaseId}
        bases={bases}
        status={status}
        onStatusChange={setStatus}
        statusOptions={statusOptions}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={(type, val) => {
          if (type === 'dateFrom') setDateFrom(val);
          if (type === 'dateTo') setDateTo(val);
        }}
        showBaseFilter={true}
        showStatusFilter={true}
        showDateFilter={true}
        onApply={() => fetchTransfers(1)}
        onReset={() => {
          setSearch('');
          setFromBaseId('');
          setToBaseId('');
          setStatus('');
          setDateFrom('');
          setDateTo('');
          fetchTransfers(1);
        }}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={transfers}
        isLoading={loading}
        emptyTitle="No asset transfers recorded"
        emptyDescription="No movement orders match the specified filters or date criteria."
        emptyAction={
          (isAdmin || isLogistics) ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Transfer Order</span>
            </button>
          ) : null
        }
        onRowClick={(row) => {
          setSelectedTransfer(row);
          setIsDrawerOpen(true);
        }}
      />

      {/* Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={(p) => fetchTransfers(p)}
      />

      {/* Create Transfer Modal */}
      <TransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTransfer}
        isSubmitting={isSubmitting}
      />

      {/* Transfer Detail Drawer with Lifecycle Controls */}
      <TransferDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTransfer(null);
        }}
        transfer={selectedTransfer}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={isUpdatingStatus}
      />
    </div>
  );
};
