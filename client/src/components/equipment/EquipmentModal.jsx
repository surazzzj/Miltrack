import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';

const equipmentSchema = z.object({
  name: z.string().min(2, 'Equipment name is required'),
  code: z.string().min(2, 'Catalog code is required').toUpperCase(),
  type: z.enum(['VEHICLE', 'WEAPON', 'AMMUNITION', 'COMMUNICATION', 'PROTECTIVE', 'OTHER']),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required (e.g. EA, CRATE, SET)'),
  isSerialized: z.boolean().default(true),
  description: z.string().optional(),
});

export const EquipmentModal = ({ isOpen, onClose, onSubmit, isSubmitting = false }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: '',
      code: '',
      type: 'WEAPON',
      unitOfMeasure: 'EA',
      isSerialized: true,
      description: '',
    },
  });

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catalog New Defense Equipment"
      subtitle="Register a new equipment classification in the master logistics manifest."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Equipment Nomenclature / Name *
          </label>
          <input
            type="text"
            placeholder="e.g. M240B Machine Gun, Tactical Patrol Truck"
            {...register('name')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          />
          {errors.name && <p className="text-[11px] text-error mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Catalog Code / NATO Stock # *
            </label>
            <input
              type="text"
              placeholder="e.g. MG-240-B"
              {...register('code')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-mono"
            />
            {errors.code && <p className="text-[11px] text-error mt-1">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Classification Type *
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            >
              <option value="VEHICLE">VEHICLE (Ground/Air)</option>
              <option value="WEAPON">WEAPON (Small Arms/Heavy)</option>
              <option value="AMMUNITION">AMMUNITION (Ordnance)</option>
              <option value="COMMUNICATION">COMMUNICATION (Radios/Sat)</option>
              <option value="PROTECTIVE">PROTECTIVE (Body Armor/Helmets)</option>
              <option value="OTHER">OTHER (Tactical Gear)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Unit of Measure *
            </label>
            <input
              type="text"
              placeholder="e.g. EA, CRATE, SET"
              {...register('unitOfMeasure')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-mono"
            />
            {errors.unitOfMeasure && (
              <p className="text-[11px] text-error mt-1">{errors.unitOfMeasure.message}</p>
            )}
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isSerialized')}
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-secondary"
              />
              <span className="text-xs font-semibold text-on-surface">
                Requires Serial Number Tracking
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Technical Description / Specs
          </label>
          <textarea
            rows="3"
            placeholder="Operational specifications, calibers, maintenance tolerances..."
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
            <span>Register Equipment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
