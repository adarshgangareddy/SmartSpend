import React from 'react';
import { Plus, Calendar, Scale } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-primary-dark shadow-glass transition-all duration-150 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout matching Reference Design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

          {/* 3. Total Balance Card (Centered pill style matching reference) */}
          <div className="flex justify-center">
            <div className="glass-card rounded-3xl px-8 py-4 flex flex-col items-center justify-center text-center shadow-glass transition-all duration-200 hover:scale-[1.01] min-w-[260px]">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Total Balance
              </span>
              <div
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 ${
                  summary.balance >= 0 ? 'text-income' : 'text-expense'
                }`}
              >
                {formatAmount(summary.balance, summary.currency)}
              </div>
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
  );
};
