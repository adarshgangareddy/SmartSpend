import React from 'react';

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
  const iconSize = size === 'sm' ? 26 : size === 'lg' ? 38 : 32;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Wallet Icon matching reference */}
      <div className="shrink-0 relative flex items-center justify-center">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#302C49] drop-shadow-2xs"
        >
          {/* Outer Rounded Wallet Body */}
          <rect
            x="3"
            y="7"
            width="30"
            height="22"
            rx="6.5"
            stroke="currentColor"
            strokeWidth="2.8"
            fill="none"
          />
          {/* Inner Card Top Edge */}
          <path
            d="M8 7V5.5C8 4.11929 9.11929 3 10.5 3H25.5C26.8807 3 28 4.11929 28 5.5V7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Wallet Flap with Clasp */}
          <path
            d="M21 14H30C31.6569 14 33 15.3431 33 17V20C33 21.6569 31.6569 23 30 23H21C19.3431 23 18 21.6569 18 20V17C18 15.3431 19.3431 14 21 14Z"
            stroke="currentColor"
            strokeWidth="2.4"
            fill="rgba(243, 237, 244, 0.9)"
          />
          {/* Clasp button */}
          <circle cx="23.5" cy="18.5" r="1.5" fill="currentColor" />
        </svg>
      </div>

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

