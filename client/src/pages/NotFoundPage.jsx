import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-container text-outline flex items-center justify-center mb-6">
        <Compass className="w-8 h-8 animate-spin-slow" />
      </div>

      <span className="font-mono text-xs uppercase tracking-widest text-outline font-bold px-3 py-1 rounded-full bg-surface-container mb-2">
        Error 404: Sector Not Found
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold font-headline text-on-surface mb-2">
        Sector Out of Bounds
      </h1>

      <p className="text-sm text-on-surface-variant max-w-md mb-8 leading-relaxed">
        The requested tactical routing coordinate does not exist or has been relocated within the asset grid.
      </p>

      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};
