import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { purchaseService } from '../services/purchaseService';
import { baseService } from '../services/baseService';
import { DataTable } from '../components/common/DataTable';
import { Pagination } from '../components/common/Pagination';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PurchaseModal } from '../components/purchases/PurchaseModal';
import { PurchaseDetailDrawer } from '../components/purchases/PurchaseDetailDrawer';
import { Plus, Eye, Edit, Trash2, ShoppingCart } from 'lucide-react';

export const PurchasesPage = () => {
  const { user, isAdmin, isLogistics, isCommander } = useAuth();
  const { success, error: toastError } = useToast();

  const [purchases, setPurchases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [bases, setBases] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [baseId, setBaseId] = useState(isCommander ? (user?.baseId?._id || user?.baseId || '') : '');
  const [equipmentType, setEquipmentType] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals & Drawers state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load bases for filter
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

  // Fetch purchases
  const fetchPurchases = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 10,
        };
        if (search) params.search = search;
        if (baseId) params.baseId = baseId;
        if (status) params.status = status;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const res = await purchaseService.getPurchases(params);
        setPurchases(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        toastError(err.message || 'Failed to fetch procurement ledger.');
      } finally {
        setLoading(false);
      }
    },
    [search, baseId, status, dateFrom, dateTo, toastError]
  );

  useEffect(() => {
    fetchPurchases(1);
  }, [fetchPurchases]);

  // Create or Update Purchase
  const handleSubmitPurchase = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingPurchase) {
        await purchaseService.updatePurchase(editingPurchase._id, formData);
        success('Procurement lot details updated successfully.', 'Purchase Updated');
      } else {
        await purchaseService.createPurchase(formData);
        success('New procurement lot recorded and credited to inventory ledger.', 'Purchase Recorded');
      }
      setIsModalOpen(false);
      setEditingPurchase(null);
      fetchPurchases(pagination.page);
    } catch (err) {
      toastError(err.message || 'Unable to record procurement lot.', 'Operation Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Purchase
  const handleConfirmDelete = async () => {
    if (!deletingPurchaseId) return;
    setIsSubmitting(true);
    try {
      await purchaseService.deletePurchase(deletingPurchaseId);
      success('Procurement record deleted and inventory adjusted.', 'Record Removed');
      setDeletingPurchaseId(null);
      fetchPurchases(pagination.page);
    } catch (err) {
      toastError(err.message || 'Failed to remove procurement record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const columns = [
    {
      header: 'Purchase ID',
      accessor: 'purchaseNumber',
      cellClassName: 'font-mono text-xs font-semibold text-primary',
      render: (row) => (
        <div>
          <div className="font-bold">{row.purchaseNumber}</div>
          <div className="text-[10px] text-outline truncate max-w-[140px]">
            {row.referenceNumber || 'No ref #'}
          </div>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'purchaseDate',
      render: (row) => (
        <span className="font-mono text-xs">
          {row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      header: 'Receiving Base',
      accessor: 'baseId',
      render: (row) => (
        <span className="font-medium text-on-surface">
          {row.baseId?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Equipment Asset',
      accessor: 'equipmentId',
      render: (row) => (
        <div>
          <div className="font-bold text-on-surface">{row.equipmentId?.name || '—'}</div>
          <div className="text-[10px] text-secondary font-mono">
            {row.equipmentId?.type} ({row.equipmentId?.code})
          </div>
        </div>
      ),
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono font-bold text-on-surface',
      render: (row) => `${row.quantity} ${row.equipmentId?.unitOfMeasure || 'EA'}`,
    },
    {
      header: 'Unit Cost',
      accessor: 'unitCost',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono text-on-surface-variant',
      render: (row) => `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(row.unitCost || 0)}`,
    },
    {
      header: 'Total Cost',
      accessor: 'totalCost',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono font-bold text-primary',
      render: (row) => `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(row.totalCost || 0)}`,
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      render: (row) => <span className="text-xs truncate max-w-[120px] block">{row.supplier}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'COMPLETED'} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setSelectedPurchase(row);
              setIsDrawerOpen(true);
            }}
            className="p-1.5 text-outline hover:text-on-surface hover:bg-slate-100 rounded-lg transition-colors"
            title="Inspect Lot Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {(isAdmin || isLogistics) && (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditingPurchase(row);
                  setIsModalOpen(true);
                }}
                className="p-1.5 text-outline hover:text-secondary hover:bg-sky-50 rounded-lg transition-colors"
                title="Edit Procurement Record"
              >
                <Edit className="w-4 h-4" />
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setDeletingPurchaseId(row._id)}
                  className="p-1.5 text-outline hover:text-error hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            Procurement & Purchases
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
            Ingest and record new asset procurement lots into installation depots.
          </p>
        </div>

        {(isAdmin || isLogistics) && (
          <button
            type="button"
            onClick={() => {
              setEditingPurchase(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record Procurement Lot</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        baseId={baseId}
        onBaseChange={setBaseId}
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
        showBaseFilter={!isCommander}
        showStatusFilter={true}
        showDateFilter={true}
        onApply={() => fetchPurchases(1)}
        onReset={() => {
          setSearch('');
          setBaseId(isCommander ? (user?.baseId?._id || user?.baseId || '') : '');
          setStatus('');
          setDateFrom('');
          setDateTo('');
          fetchPurchases(1);
        }}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={purchases}
        isLoading={loading}
        emptyTitle="No procurement records found"
        emptyDescription="No purchases match your selected filters or search parameters."
        emptyAction={
          (isAdmin || isLogistics) ? (
            <button
              type="button"
              onClick={() => {
                setEditingPurchase(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Lot</span>
            </button>
          ) : null
        }
        onRowClick={(row) => {
          setSelectedPurchase(row);
          setIsDrawerOpen(true);
        }}
      />

      {/* Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={(p) => fetchPurchases(p)}
      />

      {/* Create / Edit Purchase Modal */}
      <PurchaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPurchase(null);
        }}
        onSubmit={handleSubmitPurchase}
        initialData={editingPurchase}
        isSubmitting={isSubmitting}
      />

      {/* Purchase Detail Drawer */}
      <PurchaseDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedPurchase(null);
        }}
        purchase={selectedPurchase}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingPurchaseId}
        onClose={() => setDeletingPurchaseId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Procurement Lot"
        message="Are you certain you wish to purge this purchase transaction? The inventory ledger will be reversed accordingly."
        confirmText="Purge Lot"
        isDanger={true}
        isLoading={isSubmitting}
      />
    </div>
  );
};
