import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] p-6 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-border shadow-card m-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-error flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold font-headline text-on-surface mb-1">
            Component Render Error
          </h3>
          <p className="text-xs text-on-surface-variant font-medium max-w-md mb-4 leading-relaxed">
            An unexpected error occurred while rendering this interface sector.
          </p>
          <div className="p-3 rounded-lg bg-surface-container-low border border-border font-mono text-[11px] text-error max-w-lg mb-6 overflow-x-auto text-left">
            {this.state.error?.message || 'Unknown runtime error'}
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
