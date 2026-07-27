import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { Lock, Eye, EyeOff, Coffee, BarChart3, Receipt, Shield, AlertTriangle, Clock } from 'lucide-react';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAdmin, rateLimit, sessionTimeRemaining } = useAdmin();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Verify session is still valid on mount
  useEffect(() => {
    if (isAdmin) {
      const token = sessionStorage.getItem('thedailycup_admin_token');
      if (!token) {
        sessionStorage.removeItem('thedailycup_admin');
        window.location.reload();
        return;
      }
      navigate('/admin/dashboard');
    }
  }, [isAdmin, navigate]);

  // Cooldown countdown timer
  useEffect(() => {
    if (rateLimit.cooldownUntil > 0) {
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((rateLimit.cooldownUntil - Date.now()) / 1000));
        setCooldownRemaining(remaining);
      };
      tick();
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    } else {
      setCooldownRemaining(0);
    }
  }, [rateLimit.cooldownUntil]);

  const isCoolingDown = rateLimit.cooldownUntil > 0 && Date.now() < rateLimit.cooldownUntil;
  const isLocked = rateLimit.attempts >= 5 && !isCoolingDown;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCoolingDown) return;

    setLoading(true);
    setError('');

    try {
      const result = await login(password);
      setLoading(false);

      if (result.ok) {
        navigate('/admin/dashboard');
      } else if (result.error) {
        setError(result.error);
      } else {
        setError('Invalid password');
      }
    } catch {
      setLoading(false);
      setError('Connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-xl">The Daily Cup</h2>
              <p className="text-blue-300 text-xs">Admin Panel</p>
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Manage your<br />
            <span className="text-cyan-300">business</span> with<br />
            full transparency
          </h1>
          <p className="text-blue-200 text-sm max-w-sm mb-8">
            Track orders, manage finances, view revenue, and handle taxes — all in one place. Every transaction is on-chain and verifiable.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl p-4">
              <BarChart3 className="w-5 h-5 text-cyan-300" />
              <div>
                <p className="text-white text-sm font-semibold">Revenue Analytics</p>
                <p className="text-blue-300 text-xs">Real-time revenue and profit tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl p-4">
              <Receipt className="w-5 h-5 text-emerald-300" />
              <div>
                <p className="text-white text-sm font-semibold">Finance & Tax</p>
                <p className="text-blue-300 text-xs">Income, expenses, VAT, corporate tax</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl p-4">
              <Shield className="w-5 h-5 text-amber-300" />
              <div>
                <p className="text-white text-sm font-semibold">Order Management</p>
                <p className="text-blue-300 text-xs">Track every order from payment to delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-extrabold text-slate-900 text-lg">The Daily Cup Admin</h2>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-400 mb-8">Sign in to manage your shop</p>

          {/* Rate limit warning banner */}
          {isCoolingDown && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Account temporarily locked</p>
                <p className="text-xs text-amber-600 mt-1">
                  Too many failed attempts. Try again in{' '}
                  <span className="font-mono font-bold">{formatTime(cooldownRemaining)}</span>
                </p>
              </div>
            </div>
          )}

          {/* Session timeout notice */}
          {isAdmin && sessionTimeRemaining > 0 && sessionTimeRemaining < 300 && (
            <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Session expiring soon</p>
                <p className="text-xs text-blue-600 mt-1">
                  Your session will expire in <span className="font-mono font-bold">{formatTime(Math.floor(sessionTimeRemaining))}</span> due to inactivity.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder={isCoolingDown ? 'Locked — wait for cooldown' : 'Enter admin password'}
                  className="pl-11 pr-11 h-12"
                  autoFocus
                  disabled={isCoolingDown}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  disabled={isCoolingDown}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <div className={`mt-2 flex items-start gap-2 text-xs ${isCoolingDown || isLocked ? 'text-amber-600' : 'text-red-500'}`}>
                  {(isCoolingDown || isLocked) && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                  <span>{error}</span>
                </div>
              )}
              {/* Attempt counter (show when some attempts made but not locked) */}
              {!isCoolingDown && rateLimit.attempts > 0 && rateLimit.attempts < 5 && (
                <p className="text-xs text-amber-500 mt-1">
                  {rateLimit.attempts} of 5 failed attempts
                </p>
              )}
            </div>

            <button type="submit" disabled={loading || !password || isCoolingDown} className="btn-primary w-full h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : isCoolingDown ? (
                <span className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Locked ({formatTime(cooldownRemaining)})
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-400 text-center">
              Contact the shop owner for admin access
            </p>
          </div>

          <button onClick={() => navigate('/shop')} className="w-full text-center text-sm text-slate-400 hover:text-slate-600 mt-6 transition-colors">
            ← Back to Shop
          </button>
        </div>
      </div>
    </div>
  );
}

