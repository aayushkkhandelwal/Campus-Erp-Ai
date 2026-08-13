import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, Database, Smartphone, CheckCircle2 } from 'lucide-react';
import { ThemeSliderSwitch } from '../../components/ui/ThemeSliderSwitch';

export const Settings = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [twoFAEnabled, setTwoFAEnabled] = useState(user?.twoFactorEnabled || false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleToggle2FA = async () => {
    try {
      setLoading(true);
      const nextState = !twoFAEnabled;
      await authService.toggle2FA(nextState);
      setTwoFAEnabled(nextState);
      setStatusMsg(nextState ? '2FA Protection successfully enabled!' : '2FA Protection disabled.');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update 2FA status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <SettingsIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          System Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize display preferences, security parameters, and notification alerts
        </p>
      </div>

      {statusMsg && (
        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Security & 2FA Settings */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
            Security & Authentication (2FA)
          </h2>
          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Two-Factor Authentication (SMS 2FA)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {twoFAEnabled ? 'SMS OTP verification is active on login' : 'Enhance security by enabling 6-digit SMS OTP verification'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle2FA}
              disabled={loading}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold cursor-pointer transition-all ${
                twoFAEnabled
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
              }`}
            >
              {loading ? 'Updating...' : twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
            Appearance & Theme
          </h2>
          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Theme Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Currently set to {theme} mode</p>
              </div>
            </div>
            <ThemeSliderSwitch showLabels size="lg" />
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors duration-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
            Notification Controls
          </h2>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Enrollment Alerts</p>
                  <p className="text-slate-400">Receive notifications when students enroll</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-blue-600" />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Security & Session Warning</p>
                  <p className="text-slate-400">Alert on new IP address logins</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-blue-600" />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Production DB Mode</p>
                  <p className="text-slate-400">Secure HttpOnly Cookie sessions active</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
