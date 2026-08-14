import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldAlert, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, changePassword, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg('New password must be different from your current temporary password.');
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      setSuccessMsg('Password updated successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md font-['Plus_Jakarta_Sans'] px-2 sm:px-0 my-6">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl dark:border-amber-900/50 dark:bg-slate-900/95">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400">
              <ShieldAlert className="h-6 w-6 shrink-0" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white font-['Outfit']">
                Password Change Required
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                First-time login security verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            title="Log Out"
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Security Alert Badge */}
        <div className="mb-6 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 text-xs font-semibold leading-relaxed">
          Hello <strong className="text-amber-950 dark:text-amber-200">{user?.fullName || 'User'}</strong>, you are currently using a temporary auto-generated password. You must set a new secure password before accessing your account features.
        </div>

        {/* Status Messages */}
        {successMsg && (
          <div className="mb-6 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 rounded-2xl bg-rose-50 p-4 border border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Current Temporary Password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter password sent to your email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              New Password (min 6 chars)
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-indigo-600 py-3.5 text-xs font-black text-white shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 transition-all cursor-pointer font-['Outfit']"
          >
            {loading ? 'Saving New Password...' : 'Set New Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
