import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';
import { baseService } from '../../services/baseService';
import { equipmentService } from '../../services/equipmentService';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

const transferSchema = z
  .object({
    fromBaseId: z.string().min(1, 'Source base is required'),
    toBaseId: z.string().min(1, 'Destination base is required'),
    equipmentId: z.string().min(1, 'Equipment must be selected'),
    quantity: z.coerce.number().int().positive('Transfer quantity must be greater than 0'),
    reason: z.string().min(3, 'Transfer justification / tactical reason is required'),
    transferDate: z.string().min(1, 'Transfer dispatch date is required'),
    expectedArrival: z.string().optional(),
    assetCode: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.fromBaseId !== data.toBaseId, {
    message: 'Destination base must differ from origin base installation.',
    path: ['toBaseId'],
  });

export const TransferModal = ({ isOpen, onClose, onSubmit, isSubmitting = false }) => {
  const { user, isCommander } = useAuth();
  const [bases, setBases] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [sourceStock, setSourceStock] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromBaseId: isCommander ? (user?.baseId?._id || user?.baseId || '') : '',
      toBaseId: '',
      equipmentId: '',
      quantity: 1,
      reason: '',
      transferDate: new Date().toISOString().split('T')[0],
      expectedArrival: '',
      assetCode: '',
      notes: '',
    },
  });

  const selectedFromBase = watch('fromBaseId');
  const selectedEquipment = watch('equipmentId');
  const transferQuantity = watch('quantity') || 0;

  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        try {
          const [basesRes, equipRes] = await Promise.all([
            baseService.getBases(),
            equipmentService.getEquipment({ limit: 100 }),
          ]);
          setBases(basesRes.items || []);
          setEquipmentList(equipRes.items || []);
        } catch (err) {
          console.error('Failed to load transfer options:', err);
        }
      };
      loadOptions();
      reset({
        fromBaseId: isCommander ? (user?.baseId?._id || user?.baseId || '') : '',
        toBaseId: '',
        equipmentId: '',
        quantity: 1,
        reason: '',
        transferDate: new Date().toISOString().split('T')[0],
        expectedArrival: '',
        assetCode: '',
        notes: '',
      });
      setSourceStock(null);
    }
  }, [isOpen, reset, isCommander, user]);

  // Check source base available stock when base or equipment changes
  useEffect(() => {
    if (selectedFromBase && selectedEquipment) {
      const checkAvailability = async () => {
        setCheckingStock(true);
        try {
          const res = await equipmentService.getEquipment({
            baseId: selectedFromBase,
            limit: 100,
          });
          const match = res.items?.find((eq) => eq._id === selectedEquipment);
          if (match && match.stock) {
            setSourceStock(match.stock.available);
          } else {
            setSourceStock(0);
          }
        } catch (err) {
          setSourceStock(null);
        } finally {
          setCheckingStock(false);
        }
      };
      checkAvailability();
    } else {
      setSourceStock(null);
    }
  }, [selectedFromBase, selectedEquipment]);

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  const isQuantityExcessive = sourceStock !== null && transferQuantity > sourceStock;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate Inter-Base Asset Transfer"
      subtitle="Dispatch logistical materiel between installation depots."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Origin & Destination Base Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Origin Base (Dispatch) *
            </label>
            <select
              {...register('fromBaseId')}
              disabled={isCommander}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">Select origin depot...</option>
              {bases.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            {errors.fromBaseId && (
              <p className="text-[11px] text-error mt-1">{errors.fromBaseId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Destination Base (Receiving) *
            </label>
            <select
              {...register('toBaseId')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            >
              <option value="">Select receiving depot...</option>
              {bases
                .filter((b) => b._id !== selectedFromBase)
                .map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </option>
                ))}
            </select>
            {errors.toBaseId && (
              <p className="text-[11px] text-error mt-1">{errors.toBaseId.message}</p>
            )}
          </div>
        </div>

        {/* Equipment Selection */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Equipment Asset to Transfer *
          </label>
          <select
            {...register('equipmentId')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          >
            <option value="">Select equipment item...</option>
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

        {/* Availability Telemetry Banner */}
        {selectedFromBase && selectedEquipment && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              checkingStock
                ? 'bg-slate-50 border-slate-200 text-outline'
                : isQuantityExcessive
                ? 'bg-error-container/60 border-error/30 text-error'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {checkingStock
                  ? 'Verifying origin stock ledger...'
                  : `Available Unassigned Stock at Origin Depot:`}
              </span>
            </div>
            <div className="font-mono font-bold text-sm">
              {sourceStock !== null ? `${sourceStock} units` : '—'}
            </div>
          </div>
        )}

        {/* Transfer Quantity & Asset Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Quantity to Dispatch *
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
            {isQuantityExcessive && (
              <p className="text-[11px] text-error mt-1 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Requested quantity ({transferQuantity}) exceeds available origin stock ({sourceStock})!
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Serial / Asset Tracking Code (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. SN-88219-M4"
              {...register('assetCode')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-mono"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Dispatch Date *
            </label>
            <input
              type="date"
              {...register('transferDate')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.transferDate && (
              <p className="text-[11px] text-error mt-1">{errors.transferDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Estimated Ingestion Date
            </label>
            <input
              type="date"
              {...register('expectedArrival')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
          </div>
        </div>

        {/* Justification Reason */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Operational Justification / Mission Reason *
          </label>
          <input
            type="text"
            placeholder="e.g. Rapid deployment support for perimeter fortification exercise"
            {...register('reason')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          />
          {errors.reason && (
            <p className="text-[11px] text-error mt-1">{errors.reason.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Convoy / Transport Notes
          </label>
          <textarea
            rows="2"
            placeholder="Secure vehicle transport unit, escort convoy details..."
            {...register('notes')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          />
        </div>

        {/* Footer */}
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
            disabled={isSubmitting || isQuantityExcessive}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>Authorize Dispatch Order</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
