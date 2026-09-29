import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';

const baseSchema = z.object({
  name: z.string().min(2, 'Base name is required'),
  code: z.string().min(2, 'Depot code is required').toUpperCase(),
  location: z.string().min(2, 'Physical location or coordinates are required'),
  capacity: z.coerce.number().int().min(100, 'Capacity must be at least 100'),
  description: z.string().optional(),
});

export const BaseModal = ({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: '',
      code: '',
      location: '',
      capacity: 10000,
      description: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        code: initialData.code || '',
        location: initialData.location || '',
        capacity: initialData.capacity || 10000,
        description: initialData.description || '',
      });
    } else {
      reset({
        name: '',
        code: '',
        location: '',
        capacity: 10000,
        description: '',
      });
    }
  }, [initialData, reset]);

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Update Base Installation' : 'Establish New Base Installation'}
      subtitle="Register a defense installation facility into the command network."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Installation Nomenclature / Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Base Echo Forward Outpost"
            {...register('name')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          />
          {errors.name && <p className="text-[11px] text-error mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Depot Code *
            </label>
            <input
              type="text"
              placeholder="e.g. ECHO-FWD"
              {...register('code')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-mono"
            />
            {errors.code && <p className="text-[11px] text-error mt-1">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Asset Storage Capacity *
            </label>
            <input
              type="number"
              step="100"
              {...register('capacity')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-mono"
            />
            {errors.capacity && (
              <p className="text-[11px] text-error mt-1">{errors.capacity.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Geographical Location / Sector *
          </label>
          <input
            type="text"
            placeholder="e.g. Sector 7, Northern Perimeter Grid 41"
            {...register('location')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          />
          {errors.location && (
            <p className="text-[11px] text-error mt-1">{errors.location.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Operational Overview / Defense Function
          </label>
          <textarea
            rows="3"
            placeholder="Primary logistical purpose, perimeter defenses, airstrip capabilities..."
            {...register('description')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          />
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
            <span>{initialData ? 'Update Installation' : 'Commission Installation'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
