import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { TableSkeleton } from './LoadingSkeleton';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No operational records found',
  emptyDescription = 'There are no records matching your current filter criteria.',
  emptyAction,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  keyExtractor = (item, index) => item._id || index,
}) => {
  if (isLoading) {
    return <TableSkeleton rows={6} cols={columns.length || 5} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-8">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-border rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-border text-xs font-semibold text-outline uppercase tracking-wider">
              {columns.map((col, idx) => {
                const isSortable = !!col.sortKey && !!onSort;
                const isSorted = sortBy === col.sortKey;

                return (
                  <th
                    key={col.key || idx}
                    className={`px-4 py-3.5 ${col.headerClassName || ''} ${
                      isSortable ? 'cursor-pointer select-none hover:text-on-surface' : ''
                    }`}
                    onClick={() => isSortable && onSort(col.sortKey)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {isSortable && (
                        <div className="flex flex-col text-outline">
                          {isSorted && sortOrder === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-primary stroke-[3]" />
                          ) : isSorted && sortOrder === 'desc' ? (
                            <ChevronDown className="w-3.5 h-3.5 text-primary stroke-[3]" />
                          ) : (
                            <div className="opacity-30 hover:opacity-100">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {data.map((item, rowIndex) => {
              const rowKey = keyExtractor(item, rowIndex);
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors duration-150 ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-surface-container-lowest/60 hover:bg-slate-50'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key || colIndex}
                      className={`px-4 py-3.5 text-on-surface-variant font-medium align-middle ${
                        col.cellClassName || ''
                      }`}
                    >
                      {col.render ? col.render(item, rowIndex) : item[col.accessor] ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
