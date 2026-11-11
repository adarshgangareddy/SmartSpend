import React, { useState, useEffect, Suspense } from 'react';
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
import { RecentTransactions } from './RecentTransactions';
import { AuthUser } from '../services/auth';
import { getDynamicGreeting, formatDate } from '../utils/formatters';

// Lazy-load the chart component so Recharts (~280KB) doesn't bloat the initial bundle
const AnalyticsCharts = React.lazy(() =>
  import('./AnalyticsCharts').then((m) => ({ default: m.AnalyticsCharts }))
);

/** Placeholder skeleton while the chart lazy-loads */
const ChartSkeleton: React.FC = () => (
  <div className="glass-box rounded-2xl sm:rounded-[28px] p-4 sm:p-6 h-full flex flex-col justify-between">
    <div>
      <div className="skeleton-pulse h-5 w-40 mb-1.5" />
      <div className="skeleton-pulse h-3 w-24" />
    </div>
    <div className="mt-5 flex-1 min-h-[14rem]">
      <div className="skeleton-pulse h-full w-full rounded-xl" />
    </div>
  </div>
);

interface DashboardProps {
  user: AuthUser | null;
  summary: FinancialSummary;
  transactions: Transaction[];
  onAddTransaction: () => void;
  onViewAllTransactions: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  dateFormat?: string;
  isLoading?: boolean;
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
  isLoading = false,
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
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 px-0.5">
        {/* Left: Dynamic Greeting & Date Subtitle */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {renderGreetingIcon()}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-text-primary tracking-tight break-words">
              {greetingText}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-text-secondary font-medium ml-0.5">
            <span>Here's your financial overview.</span>
            <span className="text-text-muted">•</span>
            <span className="font-semibold text-text-primary/80">{formattedToday}</span>
          </div>
        </div>

        {/* Right: Date Filter & Add Transaction Action */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Month / Date Selector */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-full sm:w-auto appearance-none pl-8 pr-7 py-2.5 text-xs font-bold rounded-2xl glass-pill text-text-primary shadow-xs hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="current">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="year">This Year</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-text-secondary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={onAddTransaction}
            className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-[#83769D] shadow-glass hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Row 1: THREE Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        <SummaryCard
          title="Total Balance"
          amount={summary.balance}
          currency={summary.currency}
          icon={Wallet}
          variant="balance"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Total Income"
          amount={summary.total_income}
          currency={summary.currency}
          icon={TrendingUp}
          variant="income"
          isLoading={isLoading}
        />
        <SummaryCard
          title="Total Expenses"
          amount={summary.total_expenses}
          currency={summary.currency}
          icon={TrendingDown}
          variant="expense"
          isLoading={isLoading}
        />
      </div>

      {/* Row 2: Two Column Split (Monthly Overview Chart & Recent Transactions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left Column (Chart) - 7 cols on desktop, lazy-loaded */}
        <div className="lg:col-span-7">
          <Suspense fallback={<ChartSkeleton />}>
            <AnalyticsCharts
              transactions={transactions}
              currency={summary.currency}
            />
          </Suspense>
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
