import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatAmount } from '../utils/formatters';

interface SummaryCardProps {
  title: string;
  amount: number;
  currency?: string;
  icon: LucideIcon;
  variant?: 'balance' | 'income' | 'expense';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  currency = 'INR',
  icon: Icon,
  variant = 'balance',
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'income':
        return 'bg-[#EBF5EA] text-income';
      case 'expense':
        return 'bg-[#FBEFEF] text-expense';
      case 'balance':
      default:
        return 'bg-[#F0EBF5] text-primary';
    }
  };

  return (
    <div className="glass-box glass-box-hover rounded-[26px] p-5 sm:p-6 flex items-center gap-4 transition-all duration-200">
      {/* Icon Badge matching Reference Image */}
      <div
        className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${getBadgeStyle()}`}
      >
        <Icon className="w-6 h-6 stroke-[2.2]" />
      </div>

      {/* Title & Large Amount */}
      <div className="min-w-0">
        <span className="text-xs sm:text-sm font-bold text-text-secondary tracking-wide block">
          {title}
        </span>
        <div className="text-2xl sm:text-3xl lg:text-[32px] font-black text-text-primary tracking-tight mt-0.5 truncate">
          {formatAmount(amount, currency)}
        </div>
      </div>
    </div>
  );
};
