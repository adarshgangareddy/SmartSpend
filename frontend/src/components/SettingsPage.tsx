import React from 'react';
import { User, Wallet, Bell, Sparkles } from 'lucide-react';

interface SettingsPageProps {
  currency: string;
  onCurrencyChange: (newCurrency: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currency,
  onCurrencyChange,
}) => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-text-secondary mt-1 font-medium">
          Manage your personal preferences and currency settings
        </p>
      </div>

      {/* User Profile Card */}
      <div className="glass-card rounded-3xl p-6 lg:p-7 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-primary-light text-primary-dark">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Profile
            </h2>
            <p className="text-xs text-text-secondary">
              Personal account information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              Name
            </label>
            <input
              type="text"
              readOnly
              value="Cedric"
              className="w-full px-4 py-2.5 rounded-2xl glass-pill font-semibold text-text-primary cursor-not-allowed bg-white/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              Account Role
            </label>
            <input
              type="text"
              readOnly
              value="Personal Finance Tracker"
              className="w-full px-4 py-2.5 rounded-2xl glass-pill font-semibold text-text-primary cursor-not-allowed bg-white/40"
            />
          </div>
        </div>
      </div>

      {/* Currency Preference Card */}
      <div className="glass-card rounded-3xl p-6 lg:p-7 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-income-light text-income">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Preferences
            </h2>
            <p className="text-xs text-text-secondary">
              Choose your display currency
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-secondary mb-2">
            Default Display Currency
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { code: 'INR', label: 'INR (₹)', desc: 'Indian Rupee' },
              { code: 'USD', label: 'USD ($)', desc: 'US Dollar' },
              { code: 'EUR', label: 'EUR (€)', desc: 'Euro' },
              { code: 'GBP', label: 'GBP (£)', desc: 'British Pound' },
            ].map((cur) => (
              <button
                key={cur.code}
                type="button"
                onClick={() => onCurrencyChange(cur.code)}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  currency === cur.code
                    ? 'bg-white/80 border-primary shadow-glass text-text-primary'
                    : 'glass-pill text-text-secondary hover:bg-white/60'
                }`}
              >
                <div className="font-extrabold text-base text-text-primary">
                  {cur.label}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5 font-medium">
                  {cur.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
