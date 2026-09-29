import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ForbiddenPage } from '../pages/ForbiddenPage';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin mb-4" />
        <h3 className="text-sm font-bold font-headline text-on-surface uppercase tracking-wider">
          MILTRACK Security Handshake
        </h3>
        <p className="text-xs text-on-surface-variant font-mono mt-1">
          Validating cryptographic session credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <ForbiddenPage />;
  }

  return children;
};
