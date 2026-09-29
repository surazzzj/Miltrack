import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Radio, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email credentials and access key.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await login({ email, password });
      success(`Authenticated as ${res.user.fullName} (${res.user.role})`, 'Access Granted');
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid operational credentials.');
      toastError(err.message || 'Invalid credentials provided.', 'Authentication Denied');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail, demoPassword = 'Password123!') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-elevated">
            <Radio className="w-7 h-7 text-secondary" />
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-bold font-headline text-on-surface tracking-tight">
          MILTRACK
        </h2>
        <p className="mt-1 text-center text-xs text-on-surface-variant font-mono uppercase tracking-widest">
          Defense Asset Operations Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-modal rounded-2xl border border-border">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-lg bg-error-container/60 border border-error/20 text-xs text-error font-medium flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1.5">
                Personnel Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@miltrack.local"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-1.5">
                Access Key / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 text-xs bg-surface-container-lowest border border-border rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-sm text-xs font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switchers */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-bold text-outline uppercase tracking-wider mb-3 text-center">
              Quick Demo Access Credentials
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDemoAccount('admin@miltrack.local')}
                className="w-full text-left p-2.5 rounded-lg border border-border hover:border-primary/40 bg-surface-container-lowest hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-on-surface group-hover:text-primary">
                    HQ Administrator
                  </div>
                  <div className="text-[10px] text-outline font-mono">admin@miltrack.local</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  Global Scope
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('commander@miltrack.local')}
                className="w-full text-left p-2.5 rounded-lg border border-border hover:border-secondary/40 bg-surface-container-lowest hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-on-surface group-hover:text-secondary">
                    Base Commander (Base Alpha)
                  </div>
                  <div className="text-[10px] text-outline font-mono">commander@miltrack.local</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary/10 text-secondary font-bold">
                  Base Alpha
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('logistics@miltrack.local')}
                className="w-full text-left p-2.5 rounded-lg border border-border hover:border-tertiary/40 bg-surface-container-lowest hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-on-surface group-hover:text-tertiary">
                    Logistics Officer
                  </div>
                  <div className="text-[10px] text-outline font-mono">logistics@miltrack.local</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-bold">
                  Procurement
                </span>
              </button>
            </div>
            <div className="text-[10px] text-outline text-center mt-3 font-mono">
              Master Development Passkey: <span className="font-bold text-on-surface">Password123!</span>
            </div>
          </div>
        </div>

        {/* Security watermark */}
        <div className="mt-6 text-center text-xs text-outline flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
          <span>FIPS-compliant Ledger & Audit Verification Protocol</span>
        </div>
      </div>
    </div>
  );
};
