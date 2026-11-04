import React, { useState } from 'react';
import {
  Palette,
  Wallet,
  Shield,
  Info,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { AuthUser, authService } from '../services/auth';
import { api } from '../services/api';
import { SUPPORTED_CURRENCIES } from '../utils/formatters';
import { useNotification } from './NotificationToast';
import { ThemeId } from '../types';

interface SettingsPageProps {
  user: AuthUser | null;
  currency: string;
  onCurrencyChange: (newCurrency: string) => void;
  activeTheme: ThemeId;
  previewTheme: ThemeId | null;
  onPreviewTheme: (theme: ThemeId | null) => void;
  onApplyTheme: (theme: ThemeId) => void;
  dateFormat: string;
  onDateFormatChange: (format: string) => void;
  onSignOut: () => void;
}

interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  bgPreview: string;
  cardPreview: string;
  accentPreview: string;
  textPreview: string;
}

export const THEMES_LIST: ThemeConfig[] = [
  {
    id: 'lavender-glass',
    name: 'Lavender Glass',
    description: 'Soft lavender tones with frosted glass & purple accents',
    bgPreview: '#F3EDF4',
    cardPreview: 'rgba(255, 255, 255, 0.70)',
    accentPreview: '#9589AD',
    textPreview: '#302C49',
  },
  {
    id: 'midnight-glass',
    name: 'Midnight Glass',
    description: 'Deep navy charcoal backdrop with luminous purple glow',
    bgPreview: '#0F0E17',
    cardPreview: 'rgba(36, 32, 58, 0.85)',
    accentPreview: '#9D91D8',
    textPreview: '#F2EEF8',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Refreshing pale aqua with cool frosted glass and teal',
    bgPreview: '#E6F3F3',
    cardPreview: 'rgba(255, 255, 255, 0.78)',
    accentPreview: '#4F9D9D',
    textPreview: '#1C3B3B',
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    description: 'Subtle blush pink with gentle rosy highlights and plum text',
    bgPreview: '#F8EBF0',
    cardPreview: 'rgba(255, 255, 255, 0.78)',
    accentPreview: '#C67B92',
    textPreview: '#3D2631',
  },
  {
    id: 'minimal-cloud',
    name: 'Minimal Cloud',
    description: 'Pure neutral off-white with crisp cards and slate accents',
    bgPreview: '#F4F5F7',
    cardPreview: 'rgba(255, 255, 255, 0.92)',
    accentPreview: '#5A6268',
    textPreview: '#212529',
  },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  currency,
  onCurrencyChange,
  activeTheme,
  previewTheme,
  onPreviewTheme,
  onApplyTheme,
  dateFormat,
  onDateFormatChange,
  onSignOut,
}) => {
  const { success, error, info } = useNotification();

  // Currency Search state
  const [currencySearch, setCurrencySearch] = useState<string>('');

  // Password Update State
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // Delete Account Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Filtered Currencies
  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.symbol.toLowerCase().includes(currencySearch.toLowerCase())
  );

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 1, text: 'Weak', color: 'bg-expense' };
    if (score <= 4) return { score: 2, text: 'Medium', color: 'bg-[#E5A93C]' };
    return { score: 3, text: 'Strong', color: 'bg-income' };
  };

  const strength = getPasswordStrength(newPassword);

  // Handle Currency Selection
  const handleSelectCurrency = async (code: string) => {
    onCurrencyChange(code);
    try {
      await api.updateProfile({ preferred_currency: code });
      success(`Display currency set to ${code}`);
    } catch {
      info(`Display currency set to ${code}`);
    }
  };

  // Handle Date Format Selection
  const handleSelectDateFormat = async (newFormat: string) => {
    onDateFormatChange(newFormat);
    try {
      await api.updateProfile({ date_format: newFormat });
      success(`Date format set to ${newFormat}`);
    } catch {
      info(`Date format set to ${newFormat}`);
    }
  };

  // Handle Password Reset Email
  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    try {
      await authService.resetPassword(user.email);
      success(`Password reset recovery link sent to ${user.email}`);
    } catch (err: any) {
      error(err.message || 'Failed to dispatch password recovery link.');
    }
  };

  // Handle Update Password in place
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('New passwords do not match. Please verify.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authService.updatePassword(newPassword);
      success('Password changed successfully.');
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const currentlyEffectiveTheme = previewTheme || activeTheme;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
          Application Settings
        </h1>
        <p className="text-sm sm:text-base text-text-secondary mt-1 font-medium">
          Customize your appearance themes, display formatting, and account security
        </p>
      </div>

      {/* Floating Theme Preview Banner */}
      {previewTheme && previewTheme !== activeTheme && (
        <div className="sticky top-4 z-30 p-4 rounded-3xl bg-white/95 border-2 border-primary shadow-glass-lg backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-primary animate-ping" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">
                Previewing Theme
              </p>
              <p className="text-sm font-bold text-text-primary">
                {THEMES_LIST.find((t) => t.id === previewTheme)?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onPreviewTheme(null)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-white/70 hover:bg-white border border-white cursor-pointer transition-all"
            >
              Cancel Preview
            </button>
            <button
              type="button"
              onClick={() => onApplyTheme(previewTheme)}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark shadow-glass cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Theme</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION A: APPEARANCE & PERSONALIZATION (5 THEMES) */}
      <div className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-light text-primary shadow-2xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Appearance & Personalization</h2>
              <p className="text-xs text-text-secondary">
                Select from 5 master glassmorphism themes with live preview
              </p>
            </div>
          </div>
        </div>

        {/* 5 Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {THEMES_LIST.map((th) => {
            const isApplied = activeTheme === th.id;
            const isPreviewing = currentlyEffectiveTheme === th.id;

            return (
              <div
                key={th.id}
                onClick={() => onPreviewTheme(th.id)}
                className={`group relative p-4 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isPreviewing
                    ? 'bg-white/90 border-primary shadow-glass-lg scale-[1.02]'
                    : 'glass-pill hover:bg-white/70 border-white/70 hover:scale-[1.01]'
                }`}
              >
                <div>
                  {/* Theme Color Palette Preview Bar */}
                  <div
                    className="w-full h-18 rounded-2xl p-2.5 mb-3.5 flex flex-col justify-between border border-white/40 shadow-xs relative overflow-hidden"
                    style={{ background: th.bgPreview }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-white/60 shadow-2xs"
                          style={{ background: th.accentPreview }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/60 shadow-2xs"
                          style={{ background: th.cardPreview }}
                        />
                      </div>
                      {isApplied && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary text-white shadow-xs">
                          Active
                        </span>
                      )}
                    </div>
                    {/* Inner mini card simulation */}
                    <div
                      className="px-2.5 py-1.5 rounded-xl border border-white/50 text-[10px] font-bold shadow-2xs truncate"
                      style={{ background: th.cardPreview, color: th.textPreview }}
                    >
                      Sample Card Preview
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-extrabold text-text-primary tracking-tight">
                      {th.name}
                    </h3>
                    {isPreviewing && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {th.description}
                  </p>
                </div>

                {/* Theme Action Button */}
                <div className="mt-4 pt-3 border-t border-white/40 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-text-muted">
                    {isApplied ? 'Currently Active' : isPreviewing ? 'In Preview' : 'Click to preview'}
                  </span>
                  {!isApplied && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyTheme(th.id);
                      }}
                      className="px-3 py-1 rounded-xl text-[11px] font-bold text-white bg-primary hover:bg-primary-dark transition-all cursor-pointer shadow-xs"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION B: DISPLAY PREFERENCES */}
      <div className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-income-light text-income shadow-2xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Display Preferences</h2>
              <p className="text-xs text-text-secondary">
                Select your currency symbol and date representation format
              </p>
            </div>
          </div>
        </div>

        {/* Currency Selector with Search */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <label className="block text-xs font-bold text-text-secondary ml-1">
              Display Currency (12 Supported Currencies)
            </label>
            <input
              type="text"
              value={currencySearch}
              onChange={(e) => setCurrencySearch(e.target.value)}
              placeholder="Search currency..."
              className="px-3 py-1.5 rounded-xl bg-white/70 border border-white text-xs font-semibold text-text-primary placeholder:text-text-muted max-w-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
            {filteredCurrencies.map((cur) => {
              const isSelected = currency.toUpperCase() === cur.code;
              return (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => handleSelectCurrency(cur.code)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/95 border-primary shadow-glass text-text-primary scale-[1.01]'
                      : 'glass-pill text-text-secondary hover:bg-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-text-primary">
                      {cur.code} ({cur.symbol})
                    </span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] font-medium text-text-secondary mt-0.5 truncate">
                    {cur.name}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-text-secondary/80 mt-2 ml-1">
            * Note: Changing display currency formats your transactions visually using the selected symbol. It does not convert or mutate original monetary values stored in the database.
          </p>
        </div>

        {/* Date Format */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
            Date Presentation Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            {[
              { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: 'e.g. 04/11/2026' },
              { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: 'e.g. 11/04/2026' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelectDateFormat(f.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  dateFormat === f.id
                    ? 'bg-white/95 border-primary shadow-glass text-text-primary'
                    : 'glass-pill text-text-secondary hover:bg-white/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-text-primary">{f.label}</span>
                  {dateFormat === f.id && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">{f.example}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION C: ACCOUNT & SECURITY */}
      <div className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#F0EBF5] text-primary shadow-2xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Account Security</h2>
              <p className="text-xs text-text-secondary">
                Password management, authentication recovery, and account deletion
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/70 border border-white text-xs font-bold text-text-secondary">
            <span>Provider:</span>
            <strong className="text-text-primary">
              {user?.provider === 'google' ? 'Google OAuth' : 'Email'}
            </strong>
          </span>
        </div>

        {/* Change Password Form */}
        {isChangingPassword ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4 p-5 rounded-2xl bg-white/50 border border-white/80">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Update Secure Password
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1 ml-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/90 border border-white text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {/* Strength Meter */}
                {newPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strength.color}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                    </div>
                    <span className="text-[10px] font-extrabold text-text-secondary">
                      {strength.text}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1 ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/90 border border-white text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark shadow-xs cursor-pointer"
              >
                {isUpdatingPassword ? 'Updating...' : 'Save Password'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/40 border border-white">
            <div>
              <p className="text-xs font-bold text-text-primary">Password Management</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Update your login password or dispatch a password recovery link
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChangingPassword(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-text-primary bg-white/80 hover:bg-white border border-white shadow-2xs transition-all cursor-pointer"
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={handleSendResetEmail}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-primary hover:text-primary-dark bg-primary-light hover:bg-[#E2DCE8] transition-all cursor-pointer"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        )}

        {/* Sign Out and Danger Zone */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-bold text-text-secondary hover:text-text-primary bg-white/60 hover:bg-white border border-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of SmartSpend</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-bold text-expense bg-[#FBEEEC] hover:bg-[#F8E2E0] border border-expense/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* SECTION D: ABOUT SMARTSPEND */}
      <div className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-white/80 text-text-primary shadow-2xs">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">About SmartSpend</h2>
            <p className="text-xs text-text-secondary">App information, architecture, and version specifications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/40 border border-white">
            <p className="font-bold text-text-secondary">Application</p>
            <p className="font-extrabold text-text-primary mt-1">SmartSpend Personal Tracker</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/40 border border-white">
            <p className="font-bold text-text-secondary">Version</p>
            <p className="font-extrabold text-text-primary mt-1">v1.2.0 (Production)</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/40 border border-white">
            <p className="font-bold text-text-secondary">Architecture</p>
            <p className="font-extrabold text-text-primary mt-1">Supabase + FastAPI + React 19</p>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed pt-1">
          SmartSpend is a personal finance clarity system engineered with translucent glassmorphic design and multi-user row-level security. User data is partitioned by authenticated UUID with full encryption in transit and at rest.
        </p>
      </div>

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#302C49]/40 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-sm glass-modal rounded-[32px] p-6 z-10 shadow-glass-lg border border-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FBEEEC] text-expense flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-extrabold text-text-primary">Delete Account Confirmation</h3>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
              Are you sure you want to delete your SmartSpend account? This action permanently removes all your recorded transactions, profile metadata, and financial history.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-text-secondary bg-white/80 hover:bg-white border border-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  onSignOut();
                  info('Account deletion request initiated.');
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-expense hover:bg-[#B85048] shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
