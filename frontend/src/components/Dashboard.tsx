import React from 'react';
import { Plus, Calendar, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { FinancialSummary, Transaction } from '../types';
import { SummaryCard } from './SummaryCard';
import { AnalyticsCharts } from './AnalyticsCharts';
import { RecentTransactions } from './RecentTransactions';
import { AuthUser } from '../services/auth';

interface DashboardProps {
  user: AuthUser | null;
  summary: FinancialSummary;
  transactions: Transaction[];
  onAddTransaction: () => void;
  onViewAllTransactions: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  summary,
  transactions,
  onAddTransaction,
  onViewAllTransactions,
  selectedMonth,
  onMonthChange,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.fullName ? `, ${user.fullName}` : '';
    if (hour < 12) return `Good morning${name} 👋`;
    if (hour < 17) return `Good afternoon${name} 👋`;
    return `Good evening${name} 👋`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 font-medium">
            Here's your financial overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month / Date Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2.5 text-xs font-bold rounded-2xl glass-pill text-text-primary shadow-xs hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="nov_2026">Nov 2026</option>
              <option value="oct_2026">Oct 2026</option>
              <option value="current">Current Month</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={onAddTransaction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-[#83769D] shadow-glass hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Row 1: THREE Summary Cards */}
      {/* Mobile: 1 full-width balance + 2-col income/expenses; Desktop: 3 in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
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
