import React, { useState } from 'react';
import { Search, Filter, RotateCcw, Calendar } from 'lucide-react';

export const FilterBar = ({
  search = '',
  onSearchChange,
  dateFrom = '',
  dateTo = '',
  onDateChange,
  baseId = '',
  onBaseChange,
  bases = [],
  equipmentType = '',
  onEquipmentTypeChange,
  status = '',
  onStatusChange,
  statusOptions = [],
  onApply,
  onReset,
  showBaseFilter = true,
  showTypeFilter = false,
  showStatusFilter = false,
  showDateFilter = true,
  searchPlaceholder = 'Search serials, codes, descriptions...',
}) => {
  const equipmentTypes = [
    { value: '', label: 'All Equipment Types' },
    { value: 'VEHICLE', label: 'Vehicles' },
    { value: 'WEAPON', label: 'Weapons' },
    { value: 'AMMUNITION', label: 'Ammunition' },
    { value: 'COMMUNICATION', label: 'Communications' },
    { value: 'PROTECTIVE', label: 'Protective Gear' },
    { value: 'OTHER', label: 'Other Logistics' },
  ];

  return (
    <div className="bg-white border border-border rounded-xl p-4 shadow-card mb-6 transition-all">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
          />
        </div>

        {/* Base Filter */}
        {showBaseFilter && (
          <div className="lg:col-span-2">
            <select
              value={baseId}
              onChange={(e) => onBaseChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
            >
              <option value="">All Bases / Depots</option>
              {bases.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Equipment Type Filter */}
        {showTypeFilter && (
          <div className="lg:col-span-2">
            <select
              value={equipmentType}
              onChange={(e) => onEquipmentTypeChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
            >
              {equipmentTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        {showStatusFilter && (
          <div className="lg:col-span-2">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Filter Range */}
        {showDateFilter && (
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateChange('dateFrom', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
              title="From date"
            />
            <span className="text-outline text-xs">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateChange('dateTo', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
              title="To date"
            />
          </div>
        )}

        {/* Actions: Apply / Reset */}
        <div className="lg:col-span-1 flex items-center gap-1.5 justify-end">
          {onApply && (
            <button
              type="button"
              onClick={onApply}
              className="p-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow-xs"
              title="Apply filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="p-2 bg-white border border-border hover:bg-surface-container text-outline hover:text-on-surface rounded-lg transition-colors"
              title="Reset filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
