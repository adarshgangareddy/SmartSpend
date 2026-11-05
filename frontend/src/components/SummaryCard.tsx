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
    <div className="glass-box glass-box-hover rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 flex items-center gap-3 sm:gap-4 transition-all duration-200">
      {/* Icon Badge */}
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-13 lg:h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${getBadgeStyle()}`}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
      </div>

      {/* Title & Scaled Amount */}
      <div className="min-w-0 flex-1">
        <span className="text-[10px] sm:text-xs font-bold text-text-secondary tracking-wide block uppercase truncate">
          {title}
        </span>
        <div className="text-lg xs:text-xl sm:text-xl md:text-2xl lg:text-[28px] font-black text-text-primary tracking-tight mt-0.5 truncate">
          {formatAmount(amount, currency)}
        </div>
      </div>
    </div>
  );
};
