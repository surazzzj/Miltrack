import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  className = '',
}) => {
  if (total === 0) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  // Generate page numbers to show (e.g. [1, 2, 3, '...', 10])
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-xs text-on-surface-variant font-medium ${className}`}
    >
      <div>
        Showing <span className="font-semibold text-on-surface">{startRecord}</span> to{' '}
        <span className="font-semibold text-on-surface">{endRecord}</span> of{' '}
        <span className="font-semibold text-on-surface">{total}</span> operational records
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center justify-center p-2 rounded-lg border border-border bg-white text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 text-outline">
                  ...
                </span>
              );
            }
            const isCurrent = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white border border-border text-on-surface hover:bg-surface-container'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center justify-center p-2 rounded-lg border border-border bg-white text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
