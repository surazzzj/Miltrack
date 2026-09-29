import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { equipmentService } from '../services/equipmentService';
import { baseService } from '../services/baseService';
import { DataTable } from '../components/common/DataTable';
import { Pagination } from '../components/common/Pagination';
import { FilterBar } from '../components/common/FilterBar';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatCard } from '../components/common/StatCard';
import { EquipmentModal } from '../components/equipment/EquipmentModal';
import { EquipmentDetailDrawer } from '../components/equipment/EquipmentDetailDrawer';
import { Plus, Eye, Crosshair, Package, ShieldCheck, UserCheck, Flame } from 'lucide-react';

export const EquipmentPage = () => {
  const { user, isAdmin, isLogistics, isCommander } = useAuth();
  const { success, error: toastError } = useToast();

  const [equipment, setEquipment] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [bases, setBases] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [baseId, setBaseId] = useState(isCommander ? (user?.baseId?._id || user?.baseId || '') : '');
  const [equipmentType, setEquipmentType] = useState('');

  // Modals & Drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
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

  // Fetch equipment list with real stock metrics
  const fetchEquipment = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;
        if (baseId) params.baseId = baseId;
        if (equipmentType) params.type = equipmentType;

        const res = await equipmentService.getEquipment(params);
        setEquipment(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        toastError(err.message || 'Failed to fetch equipment catalog.');
      } finally {
        setLoading(false);
      }
    },
    [search, baseId, equipmentType, toastError]
  );

  useEffect(() => {
    fetchEquipment(1);
  }, [fetchEquipment]);

  // Create Equipment
  const handleCreateEquipment = async (formData) => {
    setIsSubmitting(true);
    try {
      await equipmentService.createEquipment(formData);
      success('Equipment classification cataloged successfully.', 'Asset Cataloged');
      setIsModalOpen(false);
      fetchEquipment(1);
    } catch (err) {
      toastError(err.message || 'Unable to catalog equipment item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rollup totals for top StatCards
  const totalAssets = equipment.reduce((sum, item) => sum + (item.stock?.total || 0), 0);
  const totalAvailable = equipment.reduce((sum, item) => sum + (item.stock?.available || 0), 0);
  const totalAssigned = equipment.reduce((sum, item) => sum + (item.stock?.assigned || 0), 0);

  const columns = [
    {
      header: 'Catalog Code',
      accessor: 'code',
      cellClassName: 'font-mono text-xs font-semibold text-primary',
      render: (row) => (
        <div>
          <div className="font-bold">{row.code}</div>
          <div className="text-[10px] text-outline font-mono">
            {row.isSerialized ? 'Serialized Tracking' : 'Batch Count'}
          </div>
        </div>
      ),
    },
    {
      header: 'Equipment Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-on-surface">{row.name}</div>
          <div className="text-[10px] text-outline truncate max-w-xs">{row.description || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Classification',
      accessor: 'type',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-secondary px-2 py-0.5 rounded bg-secondary-container/20">
          {row.type}
        </span>
      ),
    },
    {
      header: 'Total Physical',
      key: 'total',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono font-bold text-on-surface',
      render: (row) => `${row.stock?.total ?? 0} ${row.unitOfMeasure || 'EA'}`,
    },
    {
      header: 'Available',
      key: 'available',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono font-bold text-emerald-700',
      render: (row) => `${row.stock?.available ?? 0}`,
    },
    {
      header: 'Assigned',
      key: 'assigned',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-mono font-semibold text-sky-700',
      render: (row) => `${row.stock?.assigned ?? 0}`,
    },
    {
      header: 'Readiness',
      accessor: 'isActive',
      render: (row) => <StatusBadge status={row.isActive} />,
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
              setSelectedEquipmentId(row._id);
              setIsDrawerOpen(true);
            }}
            className="p-1.5 text-outline hover:text-on-surface hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Inspect Equipment Details"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Inspect</span>
          </button>
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
            Equipment Inventory Registry
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
            Master tactical asset registry and current live physical stock levels.
          </p>
        </div>

        {(isAdmin || isLogistics) && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Catalog New Equipment</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Cataloged Equipment Types"
          value={pagination.total}
          secondaryText="Active military specifications"
          icon={Crosshair}
        />
        <StatCard
          title="Total Physical In Stock"
          value={totalAssets}
          secondaryText="Current closing inventory count"
          icon={Package}
          badgeText="Physical"
          badgeType="accent"
        />
        <StatCard
          title="Ready For Issuance"
          value={totalAvailable}
          secondaryText="Armory available unassigned"
          icon={ShieldCheck}
          badgeText="Available"
          badgeType="positive"
        />
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
        showBaseFilter={!isCommander}
        showTypeFilter={true}
        showDateFilter={false}
        searchPlaceholder="Search equipment by name, catalog code or specs..."
        onApply={() => fetchEquipment(1)}
        onReset={() => {
          setSearch('');
          setBaseId(isCommander ? (user?.baseId?._id || user?.baseId || '') : '');
          setEquipmentType('');
          fetchEquipment(1);
        }}
      />

      {/* Equipment Table */}
      <DataTable
        columns={columns}
        data={equipment}
        isLoading={loading}
        emptyTitle="No cataloged equipment found"
        emptyDescription="No equipment items match the specified classification or query."
        emptyAction={
          (isAdmin || isLogistics) ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Catalog First Equipment</span>
            </button>
          ) : null
        }
        onRowClick={(row) => {
          setSelectedEquipmentId(row._id);
          setIsDrawerOpen(true);
        }}
      />

      {/* Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={(p) => fetchEquipment(p)}
      />

      {/* Catalog Equipment Modal */}
      <EquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEquipment}
        isSubmitting={isSubmitting}
      />

      {/* Equipment Detail Drawer */}
      <EquipmentDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedEquipmentId(null);
        }}
        equipmentId={selectedEquipmentId}
        baseId={baseId}
      />
    </div>
  );
};
