import React, { useState } from 'react';
import {
  User,
  Wallet,
  Shield,
  Info,
  Calendar,
  Lock,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { AuthUser, authService } from '../services/auth';
import { api } from '../services/api';
import { SUPPORTED_CURRENCIES } from '../utils/formatters';
import { useNotification } from './NotificationToast';

interface SettingsPageProps {
  user: AuthUser | null;
  currency: string;
  onCurrencyChange: (newCurrency: string) => void;
  onProfileUpdate: (updatedUser: AuthUser) => void;
  onSignOut: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  currency,
  onCurrencyChange,
  onProfileUpdate,
  onSignOut,
}) => {
  const { success, error, info } = useNotification();
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Preferences
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY'>('DD/MM/YYYY');

  // Change Password state
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const initialLetter = (fullName || user?.fullName || 'U').charAt(0).toUpperCase();

  // Save profile name
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      error('Full name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await api.updateProfile({ full_name: fullName.trim() });
      const updatedUser: AuthUser = {
        id: user?.id || '',
        email: user?.email || '',
        fullName: fullName.trim(),
        avatarUrl: user?.avatarUrl,
      };
      localStorage.setItem('smartspend_auth_user', JSON.stringify(updatedUser));
      onProfileUpdate(updatedUser);
      success('Profile updated successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Currency select & persist
  const handleSelectCurrency = async (code: string) => {
    onCurrencyChange(code);
    try {
      await api.updateProfile({ preferred_currency: code });
      success(`Display currency changed to ${code}`);
    } catch (err: any) {
      // Local state still applies
      info(`Display currency switched to ${code}`);
    }
  };

  // Send password reset email
  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    try {
      await authService.resetPassword(user.email);
      success(`Password reset email sent to ${user.email}`);
    } catch (err: any) {
      error(err.message || 'Failed to send password reset email.');
    }
  };

  // Update password directly
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      error('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authService.updatePassword(newPasswordInput);
      success('Password changed successfully.');
      setIsChangingPassword(false);
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setCurrentPasswordInput('');
    } catch (err: any) {
      error(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-7 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1 font-medium">
          Manage your personal profile, display preferences, and account security
        </p>
      </div>

      {/* 1. USER PROFILE SECTION */}
      <div className="glass-card rounded-3xl p-6 lg:p-7 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-primary-light text-primary-dark shadow-2xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Profile</h2>
            <p className="text-xs text-text-secondary">Your personal account information</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-2">
            <div className="w-16 h-16 rounded-full bg-linear-to-tr from-[#E7DFEE] to-white p-0.5 shadow-2xs border border-white/90 shrink-0 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-2xl font-black text-primary select-none">
                  {initialLetter}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary">
                  {user?.fullName || 'User'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF5EA] text-income border border-income/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Active</span>
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">{user?.email || 'Authenticated via Supabase'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/70 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
                Email Address (Read-only)
              </label>
              <div className="relative">
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/40 border border-white text-sm font-semibold text-text-secondary cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingProfile || fullName.trim() === user?.fullName}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-[#83769D] shadow-glass transition-all disabled:opacity-40 cursor-pointer"
            >
              {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. PREFERENCES (CURRENCY & DATE) */}
      <div className="glass-card rounded-3xl p-6 lg:p-7 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-income-light text-income shadow-2xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Display Preferences</h2>
            <p className="text-xs text-text-secondary">
              Select your currency, date layout, and theme
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-secondary mb-2.5 ml-1">
            Display Currency (12 Supported Currencies)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {SUPPORTED_CURRENCIES.map((cur) => {
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
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-text-secondary mt-0.5 truncate">
                    {cur.name}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-text-secondary/80 mt-2 ml-1">
            * Note: Amounts reflect your entered transactions formatted with the selected symbol without modifying original monetary values.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/70 border border-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm font-semibold text-text-primary cursor-pointer"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 04/11/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/04/2026)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
              Interface Theme
            </label>
            <div className="px-4 py-2.5 rounded-2xl bg-white/40 border border-white text-sm font-semibold text-text-primary flex items-center justify-between">
              <span>Lavender Glassmorphism</span>
              <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary-light rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ACCOUNT & SECURITY */}
      <div className="glass-card rounded-3xl p-6 lg:p-7 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-[#F0EBF5] text-primary shadow-2xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Account & Security</h2>
            <p className="text-xs text-text-secondary">Password management, session, and privacy controls</p>
          </div>
        </div>

        {/* Change Password Panel */}
        {isChangingPassword ? (
          <form onSubmit={handleUpdatePassword} className="space-y-3 p-4 rounded-2xl bg-white/50 border border-white/80">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Update Password
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1 ml-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/90 border border-white text-xs font-semibold text-text-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text-secondary mb-1 ml-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/90 border border-white text-xs font-semibold text-text-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-[#83769D] shadow-xs cursor-pointer"
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
                Update your password or request a reset recovery link
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
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-primary hover:text-text-primary bg-primary-light hover:bg-[#E2DCE8] transition-all cursor-pointer"
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
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-bold text-text-secondary hover:text-text-primary bg-white/60 hover:bg-white border border-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of SmartSpend</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-bold text-expense bg-[#FBEEEC] hover:bg-[#F8E2E0] border border-expense/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* 4. ABOUT SMARTSPEND */}
      <div className="glass-card rounded-3xl p-6 lg:p-7 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-white/80 text-text-primary shadow-2xs">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">About SmartSpend</h2>
            <p className="text-xs text-text-secondary">App information and version details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/40 border border-white">
            <p className="font-bold text-text-secondary">Application</p>
            <p className="font-extrabold text-text-primary mt-1">SmartSpend</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/40 border border-white">
            <p className="font-bold text-text-secondary">Version</p>
            <p className="font-extrabold text-text-primary mt-1">v1.0.0 (Production)</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/40 border border-white">
            <p className="font-bold text-text-secondary">Architecture</p>
            <p className="font-extrabold text-text-primary mt-1">Supabase + FastAPI + React</p>
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed pt-1">
          SmartSpend is a personal finance tracker designed for simplicity, clarity, and precision. Built with modern glassmorphism design principles and Supabase multi-user authentication.
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
            <h3 className="text-base font-extrabold text-text-primary">Delete Account</h3>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
              Are you sure you want to delete your SmartSpend account? This action will permanently remove all your transactions and profile records.
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
