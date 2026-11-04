import React from 'react';
import { Plus, Calendar } from 'lucide-react';
import { FinancialSummary, Transaction } from '../types';
import { SummaryCard } from './SummaryCard';
import { AnalyticsCharts } from './AnalyticsCharts';
import { RecentTransactions } from './RecentTransactions';
import { formatAmount } from '../utils/formatters';

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
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 17) return 'Good afternoon!';
    return 'Good evening!';
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">
            Here's your financial overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month / Date Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2.5 text-xs font-semibold rounded-2xl glass-pill text-text-primary shadow-xs hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="current">Current Month</option>
              <option value="last">Last Month</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={onAddTransaction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-[#77718F] shadow-glass transition-all duration-150 shrink-0 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Master Outer Glass Container matching Reference Image */}
      <div className="glass-outer rounded-[36px] sm:rounded-[40px] p-6 sm:p-8 lg:p-9">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
          {/* Left Column (Chart + Income/Expense + Total Balance) - 7 cols on lg */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. All Transactions Line Chart */}
            <AnalyticsCharts
              transactions={transactions}
              currency={summary.currency}
            />

            {/* 2. Total Income & Total Expense Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <SummaryCard
                title="Total Income"
                amount={summary.total_income}
                currency={summary.currency}
                variant="income"
              />
              <SummaryCard
                title="Total Expense"
                amount={summary.total_expenses}
                currency={summary.currency}
                variant="expense"
              />
            </div>

            {/* 3. Total Balance Floating Pill matching Reference */}
            <div className="flex justify-center pt-2">
              <div className="glass-pill-item rounded-full px-8 py-3.5 flex items-center gap-3.5 shadow-sm hover:scale-[1.01] transition-transform">
                <span className="text-base font-bold text-text-primary tracking-tight">
                  Total Balance
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                <span
                  className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                    summary.balance >= 0 ? 'text-income' : 'text-expense'
                  }`}
                >
                  {formatAmount(summary.balance, summary.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (Recent History) - 5 cols on lg */}
          <div className="lg:col-span-5 h-full">
            <RecentTransactions
              transactions={transactions}
              onViewAll={onViewAllTransactions}
              currency={summary.currency}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
