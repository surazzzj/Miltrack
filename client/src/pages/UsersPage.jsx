import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { DataTable } from '../components/common/DataTable';
import { Pagination } from '../components/common/Pagination';
import { RoleBadge } from '../components/common/RoleBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { UserModal } from '../components/users/UserModal';
import { Users, Plus, Edit, Shield, Search } from 'lucide-react';

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: 10 };
        if (search) params.search = search;

        const res = await userService.getUsers(params);
        setUsers(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        toastError(err.message || 'Failed to retrieve operator accounts.');
      } finally {
        setLoading(false);
      }
    },
    [search, toastError]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSubmitUser = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await userService.updateUser(editingUser._id, formData);
        success('Personnel credentials & security roles updated.', 'Account Updated');
      } else {
        await userService.createUser(formData);
        success('New operational personnel provisioned successfully.', 'Account Provisioned');
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers(pagination.page);
    } catch (err) {
      toastError(err.message || 'Unable to update user credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Operator Personnel',
      accessor: 'fullName',
      render: (row) => (
        <div>
          <div className="font-bold text-on-surface text-xs">{row.fullName}</div>
          <div className="text-[10px] text-outline font-mono">
            {row.rank ? `${row.rank} • ` : ''}ID: {row.serviceId || 'UNASSIGNED'}
          </div>
        </div>
      ),
    },
    {
      header: 'Email Address',
      accessor: 'email',
      cellClassName: 'text-xs font-mono text-outline',
      render: (row) => row.email,
    },
    {
      header: 'Assigned Role',
      accessor: 'role',
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      header: 'Installation Jurisdiction',
      accessor: 'baseId',
      render: (row) => (
        <span className="text-xs font-medium text-on-surface">
          {row.baseId?.name ? `${row.baseId.name} (${row.baseId.code})` : 'Global Central Command'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (row) => <StatusBadge status={row.isActive} />,
    },
    {
      header: 'Last Active',
      accessor: 'lastLoginAt',
      render: (row) => (
        <span className="text-xs text-outline font-mono">
          {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : 'Never logged in'}
        </span>
      ),
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
              setEditingUser(row);
              setIsModalOpen(true);
            }}
            className="p-1.5 text-outline hover:text-secondary hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Edit Personnel Role & Jurisdiction"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Modify</span>
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
            Personnel & Role Access Management
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
            Authorize military operators, calibrate RBAC privileges, and govern base installation scopes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Personnel</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white border border-border rounded-xl p-4 shadow-card">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers(1)}
            placeholder="Search operator name, email, rank or service badge..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        emptyTitle="No personnel records found"
        emptyDescription="No operators match your query."
        onRowClick={(row) => {
          setEditingUser(row);
          setIsModalOpen(true);
        }}
      />

      {/* Pagination */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        onPageChange={(p) => fetchUsers(p)}
      />

      {/* Provision / Update Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSubmitUser}
        initialData={editingUser}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
