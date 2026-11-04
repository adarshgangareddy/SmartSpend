import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Calendar,
} from 'lucide-react';
import { FinancialSummary, Transaction } from '../types';
import { SummaryCard } from './SummaryCard';
import { AnalyticsCharts } from './AnalyticsCharts';
import { RecentTransactions } from './RecentTransactions';

interface DashboardProps {
  summary: FinancialSummary;
  transactions: Transaction[];
  onAddTransaction: () => void;
  onViewAllTransactions: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  transactions,
  onAddTransaction,
  onViewAllTransactions,
  selectedMonth,
  onMonthChange,
}) => {
  // Dynamically determine appropriate greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-charcoal-900 tracking-tight">
            {getGreeting()}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Here's your financial overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Current Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="appearance-none pl-8 pr-8 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200/90 text-charcoal-700 shadow-2xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="current">Current Month</option>
              <option value="last">Last Month</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={onAddTransaction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#00A896] hover:bg-[#028090] shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Income"
          amount={summary.total_income}
          currency={summary.currency}
          icon={TrendingUp}
          variant="income"
          subtitle="All recorded earnings"
        />
        <SummaryCard
          title="Total Expenses"
          amount={summary.total_expenses}
          currency={summary.currency}
          icon={TrendingDown}
          variant="expense"
          subtitle="All recorded spends"
        />
        <SummaryCard
          title="Total Balance"
          amount={summary.balance}
          currency={summary.currency}
          icon={Wallet}
          variant="balance"
          subtitle={
            summary.balance >= 0 ? 'Net positive savings' : 'Net deficit balance'
          }
        />
      </div>

      {/* Charts Section */}
      <AnalyticsCharts transactions={transactions} currency={summary.currency} />

      {/* Recent Transactions List */}
      <RecentTransactions
        transactions={transactions}
        onViewAll={onViewAllTransactions}
        currency={summary.currency}
      />
    </div>
  );
};

