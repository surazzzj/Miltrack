import React, { useState, useEffect } from 'react';
import { Drawer } from '../common/Drawer';
import { baseService } from '../../services/baseService';
import { MapPin, Shield, Layers, Package, UserCheck, Flame, ArrowLeftRight, ShoppingCart } from 'lucide-react';

export const BaseDetailDrawer = ({ isOpen, onClose, baseId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    if (isOpen && baseId) {
      const loadDetail = async () => {
        setLoading(true);
        try {
          const res = await baseService.getBaseById(baseId);
          setData(res);
        } catch (err) {
          console.error('Failed to load base installation details:', err);
        } finally {
          setLoading(false);
        }
      };
      loadDetail();
    }
  }, [isOpen, baseId]);

  if (!isOpen) return null;

  const base = data?.base;
  const metrics = data?.metrics || {};
  const recentPurchases = data?.recentPurchases || [];
  const recentTransfers = data?.recentTransfers || [];
  const recentAssignments = data?.recentAssignments || [];
  const recentExpenditures = data?.recentExpenditures || [];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={base?.name || 'Base Installation'}
      subtitle={`Code: ${base?.code || 'DEPOT'} • ${base?.location || 'Operational Sector'}`}
      width="max-w-2xl"
    >
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-xs text-outline font-mono">Retrieving depot telemetry & ledger...</p>
        </div>
      ) : base ? (
        <div className="space-y-6">
          {/* Inventory Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-border">
              <div className="text-[10px] uppercase font-mono text-outline">Total Assets</div>
              <div className="text-xl font-bold font-headline text-on-surface mt-0.5">
                {metrics.totalAssets ?? 0}
              </div>
              <div className="text-[10px] text-outline font-mono">closing inventory</div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-[10px] uppercase font-mono text-emerald-700">Available</div>
              <div className="text-xl font-bold font-headline text-emerald-800 mt-0.5">
                {metrics.available ?? 0}
              </div>
              <div className="text-[10px] text-emerald-700 font-mono">unassigned</div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-200">
              <div className="text-[10px] uppercase font-mono text-sky-700">Assigned</div>
              <div className="text-xl font-bold font-headline text-sky-800 mt-0.5">
                {metrics.assigned ?? 0}
              </div>
              <div className="text-[10px] text-sky-700 font-mono">with personnel</div>
            </div>
          </div>

          {/* Capacity Utilization Progress Bar */}
          <div className="p-4 rounded-xl bg-white border border-border">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-on-surface">Facility Depot Storage Capacity:</span>
              <span className="font-mono text-primary font-bold">
                {metrics.capacityUtilization || 0}% ({metrics.totalAssets || 0} / {base.capacity || 10000})
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (metrics.capacityUtilization || 0) > 85
                    ? 'bg-rose-500'
                    : (metrics.capacityUtilization || 0) > 65
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(5, metrics.capacityUtilization || 0))}%`,
                }}
              />
            </div>
          </div>

          {/* Subtabs for Base Modules */}
          <div className="flex border-b border-border text-xs font-semibold gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`pb-2 transition-all ${
                activeTab === 'inventory'
                  ? 'border-b-2 border-primary text-primary font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Purchases ({recentPurchases.length})
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
              Transfers ({recentTransfers.length})
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
              Unit Assignments ({recentAssignments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenditures')}
              className={`pb-2 transition-all ${
                activeTab === 'expenditures'
                  ? 'border-b-2 border-primary text-primary font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Expenditures ({recentExpenditures.length})
            </button>
          </div>

          {/* Purchases at this base */}
          {activeTab === 'inventory' && (
            <div className="space-y-2 text-xs">
              {recentPurchases.length > 0 ? (
                recentPurchases.map((p) => (
                  <div
                    key={p._id}
                    className="p-3 rounded-lg border border-border bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-primary">{p.purchaseNumber}</div>
                      <div className="text-[10px] text-outline">
                        {p.equipmentId?.name} • {new Date(p.purchaseDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-on-surface">+{p.quantity} units</div>
                      <div className="text-[10px] font-mono text-outline">
                        ${new Intl.NumberFormat('en-US').format(p.totalCost || 0)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-outline font-mono">No procurement records</div>
              )}
            </div>
          )}

          {/* Transfers at this base */}
          {activeTab === 'transfers' && (
            <div className="space-y-2 text-xs">
              {recentTransfers.length > 0 ? (
                recentTransfers.map((t) => (
                  <div
                    key={t._id}
                    className="p-3 rounded-lg border border-border bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-primary">{t.transferNumber}</div>
                      <div className="text-[10px] text-outline">
                        {t.equipmentId?.name} • {t.status}
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
                <div className="py-6 text-center text-outline font-mono">No transfer records</div>
              )}
            </div>
          )}

          {/* Assignments at this base */}
          {activeTab === 'assignments' && (
            <div className="space-y-2 text-xs">
              {recentAssignments.length > 0 ? (
                recentAssignments.map((a) => (
                  <div
                    key={a._id}
                    className="p-3 rounded-lg border border-border bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-on-surface">{a.personnelName}</div>
                      <div className="text-[10px] text-outline">
                        {a.equipmentId?.name} • {a.purpose}
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

          {/* Expenditures at this base */}
          {activeTab === 'expenditures' && (
            <div className="space-y-2 text-xs">
              {recentExpenditures.length > 0 ? (
                recentExpenditures.map((e) => (
                  <div
                    key={e._id}
                    className="p-3 rounded-lg border border-border bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-error">{e.expenditureNumber}</div>
                      <div className="text-[10px] text-outline">
                        {e.equipmentId?.name} • {e.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-error">-{e.quantity} units</div>
                      <div className="text-[10px] font-mono text-outline">
                        {new Date(e.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-outline font-mono">No expenditures recorded</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-outline">Base record not found</div>
      )}
    </Drawer>
  );
};
