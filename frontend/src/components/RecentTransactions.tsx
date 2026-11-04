import React from 'react';
import {
  Briefcase,
  ShoppingCart,
  Car,
  Laptop,
  Wifi,
  Receipt,
  ArrowRight,
  TrendingUp,
  UtensilsCrossed,
  Film,
  Building,
} from 'lucide-react';
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
  // Show the latest 5 transactions belonging to the currently authenticated user
  const recent = transactions.slice(0, 5);

  const getCategoryIcon = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('salary') || cat.includes('job') || cat.includes('work')) return Briefcase;
    if (cat.includes('grocer') || cat.includes('market') || cat.includes('shop')) return ShoppingCart;
    if (cat.includes('food') || cat.includes('restaurant') || cat.includes('bistro')) return UtensilsCrossed;
    if (cat.includes('transport') || cat.includes('travel') || cat.includes('fuel') || cat.includes('car')) return Car;
    if (cat.includes('freelance') || cat.includes('tech') || cat.includes('consult')) return Laptop;
    if (cat.includes('util') || cat.includes('internet') || cat.includes('bill') || cat.includes('wifi')) return Wifi;
    if (cat.includes('entertain') || cat.includes('movie') || cat.includes('subscript')) return Film;
    if (cat.includes('rent') || cat.includes('apart')) return Building;
    if (cat.includes('invest') || cat.includes('dividend') || cat.includes('stock')) return TrendingUp;
    return Receipt;
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="glass-box rounded-[28px] p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header matching Reference */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
            Recent Transactions
          </h2>
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Transactions list */}
        {recent.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-sm font-bold text-text-secondary">
              No transactions yet. Add your first transaction to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {recent.map((tx) => {
              const isIncome = tx.type === 'income';
              const Icon = getCategoryIcon(tx.category);
              const title = tx.description ? tx.description : tx.category;
              const subtitle = `${tx.category} • ${formatDateLabel(tx.transaction_date)}`;

              return (
                <div
                  key={tx.id}
                  className="glass-pill-item rounded-2xl py-3 px-4 flex items-center justify-between group cursor-default transition-all duration-150"
                >
                  {/* Left Icon & Text */}
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div className="w-10 h-10 rounded-xl bg-white/90 border border-white flex items-center justify-center text-text-secondary shrink-0 shadow-2xs">
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-text-primary tracking-tight truncate group-hover:text-primary-dark transition-colors">
                        {title}
                      </h4>
                      <p className="text-[11px] font-semibold text-text-secondary mt-0.5 truncate">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Right Amount with + or - */}
                  <span
                    className={`text-sm sm:text-base font-extrabold tracking-tight shrink-0 ${
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
