import React, { useState, useEffect } from 'react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { equipmentService } from '../../services/equipmentService';
import { Layers, ShieldCheck, UserCheck, Flame, ShoppingCart, ArrowLeftRight, Clock } from 'lucide-react';

export const EquipmentDetailDrawer = ({ isOpen, onClose, equipmentId, baseId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && equipmentId) {
      const loadDetail = async () => {
        setLoading(true);
        try {
          const res = await equipmentService.getEquipmentById(equipmentId);
          setData(res);
        } catch (err) {
          console.error('Failed to load equipment details:', err);
        } finally {
          setLoading(false);
        }
      };
      loadDetail();
    }
  }, [isOpen, equipmentId]);

  if (!isOpen) return null;

  const eq = data?.equipment;
  const stock = data?.stock || {};
  const history = data?.history || {};

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={eq?.name || 'Equipment Specification'}
      subtitle={`Code: ${eq?.code || '—'} • ${eq?.type || 'ASSET'}`}
      width="max-w-2xl"
    >
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-xs text-outline font-mono">Retrieving item telemetry & ledger...</p>
        </div>
      ) : eq ? (
        <div className="space-y-6">
          {/* Inventory Breakdown Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-border">
              <div className="text-[10px] uppercase font-mono text-outline">Total Balance</div>
              <div className="text-xl font-bold font-headline text-on-surface mt-0.5">
                {stock.total ?? 0}
              </div>
              <div className="text-[10px] text-outline font-mono">{eq.unitOfMeasure || 'units'}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-[10px] uppercase font-mono text-emerald-700">Available</div>
              <div className="text-xl font-bold font-headline text-emerald-800 mt-0.5">
                {stock.available ?? 0}
              </div>
              <div className="text-[10px] text-emerald-700 font-mono">unassigned in armory</div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200">
              <div className="text-[10px] uppercase font-mono text-sky-700">Assigned</div>
              <div className="text-xl font-bold font-headline text-sky-800 mt-0.5">
                {stock.assigned ?? 0}
              </div>
              <div className="text-[10px] text-sky-700 font-mono">held by personnel</div>
            </div>
          </div>

          {/* Subtabs */}
          <div className="flex border-b border-border text-xs font-semibold gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-2 transition-all ${
                activeTab === 'overview'
                  ? 'border-b-2 border-primary text-primary font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Overview & Specs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('purchases')}
              className={`pb-2 transition-all ${
                activeTab === 'purchases'
                  ? 'border-b-2 border-primary text-primary font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Procurement History ({history.purchases?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transfers')}
              className={`pb-2 transition-all ${
                activeTab === 'transfers'
                  ? 'border-b-2 border-primary text-primary font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Transfers ({history.transfers?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={`pb-2 transition-all ${
                activeTab === 'assignments'
                  ? 'border-b-2 border-primary text-primary font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Assignments ({history.assignments?.length || 0})
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white border border-border rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-outline">Classification:</span>
                  <span className="font-mono font-bold text-secondary">{eq.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">NATO Stock / Serial Code:</span>
                  <span className="font-mono text-on-surface font-semibold">{eq.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Serialization Required:</span>
                  <span className="font-semibold text-on-surface">{eq.isSerialized ? 'YES' : 'NO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Status:</span>
                  <StatusBadge status={eq.isActive} />
                </div>
              </div>

              {eq.description && (
                <div className="bg-white border border-border rounded-xl p-4">
                  <h5 className="font-bold uppercase tracking-wider text-outline mb-1 text-[11px]">
                    Technical Description
                  </h5>
                  <p className="text-on-surface-variant leading-relaxed">{eq.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Procurement History */}
          {activeTab === 'purchases' && (
            <div className="space-y-2 text-xs">
              {history.purchases?.length > 0 ? (
                history.purchases.map((p) => (
                  <div
                    key={p._id}
                    className="p-3 rounded-lg border border-border bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-primary">{p.purchaseNumber}</div>
                      <div className="text-[10px] text-outline">
                        {new Date(p.purchaseDate).toLocaleDateString()} • {p.supplier}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-on-surface">+{p.quantity} units</div>
                      <div className="text-[10px] font-mono text-outline">
                        ${new Intl.NumberFormat('en-US').format(p.totalCost)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-outline font-mono">No procurement records</div>
              )}
            </div>
          )}

          {/* Tab 3: Transfers */}
          {activeTab === 'transfers' && (
            <div className="space-y-2 text-xs">
              {history.transfers?.length > 0 ? (
                history.transfers.map((t) => (
                  <div
                    key={t._id}
                    className="p-3 rounded-lg border border-border bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-primary">{t.transferNumber}</div>
                      <div className="text-[10px] text-outline">
                        {t.fromBaseId?.code} → {t.toBaseId?.code} ({t.status})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-on-surface">{t.quantity} units</div>
                      <div className="text-[10px] font-mono text-outline">
                        {new Date(t.transferDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-outline font-mono">No movements recorded</div>
              )}
            </div>
          )}

          {/* Tab 4: Assignments */}
          {activeTab === 'assignments' && (
            <div className="space-y-2 text-xs">
              {history.assignments?.length > 0 ? (
                history.assignments.map((a) => (
                  <div
                    key={a._id}
                    className="p-3 rounded-lg border border-border bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-on-surface">{a.personnelName}</div>
                      <div className="text-[10px] text-outline font-mono">
                        {a.assignmentNumber} • {a.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-on-surface">{a.quantity} units</div>
                      <div className="text-[10px] font-mono text-outline">
                        {new Date(a.assignmentDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-outline font-mono">No active assignments</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-outline">Record not found</div>
      )}
    </Drawer>
  );
};
