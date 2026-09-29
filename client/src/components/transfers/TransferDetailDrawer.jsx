import React, { useState } from 'react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import {
  ArrowRight,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TransferDetailDrawer = ({
  isOpen,
  onClose,
  transfer,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const { isAdmin, isLogistics, isCommander, user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('');

  if (!transfer) return null;

  const currentStatus = transfer.status || 'PENDING';

  // Check if current user can transition status
  const canUpdate =
    isAdmin ||
    isLogistics ||
    (isCommander &&
      (transfer.fromBaseId?._id === user?.baseId?._id ||
        transfer.toBaseId?._id === user?.baseId?._id));

  const handleStatusChange = (newStatus) => {
    onUpdateStatus(transfer._id, newStatus);
  };

  const formattedTransferDate = transfer.transferDate
    ? new Date(transfer.transferDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  const formattedCompletedDate = transfer.completedAt
    ? new Date(transfer.completedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={transfer.transferNumber || 'Transfer Order'}
      subtitle={`Manifest ID: ${transfer._id}`}
      width="max-w-xl"
    >
      <div className="space-y-6">
        {/* Status & Inventory Applied Badge */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-border flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono text-outline">Current Phase</div>
            <div className="mt-1">
              <StatusBadge status={currentStatus} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-outline">Ledger Application</div>
            <div className="mt-1">
              {transfer.inventoryApplied ? (
                <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  APPLIED TO BALANCES
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  PENDING FINAL DELIVERY
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Operational Timeline Progress */}
        <div className="p-4 rounded-xl bg-white border border-border">
          <div className="text-xs font-bold uppercase tracking-wider text-outline mb-4">
            Custody Dispatch Timeline
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Step 1: Created */}
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-200 flex items-center justify-center text-white" />
              <div className="text-xs font-bold text-on-surface">Order Initialized</div>
              <div className="text-[11px] text-outline font-mono mt-0.5">
                {formattedTransferDate} — Initiated by {transfer.initiatedBy?.fullName || 'Operator'}
              </div>
            </div>

            {/* Step 2: In-Transit */}
            <div className="relative">
              <span
                className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white ring-2 flex items-center justify-center text-white ${
                  currentStatus === 'IN_TRANSIT' || currentStatus === 'COMPLETED'
                    ? 'bg-sky-500 ring-sky-200'
                    : currentStatus === 'CANCELLED'
                    ? 'bg-slate-300 ring-slate-100'
                    : 'bg-slate-300 ring-slate-100'
                }`}
              />
              <div className="text-xs font-bold text-on-surface">Dispatched In-Transit</div>
              <div className="text-[11px] text-outline font-mono mt-0.5">
                {currentStatus === 'IN_TRANSIT' || currentStatus === 'COMPLETED'
                  ? 'Convoy convoy departed origin depot'
                  : 'Awaiting transport convoy authorization'}
              </div>
            </div>

            {/* Step 3: Completed or Cancelled */}
            <div className="relative">
              <span
                className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white ring-2 flex items-center justify-center text-white ${
                  currentStatus === 'COMPLETED'
                    ? 'bg-emerald-600 ring-emerald-200'
                    : currentStatus === 'CANCELLED'
                    ? 'bg-rose-500 ring-rose-200'
                    : 'bg-slate-300 ring-slate-100'
                }`}
              />
              <div className="text-xs font-bold text-on-surface">
                {currentStatus === 'CANCELLED' ? 'Transfer Aborted / Cancelled' : 'Ingested & Completed'}
              </div>
              <div className="text-[11px] text-outline font-mono mt-0.5">
                {formattedCompletedDate
                  ? `Completed on ${formattedCompletedDate}`
                  : currentStatus === 'CANCELLED'
                  ? 'Order voided with zero inventory alterations'
                  : 'Pending intake inspection at destination'}
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Route Manifest */}
        <div className="p-4 rounded-xl bg-white border border-border space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-outline">
            Route & Logistics Detail
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-container-low border border-border">
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono text-outline">Origin Installation</div>
              <div className="text-sm font-bold text-on-surface truncate">
                {transfer.fromBaseId?.name || '—'}
              </div>
              <div className="text-[10px] font-mono text-secondary">
                {transfer.fromBaseId?.code}
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-outline shrink-0" />

            <div className="min-w-0 text-right">
              <div className="text-[10px] uppercase font-mono text-outline">Destination Depot</div>
              <div className="text-sm font-bold text-on-surface truncate">
                {transfer.toBaseId?.name || '—'}
              </div>
              <div className="text-[10px] font-mono text-secondary">
                {transfer.toBaseId?.code}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div>
              <span className="text-outline">Equipment Transferred:</span>
              <div className="font-bold text-on-surface mt-0.5">
                {transfer.equipmentId?.name || '—'}
              </div>
              <div className="text-[10px] font-mono text-outline">
                {transfer.equipmentId?.code} ({transfer.equipmentId?.type})
              </div>
            </div>

            <div>
              <span className="text-outline">Transferred Volume:</span>
              <div className="font-bold font-mono text-lg text-primary mt-0.5">
                {transfer.quantity} units
              </div>
            </div>
          </div>

          {transfer.reason && (
            <div className="pt-2 border-t border-slate-100 text-xs">
              <span className="text-outline">Mission Justification:</span>
              <div className="text-on-surface font-medium mt-0.5">{transfer.reason}</div>
            </div>
          )}

          {transfer.notes && (
            <div className="pt-2 border-t border-slate-100 text-xs">
              <span className="text-outline">Convoy Remarks:</span>
              <div className="text-on-surface-variant italic mt-0.5">"{transfer.notes}"</div>
            </div>
          )}
        </div>

        {/* Status Transition Action Panel */}
        {canUpdate && currentStatus !== 'COMPLETED' && currentStatus !== 'CANCELLED' && (
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-card">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span>Authorize Status Transition</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Transitioning to <span className="font-bold text-emerald-400">COMPLETED</span> will debit the origin base inventory ledger and credit the destination base ledger atomically.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {currentStatus === 'PENDING' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange('IN_TRANSIT')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Truck className="w-4 h-4" />
                  <span>Dispatch In-Transit</span>
                </button>
              )}

              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange('COMPLETED')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Delivery (Complete Order)</span>
              </button>

              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange('CANCELLED')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
              >
                <XCircle className="w-4 h-4" />
                <span>Abort / Cancel</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
