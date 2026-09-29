import React from 'react';
import { PackageOpen, Plus } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'No operational data matches your current query or filter parameters.',
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-on-surface mb-1 font-headline">
        {title}
      </h3>
      <p className="text-sm text-on-surface-variant max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <div>
          {typeof action === 'function' ? (
            <button
              type="button"
              onClick={action}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
};
