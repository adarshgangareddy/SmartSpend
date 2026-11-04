import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  Sun,
  SunMedium,
  Sunset,
  Moon,
  Sparkles,
} from 'lucide-react';
import { FinancialSummary, Transaction } from '../types';
import { SummaryCard } from './SummaryCard';
import { AnalyticsCharts } from './AnalyticsCharts';
import { RecentTransactions } from './RecentTransactions';
import { AuthUser } from '../services/auth';
import { getDynamicGreeting, formatDate } from '../utils/formatters';

interface DashboardProps {
  user: AuthUser | null;
  summary: FinancialSummary;
  transactions: Transaction[];
  onAddTransaction: () => void;
  onViewAllTransactions: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  dateFormat?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  summary,
  transactions,
  onAddTransaction,
  onViewAllTransactions,
  selectedMonth,
  onMonthChange,
  dateFormat = 'DD/MM/YYYY',
}) => {
  // Local device time state updated every 30 seconds
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const { greeting, period, iconName } = getDynamicGreeting(currentDate);

  // Safe display name extraction
  const displayName = user?.fullName?.trim() || user?.email?.split('@')[0] || '';
  const greetingText = displayName ? `${greeting}, ${displayName}` : greeting;

  // Weekday name in user's device locale
  const weekday = currentDate.toLocaleDateString(undefined, { weekday: 'short' });
  const formattedToday = `${weekday}, ${formatDate(currentDate, dateFormat)}`;

  // Subtle animated greeting icon styling based on time of day
  const renderGreetingIcon = () => {
    switch (period) {
      case 'morning':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs animate-pulse">
            <Sun className="w-4 h-4 stroke-[2.3]" />
          </div>
        );
      case 'afternoon':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <SunMedium className="w-4 h-4 stroke-[2.3]" />
          </div>
        );
      case 'evening':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
            <Sunset className="w-4 h-4 stroke-[2.3]" />
          </div>
        );
      case 'night':
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-primary-light border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-2xs">
            <Moon className="w-4 h-4 stroke-[2.3]" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        {/* Left: Dynamic Greeting & Date Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            {renderGreetingIcon()}
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {greetingText}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary font-medium ml-0.5">
            <span>Here's your financial overview.</span>
            <span className="text-text-muted">•</span>
            <span className="font-semibold text-text-primary/80">{formattedToday}</span>
          </div>
        </div>

        {/* Right: Date Filter & Add Transaction Action */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Month / Date Selector */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-9 pr-8 py-2.5 text-xs font-bold rounded-2xl glass-pill text-text-primary shadow-xs hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="current">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="year">This Year</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={onAddTransaction}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-[#83769D] shadow-glass hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Row 1: THREE Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
        <SummaryCard
          title="Total Balance"
          amount={summary.balance}
          currency={summary.currency}
          icon={Wallet}
          variant="balance"
        />
        <SummaryCard
          title="Total Income"
          amount={summary.total_income}
          currency={summary.currency}
          icon={TrendingUp}
          variant="income"
        />
        <SummaryCard
          title="Total Expenses"
          amount={summary.total_expenses}
          currency={summary.currency}
          icon={TrendingDown}
          variant="expense"
        />
      </div>

      {/* Row 2: Two Column Split (Monthly Overview Chart & Recent Transactions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left Column (Chart) - 7 cols on desktop */}
        <div className="lg:col-span-7">
          <AnalyticsCharts
            transactions={transactions}
            currency={summary.currency}
          />
        </div>

        {/* Right Column (Recent Transactions) - 5 cols on desktop */}
        <div className="lg:col-span-5">
          <RecentTransactions
            transactions={transactions}
            onViewAll={onViewAllTransactions}
            currency={summary.currency}
          />
        </div>
      </div>
    </div>
  );
};
