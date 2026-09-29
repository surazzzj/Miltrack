import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../common/Modal';
import { baseService } from '../../services/baseService';
import { equipmentService } from '../../services/equipmentService';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

const assignmentSchema = z.object({
  baseId: z.string().min(1, 'Base installation is required'),
  equipmentId: z.string().min(1, 'Equipment asset must be selected'),
  personnelName: z.string().min(2, 'Personnel name is required'),
  personnelId: z.string().optional(),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  assignmentDate: z.string().min(1, 'Assignment date is required'),
  purpose: z.string().min(3, 'Operational purpose or mission assignment is required'),
  assetCode: z.string().optional(),
  notes: z.string().optional(),
});

export const AssignmentModal = ({ isOpen, onClose, onSubmit, isSubmitting = false }) => {
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
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      baseId: isCommander ? (user?.baseId?._id || user?.baseId || '') : '',
      equipmentId: '',
      personnelName: '',
      personnelId: '',
      quantity: 1,
      assignmentDate: new Date().toISOString().split('T')[0],
      purpose: '',
      assetCode: '',
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
          console.error('Failed to load assignment options:', err);
        }
      };
      loadOptions();
      reset({
        baseId: isCommander ? (user?.baseId?._id || user?.baseId || '') : '',
        equipmentId: '',
        personnelName: '',
        personnelId: '',
        quantity: 1,
        assignmentDate: new Date().toISOString().split('T')[0],
        purpose: '',
        assetCode: '',
        notes: '',
      });
      setAvailableStock(null);
    }
  }, [isOpen, reset, isCommander, user]);

  // Live stock check
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

  const remainingAvailable =
    availableStock !== null ? Math.max(0, availableStock - requestedQuantity) : null;
  const isOverLimit = availableStock !== null && requestedQuantity > availableStock;

  const onFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deploy Asset Assignment"
      subtitle="Issue equipment to active unit personnel or squad leaders."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
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
              Assignment Date *
            </label>
            <input
              type="date"
              {...register('assignmentDate')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.assignmentDate && (
              <p className="text-[11px] text-error mt-1">{errors.assignmentDate.message}</p>
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
            <option value="">Select equipment to assign...</option>
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

        {/* Real-time Available Quantity Telemetry */}
        {selectedBase && selectedEquipment && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              loadingStock
                ? 'bg-slate-50 border-slate-200 text-outline'
                : isOverLimit
                ? 'bg-error-container/60 border-error/30 text-error'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Available Depot Stock:{' '}
                <strong className="font-mono text-sm">{availableStock}</strong> units
              </span>
            </div>
            {!isOverLimit && availableStock !== null && (
              <div className="font-mono text-[11px]">
                Remaining After Issue: <strong>{remainingAvailable}</strong> units
              </div>
            )}
          </div>
        )}

        {/* Personnel Name and Identifier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Assigned Personnel / Squad *
            </label>
            <input
              type="text"
              placeholder="e.g. Sgt. J. Miller, Bravo Patrol Squad"
              {...register('personnelName')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            {errors.personnelName && (
              <p className="text-[11px] text-error mt-1">{errors.personnelName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Personnel ID / Service Badge #
            </label>
            <input
              type="text"
              placeholder="e.g. MIL-4492-B"
              {...register('personnelId')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-mono"
            />
          </div>
        </div>

        {/* Quantity & Serial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Quantity to Issue *
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
                Requested quantity ({requestedQuantity}) exceeds available stock ({availableStock})!
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
              Assigned Serial / Tag Number
            </label>
            <input
              type="text"
              placeholder="e.g. RFL-7718-A"
              {...register('assetCode')}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-mono"
            />
          </div>
        </div>

        {/* Operational Purpose */}
        <div>
          <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1">
            Mission Purpose / Duty Assignment *
          </label>
          <input
            type="text"
            placeholder="e.g. Standard perimeter defense duty, convoy escort mission"
            {...register('purpose')}
            className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
          />
          {errors.purpose && (
            <p className="text-[11px] text-error mt-1">{errors.purpose.message}</p>
          )}
        </div>

        {/* Accounting Rule Clarification */}
        <div className="p-3 rounded-lg bg-surface-container border border-border text-[11px] text-on-surface-variant flex items-start gap-2">
          <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
          <span>
            <strong>Inventory Rule:</strong> Assignments decrement <em>available quantity</em> for operational draw, but do <strong>not</strong> reduce total physical inventory.
          </span>
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
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>Issue Personnel Assignment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
