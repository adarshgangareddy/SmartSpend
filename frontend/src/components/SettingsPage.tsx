import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Shield,
  Info,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
  Bell,
  Sliders,
  DollarSign,
  Calendar,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AuthUser, authService } from '../services/auth';
import { api } from '../services/api';
import { SUPPORTED_CURRENCIES, formatAmount } from '../utils/formatters';
import { useNotification } from './NotificationToast';
import { Transaction, FinancialSummary } from '../types';
import { Logo } from './Logo';

interface SettingsPageProps {
  user: AuthUser | null;
  currency: string;
  onCurrencyChange: (newCurrency: string) => void;
  dateFormat: string;
  onDateFormatChange: (format: string) => void;
  transactions?: Transaction[];
  summary?: FinancialSummary;
  onSignOut: () => void;
}

interface BudgetPreferences {
  monthlyBudget: number;
  budgetCurrency: string;
  resetPeriod: 'monthly' | 'weekly';
  thresholdPercent: number; // 80, 90, 100
  defaultDateRange: 'current' | 'last_month' | 'year' | 'all';
}

interface NotificationPreferences {
  monthlySummary: boolean;
  thresholdAlerts: boolean;
  budgetExceededAlerts: boolean;
}

const DEFAULT_BUDGET_PREFS: BudgetPreferences = {
  monthlyBudget: 50000,
  budgetCurrency: 'INR',
  resetPeriod: 'monthly',
  thresholdPercent: 80,
  defaultDateRange: 'current',
};

