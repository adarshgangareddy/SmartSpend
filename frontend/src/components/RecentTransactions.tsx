import React from 'react';
import { ArrowUpRight, ArrowDownLeft, ChevronRight, ReceiptText } from 'lucide-react';
import { Transaction } from '../types';

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
  // Take top 6 most recent transactions
  const recent = transactions.slice(0, 6);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
        <div>
          <h3 className="text-sm font-bold text-charcoal-900">
            Recent Transactions
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Latest financial movements
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#00A896] hover:text-[#028090] flex items-center gap-1 transition-colors"
        >
          View all
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-2">
            <ReceiptText className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-medium">No recent transactions</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click "Add Transaction" to record your first entry.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recent.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50/70 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-charcoal-900 truncate">
                      {tx.description || tx.category}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium text-slate-400">
                        {tx.category}
                      </span>
                      <span className="text-[11px] text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(tx.transaction_date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <p
                    className={`text-xs font-bold ${
                      isIncome ? 'text-emerald-600' : 'text-charcoal-900'
                    }`}
                  >
                    {isIncome ? '+' : '-'}₹
                    {tx.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
