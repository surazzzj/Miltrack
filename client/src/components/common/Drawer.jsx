import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Drawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary/30 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen ${width} bg-white shadow-modal flex flex-col border-l border-border transform transition ease-in-out duration-300`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border bg-surface-container-lowest flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold font-headline text-on-surface">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-outline hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto flex-1">{children}</div>

          {/* Optional Footer */}
          {footer && (
            <div className="px-6 py-4 bg-surface-container-low border-t border-border flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
