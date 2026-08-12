import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Lock, Mail, Eye, EyeOff, LogIn, Sparkles, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TwoFactorModal } from '../../components/auth/TwoFactorModal';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const { login, verify2FA } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Failed login attempt state & countdown timer
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  // 2FA Challenge state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Countdown timer effect
  useEffect(() => {
    if (!lockoutUntil) {
      setTimerSeconds(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setTimerSeconds(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setTimerSeconds(null);
        setAttemptsLeft(null);
        setApiError(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLoginError = (err: any) => {
    const msg = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
    setApiError(msg);

    const lockTime = err.lockoutUntil || err.response?.data?.lockoutUntil;
    const remSecs = err.remainingSeconds || err.response?.data?.remainingSeconds;
    const attLeft = typeof err.attemptsLeft === 'number' ? err.attemptsLeft : err.response?.data?.attemptsLeft;

    if (lockTime) {
      setLockoutUntil(lockTime);
      setTimerSeconds(remSecs || Math.ceil((lockTime - Date.now()) / 1000));
    } else if (remSecs) {
      const calculatedLockout = Date.now() + remSecs * 1000;
      setLockoutUntil(calculatedLockout);
      setTimerSeconds(remSecs);
    }

    if (typeof attLeft === 'number') {
      setAttemptsLeft(attLeft);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    if (timerSeconds !== null && timerSeconds > 0) return;
    try {
      setLoading(true);
      setApiError(null);
      const result: any = await login(data.email, data.password);

      if (result?.requires2FA && result?.userId) {
        setPendingUserId(result.userId);
        setShow2FAModal(true);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      handleLoginError(err);
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (code: string) => {
    if (!pendingUserId) return;
    try {
      setLoading(true);
      await verify2FA(pendingUserId, code);
      setShow2FAModal(false);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isLocked = timerSeconds !== null && timerSeconds > 0;

  return (
    <div className="relative w-full max-w-lg font-['Plus_Jakarta_Sans'] px-2 sm:px-0 my-6">
      {/* Background Glows */}
      <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl pointer-events-none"></div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 transition-all duration-300">
        {/* Header */}
        <div className="text-left mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shrink-0 overflow-hidden">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-['Outfit']">
                College ERP Portal
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Sign in to manage academic workspace
              </p>
            </div>
          </div>
        </div>

        {/* Lockout Timer Banner */}
        {isLocked && timerSeconds !== null && (
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 p-5 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-bold text-center flex flex-col items-center gap-2 shadow-lg backdrop-blur-md animate-pulse">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-black uppercase tracking-wider text-[11px]">
              <Clock className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
              Account Lockout Active (5 Attempts Reached)
            </div>
            <div className="text-3xl font-black font-mono tracking-widest text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-5 py-2 rounded-2xl border border-amber-300 dark:border-amber-700 shadow-inner">
              {formatTimer(timerSeconds)}
            </div>
            <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              Too many failed login attempts. Please wait until the timer reaches zero.
            </p>
          </div>
        )}

        {/* Standard API Error or Remaining Attempts Warning */}
        {apiError && !isLocked && (
          <div className="mb-6 rounded-2xl bg-rose-50 p-4 border border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-900/80 dark:text-rose-300 text-xs font-bold text-center">
            {apiError}
            {attemptsLeft === 1 && (
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                Warning: Final attempt remaining before account lockout!
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Academic Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                {...register('email')}
                type="email"
                disabled={isLocked}
                placeholder="admin@college.edu"
                className={`w-full rounded-2xl border pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 dark:bg-slate-800 dark:text-slate-100 transition-all duration-200 font-medium ${
                  isLocked ? 'opacity-60 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''
                } ${
                  errors.email
                    ? 'border-rose-400 focus:ring-rose-400/20'
                    : 'border-slate-200 bg-slate-50/60 focus:border-indigo-500 focus:ring-indigo-500/10 dark:border-slate-700'
                }`}
              />
            </div>
            {errors.email && <p className="mt-1.5 text-[11px] text-rose-500 font-bold">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-extrabold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                disabled={isLocked}
                placeholder="••••••••"
                className={`w-full rounded-2xl border pl-11 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 dark:bg-slate-800 dark:text-slate-100 transition-all duration-200 font-medium ${
                  isLocked ? 'opacity-60 bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed' : ''
                } ${
                  errors.password
                    ? 'border-rose-400 focus:ring-rose-400/20'
                    : 'border-slate-200 bg-slate-50/60 focus:border-indigo-500 focus:ring-indigo-500/10 dark:border-slate-700'
                }`}
              />
              <button
                type="button"
                disabled={isLocked}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 transition-colors disabled:opacity-40"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-[11px] text-rose-500 font-bold">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || isLocked}
            className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-black text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer font-['Outfit']"
          >
            {isLocked && timerSeconds !== null ? (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Locked ({formatTimer(timerSeconds)})</span>
              </div>
            ) : loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <LogIn className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                <span>Sign In to ERP</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 font-extrabold border-t border-slate-100 dark:border-slate-800 pt-4">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> College ERP Platform
          </span>
        </div>
      </div>

      {/* 2FA Verification Modal */}
      <TwoFactorModal
        isOpen={show2FAModal}
        onVerify={handle2FAVerify}
        onResend={async () => {
          const emailVal = watch('email');
          const passVal = watch('password');
          if (emailVal && passVal) {
            await login(emailVal, passVal);
          }
        }}
        onCancel={() => setShow2FAModal(false)}
        loading={loading}
      />
    </div>
  );
};

export default Login;