const DEFAULT_NOTIF_PREFS: NotificationPreferences = {
  monthlySummary: true,
  thresholdAlerts: true,
  budgetExceededAlerts: true,
};

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  currency,
  onCurrencyChange,
  dateFormat,
  onDateFormatChange,
  transactions = [],
  summary,
  onSignOut,
}) => {
  const { success, error, info } = useNotification();

  // Search filter for 12 currencies
  const [currencySearch, setCurrencySearch] = useState<string>('');

  // Password Management state
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [passwordVerificationSent, setPasswordVerificationSent] = useState<boolean>(false);
  const [passwordVerificationEmail, setPasswordVerificationEmail] = useState<string>('');

  // Danger Zone Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  // Budget Preferences
  const [budgetPrefs, setBudgetPrefs] = useState<BudgetPreferences>(() => {
    try {
      const saved = localStorage.getItem('smartspend_budget_prefs');
      return saved ? { ...DEFAULT_BUDGET_PREFS, ...JSON.parse(saved) } : DEFAULT_BUDGET_PREFS;
    } catch {
      return DEFAULT_BUDGET_PREFS;
    }
  });

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('smartspend_notification_prefs');
      return saved ? { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(saved) } : DEFAULT_NOTIF_PREFS;
    } catch {
      return DEFAULT_NOTIF_PREFS;
    }
  });

  // Data Export Date Filter
  const [exportRange, setExportRange] = useState<'all' | 'month' | '30days'>('all');

  // Live Exchange Rates for currency conversion
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    api.getExchangeRates()
      .then((data) => {
        if (mounted && data?.rates) {
          setExchangeRates(data.rates);
        }
      })
      .catch((err) => {
        console.warn('Failed to load exchange rates for budget:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Filter 12 supported currencies
  const filteredCurrencies = useMemo(() => {
    const q = currencySearch.toLowerCase().trim();
    if (!q) return SUPPORTED_CURRENCIES;
    return SUPPORTED_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [currencySearch]);

  // Compute Current Month Total Spending from Actual Transactions
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    return transactions
      .filter((tx) => {
        if (tx.type !== 'expense') return false;
        const d = new Date(tx.transaction_date);
        return !isNaN(d.getTime()) && d.getFullYear() === curYear && d.getMonth() === curMonth;
      })
      .reduce((acc, tx) => acc + (tx.is_converted ? (tx.converted_amount ?? tx.amount) : tx.amount), 0);
  }, [transactions]);

  // Dynamically calculate Displayed Budget converted to active display currency
  const displayedBudget = useMemo(() => {
    const baseBudget = budgetPrefs.monthlyBudget || 0;
    const baseCurr = (budgetPrefs.budgetCurrency || 'INR').toUpperCase();
    const targetCurr = (currency || 'INR').toUpperCase();

    if (baseCurr === targetCurr || !baseBudget) {
      return baseBudget;
    }

    const baseRate = exchangeRates[baseCurr];
    const targetRate = exchangeRates[targetCurr];

    if (baseRate && targetRate && baseRate > 0) {
      const inUSD = baseBudget / baseRate;
      return Math.round(inUSD * targetRate);
    }

    return baseBudget;
  }, [budgetPrefs.monthlyBudget, budgetPrefs.budgetCurrency, currency, exchangeRates]);

  // Budget calculation using displayedBudget
  const budgetSpent = currentMonthExpenses;
  const budgetTotal = displayedBudget > 0 ? displayedBudget : 1;
  const spentPercent = Math.min(Math.round((budgetSpent / budgetTotal) * 100), 100);
  const remainingBudget = Math.max(displayedBudget - budgetSpent, 0);
  const isThresholdTriggered = spentPercent >= budgetPrefs.thresholdPercent;
  const isBudgetExceeded = budgetSpent > displayedBudget;

  const handleSaveBudget = (updates: Partial<BudgetPreferences>) => {
    const updated = { ...budgetPrefs, ...updates };
    setBudgetPrefs(updated);
    localStorage.setItem('smartspend_budget_prefs', JSON.stringify(updated));
    success('Budget preferences saved.');
  };

  const handleToggleNotif = (key: keyof NotificationPreferences) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem('smartspend_notification_prefs', JSON.stringify(updated));
    success('Notification preferences updated.');
  };

  // Currency Selection
  const handleSelectCurrency = async (newCode: string) => {
    onCurrencyChange(newCode);
    try {
      await api.updateProfile({ preferred_currency: newCode });
    } catch {
      // Local change persists regardless
    }
    success(`Display currency set to ${newCode}`);
  };

  // Date Format Selection
  const handleSelectDateFormat = async (fmt: string) => {
    onDateFormatChange(fmt);
    try {
      await api.updateProfile({ date_format: fmt });
    } catch {
      // Local change persists regardless
    }
    success(`Date presentation format set to ${fmt}`);
  };

  // Update Password via Email Verification
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      error('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.requestPasswordChange(newPassword);
      setPasswordVerificationEmail(res.email || user?.email || 'your email');
      setPasswordVerificationSent(true);
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      success('Verification email dispatched! Please click the link in your email to confirm the change.');
    } catch (err: any) {
      error(err.message || 'Unable to initiate password update.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Export Transactions to CSV
  const handleExportCSV = () => {
    try {
      let exportTx = [...transactions];
      const now = new Date();

      if (exportRange === 'month') {
        const curYear = now.getFullYear();
        const curMonth = now.getMonth();
        exportTx = exportTx.filter((t) => {
          const d = new Date(t.transaction_date);
          return !isNaN(d.getTime()) && d.getFullYear() === curYear && d.getMonth() === curMonth;
        });
      } else if (exportRange === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        exportTx = exportTx.filter((t) => {
          const d = new Date(t.transaction_date);
          return !isNaN(d.getTime()) && d >= thirtyDaysAgo;
        });
      }

      if (exportTx.length === 0) {
        info('No transactions found in the selected range to export.');
        return;
      }

      const headers = [
        'ID',
        'Date',
        'Type',
        'Category',
        'Description',
        'Original Amount',
        'Original Currency',
        'Converted Amount',
        'Display Currency',
        'Exchange Rate',
      ];

      const rows = exportTx.map((tx) => [
        tx.id,
        `"${tx.transaction_date}"`,
        `"${tx.type}"`,
        `"${tx.category.replace(/"/g, '""')}"`,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.amount,
        `"${tx.currency}"`,
        tx.converted_amount ?? tx.amount,
        `"${tx.display_currency || currency}"`,
        tx.exchange_rate ?? 1.0,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `smartspend_transactions_${exportRange}_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      success(`Exported ${exportTx.length} transactions successfully.`);
    } catch (err: any) {
      error('Failed to export transactions CSV.');
    }
  };

  // Download Financial Summary
  const handleDownloadSummary = () => {
    try {
      const inc = summary?.total_income ?? 0;
      const exp = summary?.total_expenses ?? 0;
      const bal = summary?.balance ?? 0;

      const summaryText = [
        'SmartSpend Financial Summary Report',
        `Generated: ${new Date().toLocaleString()}`,
        `Account: ${user?.fullName || user?.email || 'User'} (${user?.email || ''})`,
        `Display Currency: ${currency}`,
        '----------------------------------------',
        `Total Income: ${formatAmount(inc, currency)}`,
        `Total Expenses: ${formatAmount(exp, currency)}`,
        `Net Balance: ${formatAmount(bal, currency)}`,
        `Total Recorded Transactions: ${transactions.length}`,
        `Current Month Budget: ${formatAmount(budgetPrefs.monthlyBudget, currency)}`,
        `Current Month Spent: ${formatAmount(budgetSpent, currency)} (${spentPercent}%)`,
        `Remaining Budget: ${formatAmount(remainingBudget, currency)}`,
        '----------------------------------------',
        'Note: Amounts dynamically converted using historical exchange rates for each transaction date.',
      ].join('\n');

      const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `smartspend_summary_${new Date().toISOString().split('T')[0]}.txt`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('Financial summary report downloaded.');
    } catch {
      error('Failed to download summary report.');
    }
  };

  // Delete Account
  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      error('Please type DELETE in capital letters to confirm account removal.');
      return;
    }
    setIsDeletingAccount(true);
    try {
      // Call backend to purge transactions, user profile, and Supabase auth account
      await api.deleteAccount();
      // Clear sessions and local data
      localStorage.clear();
      setIsDeleteModalOpen(false);
      onSignOut();
      success('Your SmartSpend account and data have been permanently removed.');
    } catch (err: any) {
      error(err.message || 'Unable to delete account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Password strength meter
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: 'bg-transparent' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-expense' };
    if (score === 2) return { score: 2, text: 'Fair', color: 'bg-amber-400' };
    if (score === 3) return { score: 3, text: 'Good', color: 'bg-primary' };
    return { score: 4, text: 'Strong', color: 'bg-income' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Top Header */}
      <div className="pb-3 border-b border-white/60">
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1 font-medium">
          Manage your preferences and customize your SmartSpend experience.
        </p>
      </div>

      {/* SECTION 1: CURRENCY & DISPLAY PREFERENCES */}
      <section className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-income-light text-income shadow-2xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Currency & Display Preferences</h2>
            <p className="text-xs text-text-secondary">
              Select your active display currency and date presentation format
            </p>
          </div>
        </div>

        {/* Currency Selector with Search */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <label className="block text-xs font-bold text-text-secondary ml-1">
              Active Display Currency ({SUPPORTED_CURRENCIES.length} Supported Currencies)
            </label>
            <input
              type="text"
              value={currencySearch}
              onChange={(e) => setCurrencySearch(e.target.value)}
              placeholder="Search currency (code or name)..."
              className="px-3.5 py-1.5 rounded-xl bg-white/70 border border-white text-xs font-semibold text-text-primary placeholder:text-text-muted max-w-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                      : 'glass-pill text-text-secondary hover:bg-white/70 border-white/70'
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

          <div className="mt-3.5 p-3.5 rounded-2xl bg-white/70 border border-white flex items-start gap-2.5">
            <span className="text-primary text-xs mt-0.5">ℹ️</span>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              Your transactions remain securely stored in their original currencies in the database. SmartSpend converts them dynamically using historical exchange rates for accurate financial reporting and dashboard analytics.
            </p>
          </div>
        </div>

        {/* Date Presentation Format */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
            Date Presentation Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            {[
              { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: 'e.g. 05/11/2026' },
              { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: 'e.g. 11/05/2026' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelectDateFormat(f.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  dateFormat === f.id
                    ? 'bg-white/95 border-primary shadow-glass text-text-primary'
                    : 'glass-pill text-text-secondary hover:bg-white/70 border-white/70'
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
      </section>

      {/* SECTION 2: BUDGET & FINANCIAL PREFERENCES */}
      <section className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-[#F0EBF5] text-primary shadow-2xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Budget & Financial Preferences</h2>
            <p className="text-xs text-text-secondary">
              Set monthly spending thresholds, monitor budget progress, and configure dashboard dates
            </p>
          </div>
        </div>

        {/* Current Month Budget Status Card */}
        <div className="p-5 rounded-3xl bg-white/65 border border-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-text-secondary">Current Month Spending vs Budget</p>
              <p className="text-lg font-black text-text-primary mt-0.5">
                {formatAmount(budgetSpent, currency)}{' '}
                <span className="text-xs font-bold text-text-secondary">
                  / {formatAmount(displayedBudget, currency)}
                </span>
              </p>
              {budgetPrefs.budgetCurrency && budgetPrefs.budgetCurrency.toUpperCase() !== currency.toUpperCase() && (
                <p className="text-[11px] font-semibold text-text-muted mt-0.5">
                  Base budget: {formatAmount(budgetPrefs.monthlyBudget, budgetPrefs.budgetCurrency)} ({budgetPrefs.budgetCurrency})
                </p>
              )}
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 rounded-xl text-xs font-black ${
                  isBudgetExceeded
                    ? 'bg-expense-light text-expense'
                    : isThresholdTriggered
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-income-light text-income'
                }`}
              >
                {spentPercent}% Used
              </span>
              <p className="text-[11px] font-semibold text-text-secondary mt-1">
                {isBudgetExceeded
                  ? 'Budget exceeded!'
                  : `${formatAmount(remainingBudget, currency)} remaining`}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-white/80 rounded-full overflow-hidden p-0.5 border border-white">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isBudgetExceeded
                  ? 'bg-expense'
                  : isThresholdTriggered
                  ? 'bg-amber-400'
                  : 'bg-primary'
              }`}
              style={{ width: `${Math.min(spentPercent, 100)}%` }}
            />
          </div>

          {isThresholdTriggered && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center gap-2 text-xs text-amber-800 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Warning: You have reached {spentPercent}% of your monthly spending limit ({budgetPrefs.thresholdPercent}% threshold).
              </span>
            </div>
          )}
        </div>

        {/* Budget Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
          {/* Monthly Budget Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <label className="text-xs font-bold text-text-secondary">
                Spending Budget ({currency})
              </label>
              {budgetPrefs.budgetCurrency && budgetPrefs.budgetCurrency.toUpperCase() !== currency.toUpperCase() && (
                <span className="text-[10px] font-bold text-primary bg-[#F0EBF5] px-1.5 py-0.5 rounded-md">
                  Converted
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="100"
                value={displayedBudget}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  handleSaveBudget({ monthlyBudget: val, budgetCurrency: currency });
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white/80 border border-white text-sm font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <DollarSign className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] text-text-muted mt-1 ml-1">
              Base: {budgetPrefs.budgetCurrency || currency}
            </p>
          </div>

          {/* Reset Period */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
              Budget Reset Cycle
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'monthly', label: 'Monthly' },
                { id: 'weekly', label: 'Weekly' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSaveBudget({ resetPeriod: p.id as 'monthly' | 'weekly' })}
                  className={`py-2.5 px-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer ${
                    budgetPrefs.resetPeriod === p.id
                      ? 'bg-white/95 border-primary shadow-glass text-text-primary'
                      : 'glass-pill text-text-secondary hover:bg-white/70 border-white/70'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Warning Threshold Selector */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
              Warning Alert Threshold
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[80, 90, 100].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSaveBudget({ thresholdPercent: t })}
                  className={`py-2.5 px-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer ${
                    budgetPrefs.thresholdPercent === t
                      ? 'bg-white/95 border-primary shadow-glass text-text-primary'
                      : 'glass-pill text-text-secondary hover:bg-white/70 border-white/70'
                  }`}
                >
                  {t}% Limit
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Default Dashboard Date Range */}
        <div className="pt-1">
          <label className="block text-xs font-bold text-text-secondary mb-1.5 ml-1">
            Default Dashboard Date Range
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'current', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() =>
                  handleSaveBudget({
                    defaultDateRange: r.id as BudgetPreferences['defaultDateRange'],
                  })
                }
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  budgetPrefs.defaultDateRange === r.id
                    ? 'bg-white/95 border-primary shadow-glass text-text-primary'
                    : 'glass-pill text-text-secondary hover:bg-white/70 border-white/70'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: NOTIFICATIONS & REMINDERS */}
      <section className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-white/80 text-primary shadow-2xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Notifications & Reminders</h2>
            <p className="text-xs text-text-secondary">
              Configure financial summary updates and spending limit alerts
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            {
              key: 'monthlySummary' as const,
              title: 'Monthly Financial Summary',
              desc: 'Receive end-of-month breakdown of net savings and top expense categories.',
            },
            {
              key: 'thresholdAlerts' as const,
              title: 'Budget Threshold Alerts',
              desc: `Notify immediately when spending reaches ${budgetPrefs.thresholdPercent}% of your monthly limit.`,
            },
            {
              key: 'budgetExceededAlerts' as const,
              title: 'Budget Exceeded Notifications',
              desc: 'Alert immediately whenever expenses cross 100% of your allocated budget.',
            },
          ].map((item) => (
            <div
              key={item.key}
              className="p-4 rounded-2xl bg-white/50 border border-white flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-xs font-bold text-text-primary">{item.title}</p>
                <p className="text-[11px] text-text-secondary mt-0.5">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotif(item.key)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  notifPrefs[item.key] ? 'bg-primary' : 'bg-white/80 border border-white'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-1 ${
                    notifPrefs[item.key] ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-2xl bg-white/60 border border-white text-xs text-text-secondary">
          <p className="font-semibold">
            📌 Note: Push and Email delivery channels are currently in preview. In-app notifications and threshold alerts are fully active.
          </p>
        </div>
      </section>

      {/* SECTION 4: DATA & EXPORT */}
      <section className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-[#EAF7EE] text-income shadow-2xs">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Data & Export</h2>
            <p className="text-xs text-text-secondary">
              Export your full transaction history and download comprehensive financial reports
            </p>
          </div>
        </div>

        {/* Date Filter for CSV Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/50 border border-white">
          <div>
            <p className="text-xs font-bold text-text-primary">Export Date Range Filter</p>
            <p className="text-[11px] text-text-secondary mt-0.5">
              Select which timeframe to include in your CSV export
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'month', label: 'This Month' },
              { id: '30days', label: 'Last 30 Days' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setExportRange(r.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  exportRange === r.id
                    ? 'bg-white text-text-primary shadow-xs border-primary'
                    : 'bg-white/60 text-text-secondary border-white/80 hover:bg-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-5 rounded-2xl bg-white/80 hover:bg-white border border-white shadow-2xs hover:shadow-glass transition-all text-left flex items-start gap-4 cursor-pointer group"
          >
            <div className="p-3 rounded-2xl bg-income-light text-income group-hover:scale-105 transition-transform shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Export Transactions to CSV</p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Download transactions table with date, category, original amount, currency, and converted totals.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleDownloadSummary}
            className="p-5 rounded-2xl bg-white/80 hover:bg-white border border-white shadow-2xs hover:shadow-glass transition-all text-left flex items-start gap-4 cursor-pointer group"
          >
            <div className="p-3 rounded-2xl bg-primary-light text-primary group-hover:scale-105 transition-transform shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Download Financial Summary</p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Download a clean summary report containing total income, total expenses, net balance, and budget metrics.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* SECTION 5: ACCOUNT SECURITY */}
      <section className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/60">
          <div className="p-2.5 rounded-2xl bg-[#F0EBF5] text-primary shadow-2xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Account Security</h2>
            <p className="text-xs text-text-secondary">
              Update password credentials and trigger password recovery emails
            </p>
          </div>
        </div>

        {/* Change Password Form */}
        {passwordVerificationSent ? (
          <div className="p-5 rounded-2xl bg-[#EBF5EA] border border-[#75A65A]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#75A65A] text-white shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">
                  Verification Email Dispatched
                </p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  We sent a confirmation link to <strong className="text-text-primary">{passwordVerificationEmail}</strong>. Click the button in your email to finalize and activate your new password.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPasswordVerificationSent(false);
                setIsChangingPassword(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-primary bg-white hover:bg-white/90 border border-white/80 shadow-2xs transition-all cursor-pointer shrink-0"
            >
              Request Again
            </button>
          </div>
        ) : isChangingPassword ? (
          <form
            onSubmit={handleUpdatePassword}
            className="space-y-4 p-5 rounded-2xl bg-white/50 border border-white/80"
          >
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
                {newPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/70 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strength.color}`} />
                      <div
                        className={`h-full flex-1 rounded-full ${
                          strength.score >= 2 ? strength.color : 'bg-transparent'
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full ${
                          strength.score >= 3 ? strength.color : 'bg-transparent'
                        }`}
                      />
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

            <div className="p-3 rounded-xl bg-[#F0EBF5] border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>For your security, clicking below dispatches an email confirmation link. Your password will only update after you click confirm.</span>
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
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isUpdatingPassword ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Sending Verification Email...</span>
                  </>
                ) : (
                  <span>Verify & Update Password</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/40 border border-white">
            <div>
              <p className="text-xs font-bold text-text-primary">Password Management</p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Update your login password securely via email verification
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChangingPassword(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-primary bg-white/80 hover:bg-white border border-white shadow-2xs transition-all cursor-pointer"
              >
                Change Password
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 6: ABOUT SMARTSPEND */}
      <section className="glass-card rounded-[32px] p-6 sm:p-8 shadow-glass border border-white/90 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/60">
          <Logo size="sm" showSubtitle={false} />
          <div>
            <h2 className="text-xl font-bold text-text-primary">About SmartSpend</h2>
            <p className="text-xs text-text-secondary">Personal expense tracking with clarity</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/50 border border-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-text-primary">SmartSpend Personal Finance</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-light text-primary">
              v1.0.0
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Your personal finance companion for tracking income, managing expenses, and building financial clarity.
          </p>
          <p className="text-[11px] text-text-muted pt-1">
            Questions or feedback? Reach out to{' '}
            <a href="mailto:support@smartspend.app" className="text-primary underline font-medium">
              support@smartspend.app
            </a>
          </p>
        </div>
      </section>

      {/* SECTION 7: DANGER ZONE */}
      <section className="rounded-[32px] p-6 sm:p-8 bg-expense-light/50 border border-expense/30 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-expense/20">
          <div className="p-2.5 rounded-2xl bg-white text-expense shadow-2xs">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-expense">Danger Zone</h2>
            <p className="text-xs text-text-secondary">
              Permanent and irreversible account management operations
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/80 border border-expense/20">
          <div>
            <p className="text-xs font-bold text-text-primary">Delete SmartSpend Account</p>
            <p className="text-[11px] text-text-secondary mt-0.5 max-w-lg leading-relaxed">
              Permanently remove your account, recorded transactions, budget preferences, and profile history. This action cannot be reversed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmationText('');
              setIsDeleteModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-expense hover:bg-[#B85048] shadow-xs transition-all cursor-pointer shrink-0"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* Delete Account Explicit Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#302C49]/40 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-md glass-modal rounded-[32px] p-6 z-10 shadow-glass-lg border border-white text-left space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FBEEEC] text-expense flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-text-primary">
                Permanent Account Deletion
              </h3>
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                This will immediately delete your SmartSpend user account and purge all transaction records, budgets, and settings.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-expense-light border border-expense/20 text-xs text-expense font-semibold">
              Type <strong className="underline">DELETE</strong> below to confirm.
            </div>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-4 py-2.5 rounded-xl bg-white/90 border border-expense/30 text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-expense/40"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-text-secondary bg-white/80 hover:bg-white border border-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
                onClick={handleConfirmDeleteAccount}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-expense hover:bg-[#B85048] shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
