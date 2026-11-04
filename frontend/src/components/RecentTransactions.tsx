import React from 'react';
import { Transaction } from '../types';
import { formatAmount } from '../utils/formatters';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
  currency?: string;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onViewAll,
  currency = 'INR',
}) => {
  // Show 8 recent transactions to match the master design reference
  const recent = transactions.slice(0, 8);

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Header matching Reference */}
        <div className="flex items-center justify-between mb-5 px-1">
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            Recent History
          </h2>
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-primary hover:text-text-primary transition-colors cursor-pointer"
          >
            View all
          </button>
        </div>

        {/* Transactions list */}
        {recent.length === 0 ? (
          <div className="glass-pill-item rounded-[26px] py-16 px-6 text-center">
            <p className="text-sm font-semibold text-text-secondary">
              No recent history
            </p>
            <p className="text-xs text-text-muted mt-1 font-medium">
              Transactions will appear here as you add them.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {recent.map((tx) => {
              const isIncome = tx.type === 'income';
              const displayName = tx.description || tx.category;

              return (
                <div
                  key={tx.id}
                  className="glass-pill-item rounded-full sm:rounded-[22px] py-3.5 px-6 flex items-center justify-between group cursor-default transition-all duration-200"
                >
                  {/* Left Label */}
                  <span className="text-[15px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors truncate pr-3">
                    {displayName}
                  </span>

                  {/* Right Amount */}
                  <span
                    className={`text-[15px] font-bold tracking-tight shrink-0 ${
                      isIncome ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {isIncome ? '+' : '-'}{formatAmount(tx.amount, tx.currency || currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
