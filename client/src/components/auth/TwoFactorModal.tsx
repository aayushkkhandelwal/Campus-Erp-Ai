import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onVerify: (code: string) => Promise<void>;
  onResend?: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const TwoFactorModal = ({ isOpen, onVerify, onResend, onCancel, loading }: TwoFactorModalProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Resend OTP cooldown timer
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setResendCooldown(30);
    setError(null);
    setInfoMsg(null);
    setCode('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, resendCooldown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }
    setError(null);
    setInfoMsg(null);
    try {
      await onVerify(code);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!onResend || resendCooldown > 0 || resendLoading) return;
    try {
      setResendLoading(true);
      setError(null);
      await onResend();
      setInfoMsg('Fresh verification code sent to your registered email!');
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-3">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white font-['Outfit']">
            Two-Factor Authentication
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter the 6-digit verification code sent to your registered academic email address.
          </p>
        </div>

        {infoMsg && (
          <div className="mb-4 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{infoMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Verification Code (6 Digits)
              </label>
              {onResend && (
                <button
                  type="button"
                  disabled={resendCooldown > 0 || resendLoading}
                  onClick={handleResend}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-500 disabled:text-slate-400 disabled:no-underline dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${resendLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendLoading
                      ? 'Resending...'
                      : resendCooldown > 0
                      ? `Resend in 00:${resendCooldown.toString().padStart(2, '0')}`
                      : 'Resend Code'}
                  </span>
                </button>
              )}
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-lg font-mono rounded-2xl border border-slate-200 bg-slate-50/60 py-3 pr-4 pl-10 text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="w-1/2 rounded-2xl border border-slate-200 py-3 text-xs font-extrabold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-1/2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-xs font-black text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-all cursor-pointer font-['Outfit']"
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
