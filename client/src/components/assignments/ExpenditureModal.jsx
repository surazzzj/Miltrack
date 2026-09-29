import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';
import { baseService } from '../../services/baseService';
import { equipmentService } from '../../services/equipmentService';
import { useAuth } from '../../context/AuthContext';
import { Flame, AlertTriangle, ShieldAlert } from 'lucide-react';

const expenditureSchema = z.object({
  baseId: z.string().min(1, 'Base installation is required'),
  equipmentId: z.string().min(1, 'Equipment item must be selected'),
  quantity: z.coerce.number().int().positive('Expenditure quantity must be greater than 0'),
  date: z.string().min(1, 'Expenditure date is required'),
  reason: z.string().min(3, 'Operational expenditure reason or combat report is required'),
  personnelName: z.string().min(2, 'Authorizing unit/personnel name is required'),
  notes: z.string().optional(),
});

export const ExpenditureModal = ({ isOpen, onClose, onSubmit, isSubmitting = false }) => {
  const { user, isCommander } = useAuth();
  const [bases, setBases] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [availableStock, setAvailableStock] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenditureSchema),
    defaultValues: {
      baseId: isCommander ? (user?.baseId?._id || user?.baseId || '') : '',
      equipmentId: '',
      quantity: 1,
      date: new Date().toISOString().split('T')[0],
      reason: '',
      personnelName: '',
      notes: '',
    },
  });

  const selectedBase = watch('baseId');
  const selectedEquipment = watch('equipmentId');
  const requestedQuantity = watch('quantity') || 0;

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
          console.error('Failed to load expenditure options:', err);
        }
      };
      loadOptions();
      reset({
        baseId: isCommander ? (user?.baseId?._id || user?.baseId || '') : '',
        equipmentId: '',
        quantity: 1,
        date: new Date().toISOString().split('T')[0],
        reason: '',
        personnelName: '',
        notes: '',
      });
      setAvailableStock(null);
    }
  }, [isOpen, reset, isCommander, user]);

  useEffect(() => {
    if (selectedBase && selectedEquipment) {
      const fetchStock = async () => {
        setLoadingStock(true);
        try {
          const res = await equipmentService.getEquipment({
            baseId: selectedBase,
            limit: 100,
          });
          const match = res.items?.find((eq) => eq._id === selectedEquipment);
          if (match && match.stock) {
            setAvailableStock(match.stock.available);
          } else {
            setAvailableStock(0);
          }
        } catch (err) {
          setAvailableStock(null);
        } finally {
          setLoadingStock(false);
        }
      };
      fetchStock();
    } else {
      setAvailableStock(null);
    }
  }, [selectedBase, selectedEquipment]);

  const isOverLimit = availableStock !== null && requestedQuantity > availableStock;

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Munition / Asset Expenditure"
      subtitle="Log irreversible consumption or write-off of physical inventory."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Permanent Ledger Deduction:</strong> Expenditures immediately and permanently decrease total closing inventory balances. Please ensure valid tactical firing report or destruction certificate is referenced.
          </div>
        </div>

        {/* Base and Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Base Installation *
            </label>
            <select
              {...register('baseId')}
              disabled={isCommander}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">Select installation...</option>
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

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Expenditure Date *
            </label>
            <input
              type="date"
              {...register('date')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.date && (
              <p className="text-[11px] text-error mt-1">{errors.date.message}</p>
            )}
          </div>
        </div>

        {/* Equipment Selection */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Expended Asset *
          </label>
          <select
            {...register('equipmentId')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          >
            <option value="">Select equipment to expend...</option>
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

        {/* Available Stock Banner */}
        {selectedBase && selectedEquipment && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              loadingStock
                ? 'bg-slate-50 border-slate-200 text-outline'
                : isOverLimit
                ? 'bg-error-container/60 border-error/30 text-error'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>Current Available Stock at Depot:</span>
            <span className="font-mono font-bold text-sm">
              {availableStock !== null ? `${availableStock} units` : '—'}
            </span>
          </div>
        )}

        {/* Quantity and Personnel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Quantity Expended *
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
            {isOverLimit && (
              <p className="text-[11px] text-error mt-1 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Expenditure quantity exceeds available unassigned stock ({availableStock})!
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Authorizing Unit / Personnel *
            </label>
            <input
              type="text"
              placeholder="e.g. Range Officer Capt. Vance, 3rd Artillery"
              {...register('personnelName')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.personnelName && (
              <p className="text-[11px] text-error mt-1">{errors.personnelName.message}</p>
            )}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Reason for Expenditure / Operational Incident *
          </label>
          <input
            type="text"
            placeholder="e.g. Live-fire tactical training exercises, operational combat consumption, decommissioning"
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
            Incident / Discharge Log Notes
          </label>
          <textarea
            rows="2"
            placeholder="Firing report numbers, range officer validation signoff..."
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
            disabled={isSubmitting || isOverLimit}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-error hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <Flame className="w-4 h-4" />
            <span>Commit Permanent Expenditure</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
