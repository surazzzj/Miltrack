import React from 'react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { ShoppingCart, Calendar, MapPin, DollarSign, User, FileText, Hash } from 'lucide-react';

export const PurchaseDetailDrawer = ({ isOpen, onClose, purchase }) => {
  if (!purchase) return null;

  const formattedDate = purchase.purchaseDate
    ? new Date(purchase.purchaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={purchase.purchaseNumber || 'Procurement Record'}
      subtitle={`Lot ID: ${purchase._id}`}
      width="max-w-md"
    >
      <div className="space-y-6">
        {/* Status Header Banner */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-border flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono text-outline">Lot Status</div>
            <div className="mt-1">
              <StatusBadge status={purchase.status || 'COMPLETED'} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-outline">Acquisition Value</div>
            <div className="text-lg font-bold font-mono text-primary mt-0.5">
              ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(purchase.totalCost || 0)}
            </div>
          </div>
        </div>

        {/* Equipment Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
            Equipment Specification
          </h4>
          <div className="bg-white border border-border rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-outline">Item Name:</span>
              <span className="font-bold text-on-surface">{purchase.equipmentId?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Classification:</span>
              <span className="font-mono font-semibold text-secondary">
                {purchase.equipmentId?.type || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Catalog Code:</span>
              <span className="font-mono text-on-surface">{purchase.equipmentId?.code || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Unit of Measure:</span>
              <span className="font-mono text-on-surface">{purchase.equipmentId?.unitOfMeasure || 'EA'}</span>
            </div>
          </div>
        </div>

        {/* Quantities & Financials */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
            Financial & Volume Ledger
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-surface-container-lowest border border-border rounded-lg p-3">
              <div className="text-outline text-[11px]">Quantity Acquired</div>
              <div className="text-lg font-bold font-headline text-on-surface mt-0.5">
                {purchase.quantity} units
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-border rounded-lg p-3">
              <div className="text-outline text-[11px]">Unit Price</div>
              <div className="text-lg font-bold font-mono text-on-surface mt-0.5">
                ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(purchase.unitCost || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Depot & Supplier Information */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
            Logistical Routing
          </h4>
          <div className="bg-white border border-border rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-outline">
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                Receiving Base:
              </span>
              <span className="font-bold text-on-surface">
                {purchase.baseId?.name || '—'} ({purchase.baseId?.code || 'DEPOT'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-outline">
                <Calendar className="w-3.5 h-3.5" />
                Date Ingested:
              </span>
              <span className="font-mono text-on-surface">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline">Supplier / Vendor:</span>
              <span className="font-semibold text-on-surface">{purchase.supplier || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-outline">Contract Reference:</span>
              <span className="font-mono text-on-surface">{purchase.referenceNumber || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Personnel & Remarks */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
            Custody & Remarks
          </h4>
          <div className="bg-white border border-border rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-outline">
                <User className="w-3.5 h-3.5" />
                Recorded By:
              </span>
              <span className="font-semibold text-on-surface">
                {purchase.createdBy?.fullName || 'System Operator'}
              </span>
            </div>
            {purchase.notes && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] text-outline mb-1 font-mono">Remarks:</div>
                <div className="text-on-surface-variant italic leading-relaxed">
                  "{purchase.notes}"
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
