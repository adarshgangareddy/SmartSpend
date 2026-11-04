import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatAmount } from '../utils/formatters';

interface SummaryCardProps {
  title: string;
  amount: number;
  currency?: string;
  icon?: LucideIcon;
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
  return (
    <div className="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between transition-all duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-text-primary tracking-tight">
          {title}
        </h3>
        {Icon && (
          <div
            className={`p-2 rounded-xl text-xs ${
              variant === 'income'
                ? 'bg-income-light text-income'
                : variant === 'expense'
                ? 'bg-expense-light text-expense'
                : 'bg-primary-light/60 text-primary-dark'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
          {formatAmount(amount, currency)}
        </div>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
