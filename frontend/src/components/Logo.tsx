import React from 'react';
import logoSymbol from '../assets/logo_symbol.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconHeight = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-11' : 'h-9';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Original SmartSpend Logo Emblem */}
      <img
        src={logoSymbol}
        alt="SmartSpend Logo"
        className={`${iconHeight} w-auto object-contain shrink-0 drop-shadow-xs`}
      />

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <span
          className={`font-black text-[#302C49] tracking-tight ${
            size === 'sm'
              ? 'text-base'
              : size === 'lg'
              ? 'text-2xl font-extrabold'
              : 'text-lg sm:text-xl font-bold'
          }`}
        >
          SmartSpend
        </span>
        {showSubtitle && (
          <span
            className={`font-semibold text-[#77718B] tracking-wide ${
              size === 'sm' ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'
            }`}
          >
            Personal Expense Tracker
          </span>
        )}
      </div>
    </div>
  );
};
