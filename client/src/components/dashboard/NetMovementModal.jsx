import React from 'react';
import { Modal } from '../common/Modal';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ArrowDownRight, ArrowLeftRight, ShoppingCart, ExternalLink } from 'lucide-react';

export const NetMovementModal = ({ isOpen, onClose, summary, filters }) => {
  const navigate = useNavigate();

  if (!summary) return null;

  const purchases = summary.purchases || 0;
  const transferIn = summary.transferIn || 0;
  const transferOut = summary.transferOut || 0;
  const netMovement = summary.netMovement || (purchases + transferIn - transferOut);

  const formattedPurchases = new Intl.NumberFormat('en-US').format(purchases);
  const formattedTransferIn = new Intl.NumberFormat('en-US').format(transferIn);
  const formattedTransferOut = new Intl.NumberFormat('en-US').format(transferOut);
  const formattedNetMovement = new Intl.NumberFormat('en-US').format(netMovement);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Net Movement Breakdown"
      subtitle="Detailed audit calculation for asset movement during the selected filter interval"
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] font-mono text-outline">
            Formula: Purchases + Transfer In – Transfer Out
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/transfers');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-secondary hover:bg-secondary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <span>View Transfer History</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Visual Formula Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Purchases */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase text-outline">
                Purchases (+)
              </span>
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-headline text-emerald-700">
              +{formattedPurchases}
            </div>
            <div className="text-[11px] text-outline mt-1">New procurement lots</div>
          </div>

          {/* Transfer In */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase text-outline">
                Transfer In (+)
              </span>
              <ArrowDownLeft className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xl font-bold font-headline text-sky-700">
              +{formattedTransferIn}
            </div>
            <div className="text-[11px] text-outline mt-1">Received from depots</div>
          </div>

          {/* Transfer Out */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase text-outline">
                Transfer Out (–)
              </span>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-bold font-headline text-rose-700">
              –{formattedTransferOut}
            </div>
            <div className="text-[11px] text-outline mt-1">Dispatched to bases</div>
          </div>
        </div>

        {/* Calculated Result Banner */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-elevated">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-slate-400">
              Net Velocity Inflow / Outflow
            </div>
            <div className="text-2xl font-extrabold font-headline mt-0.5">
              {netMovement >= 0 ? `+${formattedNetMovement}` : formattedNetMovement}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                netMovement >= 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {netMovement >= 0 ? 'Net Expansion' : 'Net Depletion'}
            </span>
          </div>
        </div>

        {/* Audit Guidance Note */}
        <div className="p-3.5 rounded-lg bg-surface-container border border-border text-xs text-on-surface-variant leading-relaxed">
          <span className="font-semibold text-on-surface">Ledger Accounting Rule:</span> Net movement represents total physical inbound procurement plus intra-base transfers received minus external transfers dispatched. Assignments to unit personnel do NOT reduce net movement or closing inventory.
        </div>
      </div>
    </Modal>
  );
};
