import React from 'react';
import { Database, ShieldCheck, Terminal, User, Sparkles } from 'lucide-react';

interface SettingsPageProps {
  currency: string;
  onCurrencyChange: (newCurrency: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currency,
  onCurrencyChange,
}) => {
  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-150">
      <div>
        <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage system configuration, defaults, and lab environment details
        </p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <User className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-charcoal-900">User Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Account Name
            </label>
            <input
              type="text"
              readOnly
              value="Cedric"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-charcoal-800 font-medium cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">
              Default Currency
            </label>
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896]"
            >
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database & Architecture Info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-charcoal-900">
            System & Database Integration
          </h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div>
              <p className="font-semibold text-charcoal-800">Database Engine</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supabase PostgreSQL (Cloud Database)
              </p>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
            <div>
              <p className="font-semibold text-charcoal-800">Backend API</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Python FastAPI REST Server (Port 8000)
              </p>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-500">
              REST /api/transactions
            </span>
          </div>
        </div>
      </div>

      {/* Lab Project Context */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-charcoal-900">
            Unix Shell Programming Lab Context
          </h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          SmartSpend is configured for dual-boot cross-platform operations. The web frontend
          and FastAPI backend are developed in Windows, and the Unix Shell scripts run natively
          in Ubuntu Linux using Bash to interface with the exact same Supabase database and REST API.
        </p>
      </div>
    </div>
  );
};

