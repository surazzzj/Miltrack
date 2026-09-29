import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ForbiddenPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-error-container text-error flex items-center justify-center mb-6 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="font-mono text-xs uppercase tracking-widest text-error font-bold px-3 py-1 rounded-full bg-error-container/60 mb-2">
        Error 403: Clearance Required
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold font-headline text-on-surface mb-2">
        Access Restricted
      </h1>

      <p className="text-sm text-on-surface-variant max-w-md mb-8 leading-relaxed">
        Your current operational tier (<span className="font-mono font-bold text-on-surface">{user?.role}</span>) does not possess authorization to access this sector or base ledger.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Operations Center</span>
        </button>
      </div>
    </div>
  );
};
