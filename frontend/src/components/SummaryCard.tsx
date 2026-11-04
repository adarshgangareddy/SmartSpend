import React from 'react';
import { LucideIcon } from 'lucide-react';
import { getCurrencySymbol } from '../utils/formatters';

interface SummaryCardProps {
  title: string;
  amount: number;
  currency?: string;
  icon: LucideIcon;
  variant?: 'income' | 'expense' | 'balance';
  subtitle?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  currency = 'INR',
  icon: Icon,
  variant = 'balance',
  subtitle,
}) => {
  // Format currency value cleanly
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);

  const variantStyles = {
    income: {
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      badge: 'text-emerald-700 bg-emerald-50/80',
    },
    expense: {
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      badge: 'text-rose-700 bg-rose-50/80',
    },
    balance: {
      iconBg: 'bg-slate-50 text-slate-700 border border-slate-150',
      badge: 'text-slate-700 bg-slate-150',
    },
  }[variant];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-all duration-150 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${variantStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-semibold text-slate-400">
            {getCurrencySymbol(currency)}
          </span>
          <span className="text-2xl lg:text-3xl font-bold tracking-tight text-charcoal-900">
            {formattedAmount}
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

