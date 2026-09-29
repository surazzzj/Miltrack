import React from 'react';
import { Drawer } from '../common/Drawer';
import { RoleBadge } from '../common/RoleBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, Shield, Globe, Terminal, User, FileText, ArrowRight } from 'lucide-react';

export const AuditDetailDrawer = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  const formattedTimestamp = log.timestamp
    ? new Date(log.timestamp).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : '—';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={log.action?.replace(/_/g, ' ') || 'Audit Record'}
      subtitle={`Log Hash ID: ${log._id}`}
      width="max-w-xl"
    >
      <div className="space-y-6 text-xs">
        {/* Header Summary Card */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-outline font-semibold uppercase tracking-wider text-[10px]">
              Mutating Operation:
            </span>
            <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-primary text-white">
              {log.action}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-outline">Recorded Timestamp:</span>
            <span className="font-mono text-on-surface flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-secondary" />
              {formattedTimestamp}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-outline">Security Status:</span>
            <StatusBadge status={log.status || 'COMPLETED'} />
          </div>
        </div>

        {/* Actor Information */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
            Operator Cryptographic Identity
          </h4>
          <div className="p-4 rounded-xl bg-white border border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-outline">Operator Name:</span>
              <span className="font-bold text-on-surface">{log.userName || 'Unauthenticated'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-outline">Security Role:</span>
              <RoleBadge role={log.role} className="text-[10px]" />
            </div>
            {log.baseId && (
              <div className="flex justify-between items-center">
                <span className="text-outline">Assigned Depot:</span>
                <span className="font-mono text-on-surface">{log.baseId?.name || log.baseId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Network & Device Telemetry */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
            Client Telemetry & Origin
          </h4>
          <div className="p-4 rounded-xl bg-white border border-border space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-outline font-sans">Origin IP Address:</span>
              <span className="text-primary font-bold">{log.ipAddress || '127.0.0.1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline font-sans">Entity Target:</span>
              <span className="text-secondary font-semibold">
                {log.entityType} ({log.entityId || 'N/A'})
              </span>
            </div>
            {log.userAgent && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-outline font-sans block mb-1">User Agent Header:</span>
                <span className="text-[10px] text-slate-500 break-all">{log.userAgent}</span>
              </div>
            )}
          </div>
        </div>

        {/* Before & After State Delta (Crucial requirement from prompt) */}
        {(log.before || log.after) && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
              State Mutation Delta (Before vs After)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Before state */}
              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200">
                <div className="font-mono font-bold text-rose-800 text-[10px] uppercase mb-1.5 flex items-center gap-1">
                  <span>Previous State (Before)</span>
                </div>
                <pre className="text-[10px] font-mono text-rose-950 overflow-x-auto p-2 bg-white rounded border border-rose-100 max-h-48">
                  {log.before ? JSON.stringify(log.before, null, 2) : 'null (Created)'}
                </pre>
              </div>

              {/* After state */}
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <div className="font-mono font-bold text-emerald-800 text-[10px] uppercase mb-1.5 flex items-center gap-1">
                  <span>Committed State (After)</span>
                </div>
                <pre className="text-[10px] font-mono text-emerald-950 overflow-x-auto p-2 bg-white rounded border border-emerald-100 max-h-48">
                  {log.after ? JSON.stringify(log.after, null, 2) : 'null (Deleted)'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};
