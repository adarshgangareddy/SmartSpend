import React from 'react';
import { ChevronRight, Clock } from 'lucide-react';
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
  // Take top 8 recent transactions to match reference length
  const recent = transactions.slice(0, 8);

  return (
    <div className="glass-card rounded-3xl p-6 lg:p-7 flex flex-col justify-between h-full transition-all duration-200">
      <div>
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-white/60">
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">
            Recent History
          </h2>
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-primary hover:text-text-primary flex items-center gap-1 transition-colors"
          >
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="py-14 text-center">
            <Clock className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-60" />
            <p className="text-sm text-text-secondary font-medium">
              No recent history
            </p>
            <p className="text-xs text-text-muted mt-1">
              Add transactions to see your history.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recent.map((tx) => {
              const isIncome = tx.type === 'income';
              const displayName = tx.description || tx.category;

              return (
                <div
                  key={tx.id}
                  className="bg-white/60 hover:bg-white/85 rounded-2xl py-3 px-4.5 flex items-center justify-between transition-all duration-150 border border-white/80 shadow-2xs group"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-text-primary tracking-tight truncate group-hover:text-[#252344]">
                      {displayName}
                    </p>
                    <p className="text-[11px] font-medium text-text-muted truncate mt-0.5">
                      {tx.category} • {tx.transaction_date}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold tracking-tight ${
                        isIncome ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
