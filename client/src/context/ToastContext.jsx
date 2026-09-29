import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newToast = {
      id,
      type: toast.type || 'info',
      title: toast.title,
      message: toast.message || (typeof toast === 'string' ? toast : ''),
      duration: toast.duration || 4500,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [removeToast]);

  const success = useCallback((message, title = 'Success') => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((message, title = 'Operation Failed') => {
    showToast({ type: 'error', title, message });
  }, [showToast]);

  const warning = useCallback((message, title = 'Warning') => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = useCallback((message, title = 'Notice') => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-elevated border transition-all duration-300 transform translate-y-0 ${
                isSuccess
                  ? 'bg-white border-success/30 text-on-surface'
                  : isError
                  ? 'bg-white border-error/30 text-on-surface'
                  : isWarning
                  ? 'bg-white border-warning/30 text-on-surface'
                  : 'bg-white border-border text-on-surface'
              }`}
            >
              <div className="shrink-0 pt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-success" />}
                {isError && <AlertCircle className="w-5 h-5 text-error" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-warning" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-secondary" />}
              </div>

              <div className="flex-1 min-w-0">
                {t.title && (
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-0.5">
                    {t.title}
                  </h4>
                )}
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed break-words">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-outline hover:text-on-surface transition-colors p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
