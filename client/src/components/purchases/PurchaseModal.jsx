import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';
import { baseService } from '../../services/baseService';
import { equipmentService } from '../../services/equipmentService';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, DollarSign, Calculator } from 'lucide-react';

const purchaseSchema = z.object({
  baseId: z.string().min(1, 'Target installation base is required'),
  equipmentId: z.string().min(1, 'Equipment item must be selected'),
  purchaseDate: z.string().min(1, 'Procurement date is required'),
  quantity: z.coerce.number().int().positive('Quantity must be an integer greater than 0'),
  unitCost: z.coerce.number().min(0, 'Unit cost must be greater than or equal to 0'),
  supplier: z.string().min(2, 'Supplier name is required (min 2 characters)'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const PurchaseModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}) => {
  const { user, isCommander } = useAuth();
  const [bases, setBases] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      baseId: isCommander ? (user?.baseId?._id || user?.baseId || '') : '',
      equipmentId: '',
      quantity: 1,
      unitCost: 0,
      supplier: '',
      referenceNumber: '',
      notes: '',
    },
  });

  const quantity = watch('quantity') || 0;
  const unitCost = watch('unitCost') || 0;
  const calculatedTotal = (Number(quantity) * Number(unitCost)).toFixed(2);

  // Load bases and equipment options
  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        setLoadingOptions(true);
        try {
          const [basesRes, equipRes] = await Promise.all([
            baseService.getBases(),
            equipmentService.getEquipment({ limit: 100 }),
          ]);
          setBases(basesRes.items || []);
          setEquipmentList(equipRes.items || []);
        } catch (err) {
          console.error('Failed to load form options:', err);
        } finally {
          setLoadingOptions(false);
        }
      };
      loadOptions();
    }
  }, [isOpen]);

  // Set form values on edit mode
  useEffect(() => {
    if (initialData) {
      reset({
        baseId: initialData.baseId?._id || initialData.baseId || '',
        equipmentId: initialData.equipmentId?._id || initialData.equipmentId || '',
        purchaseDate: initialData.purchaseDate
          ? new Date(initialData.purchaseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        quantity: initialData.quantity || 1,
        unitCost: initialData.unitCost || 0,
        supplier: initialData.supplier || '',
        referenceNumber: initialData.referenceNumber || '',
        notes: initialData.notes || '',
      });
    } else {
      reset({
        purchaseDate: new Date().toISOString().split('T')[0],
        baseId: isCommander ? (user?.baseId?._id || user?.baseId || '') : '',
        equipmentId: '',
        quantity: 1,
        unitCost: 0,
        supplier: '',
        referenceNumber: '',
        notes: '',
      });
    }
  }, [initialData, reset, isCommander, user]);

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Update Procurement Lot' : 'Record Procurement Lot'}
      subtitle="Record new physical inventory intake directly into the base ledger."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Purchase Date */}
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Procurement Date *
            </label>
            <input
              type="date"
              {...register('purchaseDate')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.purchaseDate && (
              <p className="text-[11px] text-error mt-1">{errors.purchaseDate.message}</p>
            )}
          </div>

          {/* Receiving Base */}
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Receiving Base Installation *
            </label>
            <select
              {...register('baseId')}
              disabled={isCommander}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">Select receiving depot...</option>
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

        {/* Equipment Selection */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Equipment Asset *
          </label>
          <select
            {...register('equipmentId')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          >
            <option value="">Select cataloged equipment...</option>
            {equipmentList.map((eq) => (
              <option key={eq._id} value={eq._id}>
                {eq.name} — [{eq.type}] ({eq.code})
              </option>
            ))}
          </select>
          {errors.equipmentId && (
            <p className="text-[11px] text-error mt-1">{errors.equipmentId.message}</p>
          )}
        </div>

        {/* Quantity and Unit Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Lot Quantity *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              {...register('quantity')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.quantity && (
              <p className="text-[11px] text-error mt-1">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Unit Cost ($ USD) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register('unitCost')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.unitCost && (
              <p className="text-[11px] text-error mt-1">{errors.unitCost.message}</p>
            )}
          </div>
        </div>

        {/* Live Calculation Banner */}
        <div className="p-3.5 rounded-lg bg-surface-container-low border border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <Calculator className="w-4 h-4 text-secondary" />
            <span>Calculated Total Acquisition Cost:</span>
          </div>
          <div className="text-base font-bold font-mono text-primary">
            ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(calculatedTotal)}
          </div>
        </div>

        {/* Supplier & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Defense Contractor / Supplier *
            </label>
            <input
              type="text"
              placeholder="e.g. General Dynamics, BAE Systems"
              {...register('supplier')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.supplier && (
              <p className="text-[11px] text-error mt-1">{errors.supplier.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Contract / Invoice Reference #
            </label>
            <input
              type="text"
              placeholder="e.g. DOD-PO-2025-8812"
              {...register('referenceNumber')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-mono"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Operational Remarks / Batch Serial Notes
          </label>
          <textarea
            rows="2"
            placeholder="Inspection status, batch numbers, delivery notes..."
            {...register('notes')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          />
        </div>

        {/* Footer actions */}
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
            disabled={isSubmitting || loadingOptions}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{initialData ? 'Update Lot' : 'Commit Acquisition Lot'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
