import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { baseService } from '../services/baseService';
import { BaseModal } from '../components/bases/BaseModal';
import { BaseDetailDrawer } from '../components/bases/BaseDetailDrawer';
import { StatusBadge } from '../components/common/StatusBadge';
import { MapPin, Plus, Shield, Layers, UserCheck, Flame, ChevronRight, Edit } from 'lucide-react';

export const BasesPage = () => {
  const { user, isAdmin, isCommander } = useAuth();
  const { success, error: toastError } = useToast();

  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBaseId, setSelectedBaseId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBase, setEditingBase] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await baseService.getBases();
      setBases(res.items || []);
    } catch (err) {
      toastError(err.message || 'Failed to load installation depots.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchBases();
  }, [fetchBases]);

  const handleSubmitBase = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingBase) {
        await baseService.updateBase(editingBase._id, formData);
        success('Installation facility specifications updated.', 'Base Updated');
      } else {
        await baseService.createBase(formData);
        success('New installation facility commissioned into active defense grid.', 'Base Commissioned');
      }
      setIsModalOpen(false);
      setEditingBase(null);
      fetchBases();
    } catch (err) {
      toastError(err.message || 'Unable to save base installation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            Military Base Installations
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
            Tactical asset readiness, capacity telemetry, and installation depot ledgers.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingBase(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Commission Installation</span>
          </button>
        )}
      </div>

      {/* Bases Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-white border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bases.map((base) => {
            const metrics = base.metrics || {};
            const utilization = metrics.capacityUtilization || 0;

            return (
              <div
                key={base._id}
                onClick={() => {
                  setSelectedBaseId(base._id);
                  setIsDrawerOpen(true);
                }}
                className="bg-white border border-border rounded-xl p-6 shadow-card hover:shadow-elevated transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-headline text-on-surface group-hover:text-secondary transition-colors">
                          {base.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-outline font-mono">
                          <span>{base.code}</span>
                          <span>•</span>
                          <span>{base.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={base.isActive} />
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBase(base);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-outline hover:text-secondary rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Base Specs"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {base.description && (
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                      {base.description}
                    </p>
                  )}

                  {/* Capacity Bar */}
                  <div className="my-4">
                    <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                      <span className="text-outline">Storage Capacity:</span>
                      <span className="font-mono text-on-surface">
                        {metrics.totalAssets || 0} / {base.capacity || 10000} ({utilization}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          utilization > 85
                            ? 'bg-rose-500'
                            : utilization > 65
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, utilization))}%` }}
                      />
                    </div>
                  </div>

                  {/* Metric Chips */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                    <div className="p-2 rounded-lg bg-surface-container-low">
                      <div className="text-[10px] uppercase font-mono text-outline">Physical</div>
                      <div className="text-sm font-bold font-mono text-on-surface mt-0.5">
                        {metrics.totalAssets ?? 0}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50/60">
                      <div className="text-[10px] uppercase font-mono text-emerald-700">Available</div>
                      <div className="text-sm font-bold font-mono text-emerald-800 mt-0.5">
                        {metrics.available ?? 0}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-sky-50/60">
                      <div className="text-[10px] uppercase font-mono text-sky-700">Assigned</div>
                      <div className="text-sm font-bold font-mono text-sky-800 mt-0.5">
                        {metrics.assigned ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer action link */}
                <div className="mt-4 pt-3 flex items-center justify-between text-xs font-semibold text-secondary group-hover:translate-x-0.5 transition-transform duration-150">
                  <span>Inspect complete depot telemetry</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Commission Base Modal */}
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBase(null);
        }}
        onSubmit={handleSubmitBase}
        initialData={editingBase}
        isSubmitting={isSubmitting}
      />

      {/* Base Detail Drawer */}
      <BaseDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedBaseId(null);
        }}
        baseId={selectedBaseId}
      />
    </div>
  );
};
