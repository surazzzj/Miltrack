import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';
import { baseService } from '../../services/baseService';

const userSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid operational email is required'),
    password: z.string().optional(),
    role: z.enum(['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']),
    baseId: z.string().optional(),
    rank: z.string().optional(),
    serviceId: z.string().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.role === 'BASE_COMMANDER' && !data.baseId) {
        return false;
      }
      return true;
    },
    {
      message: 'Base installation is strictly required for Base Commander tier.',
      path: ['baseId'],
    }
  );

export const UserModal = ({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) => {
  const [bases, setBases] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'LOGISTICS_OFFICER',
      baseId: '',
      rank: '',
      serviceId: '',
      isActive: true,
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isOpen) {
      const loadBases = async () => {
        try {
          const res = await baseService.getBases();
          setBases(res.items || []);
        } catch (err) {
          console.error('Failed to load bases for user modal:', err);
        }
      };
      loadBases();

      if (initialData) {
        reset({
          fullName: initialData.fullName || '',
          email: initialData.email || '',
          password: '',
          role: initialData.role || 'LOGISTICS_OFFICER',
          baseId: initialData.baseId?._id || initialData.baseId || '',
          rank: initialData.rank || '',
          serviceId: initialData.serviceId || '',
          isActive: initialData.isActive !== false,
        });
      } else {
        reset({
          fullName: '',
          email: '',
          password: 'Password123!',
          role: 'LOGISTICS_OFFICER',
          baseId: '',
          rank: '',
          serviceId: '',
          isActive: true,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const onFormSubmit = (data) => {
    // If updating and password left empty, omit password
    if (initialData && !data.password) {
      delete data.password;
    }
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Update Personnel Credentials' : 'Provision New Operational Personnel'}
      subtitle="Configure RBAC security roles and installation depot scoping."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Major Sarah Connor"
              {...register('fullName')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.fullName && (
              <p className="text-[11px] text-error mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Official Email *
            </label>
            <input
              type="email"
              placeholder="operator@miltrack.local"
              {...register('email')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.email && (
              <p className="text-[11px] text-error mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Access Key / Password {initialData ? '(Leave blank to retain current)' : '*'}
          </label>
          <input
            type="password"
            placeholder={initialData ? '••••••••' : 'Enter temporary passkey...'}
            {...register('password')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-mono"
          />
        </div>

        {/* Role & Base Jurisdiction */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Security Role (RBAC) *
            </label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            >
              <option value="ADMIN">HQ Administrator (Global Central Command)</option>
              <option value="BASE_COMMANDER">Base Commander (Restricted to Base)</option>
              <option value="LOGISTICS_OFFICER">Logistics Officer (Procurement & Movement)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Assigned Base Installation {selectedRole === 'BASE_COMMANDER' && '*'}
            </label>
            <select
              {...register('baseId')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            >
              <option value="">
                {selectedRole === 'ADMIN' ? 'None (Global Central Command)' : 'Select assigned base...'}
              </option>
              {bases.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            {errors.baseId && (
              <p className="text-[11px] text-error mt-1">{errors.baseId.message}</p>
            )}
          </div>
        </div>

        {/* Rank & Service ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Military Rank / Title
            </label>
            <input
              type="text"
              placeholder="e.g. Captain, Chief Warrant Officer"
              {...register('rank')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Service ID / Badge Number
            </label>
            <input
              type="text"
              placeholder="e.g. MIL-7740-HQ"
              {...register('serviceId')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-mono"
            />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register('isActive')}
              className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-secondary"
            />
            <span className="text-xs font-semibold text-on-surface">
              Account Active & Authorized for Operations
            </span>
          </label>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface border border-border bg-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{initialData ? 'Update Operator' : 'Provision Operator'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
