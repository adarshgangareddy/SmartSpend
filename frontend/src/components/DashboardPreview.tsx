import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Briefcase,
  ShoppingCart,
  Car,
  Laptop,
} from 'lucide-react';

export const DashboardPreview: React.FC = () => {
  return (
    <div className="relative w-full max-w-lg mx-auto select-none pointer-events-none transform hover:scale-[1.01] transition-transform duration-300">
      {/* Outer master glass preview container */}
      <div className="glass-outer rounded-[32px] sm:rounded-[36px] p-5 sm:p-6 shadow-glass-lg border border-white/90 bg-white/60 backdrop-blur-xl">
        {/* Mini Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary leading-none">
                SmartSpend
              </div>
              <div className="text-[9px] text-text-secondary font-medium">
                Overview Preview
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-text-secondary bg-white/70 px-2.5 py-1 rounded-full border border-white">
              Nov 2026
            </span>
            <span className="text-[10px] font-bold text-white bg-primary px-2.5 py-1 rounded-full shadow-2xs">
              + Add
            </span>
          </div>
        </div>

        {/* Mini Greeting */}
        <div className="mb-3 px-1">
          <div className="text-sm font-extrabold text-text-primary">
            Good morning, Demo 👋
          </div>
          <div className="text-[10px] text-text-secondary font-medium">
            Here's your illustrative financial overview.
          </div>
        </div>

        {/* Mini 3 Summary Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4">
          <div className="glass-box rounded-2xl p-2.5 sm:p-3 border border-white/90">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-lg bg-[#F0EBF5] text-primary flex items-center justify-center">
                <Wallet className="w-3 h-3" />
              </div>
              <span className="text-[9px] font-semibold text-text-secondary">Balance</span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-text-primary">
              ₹24,580
            </div>
          </div>

          <div className="glass-box rounded-2xl p-2.5 sm:p-3 border border-white/90">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-lg bg-[#EBF5EA] text-income flex items-center justify-center">
                <TrendingUp className="w-3 h-3" />
              </div>
              <span className="text-[9px] font-semibold text-text-secondary">Income</span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-text-primary">
              ₹32,000
            </div>
          </div>

          <div className="glass-box rounded-2xl p-2.5 sm:p-3 border border-white/90">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-lg bg-[#FBEFEF] text-expense flex items-center justify-center">
                <TrendingDown className="w-3 h-3" />
              </div>
              <span className="text-[9px] font-semibold text-text-secondary">Expenses</span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-text-primary">
              ₹7,420
            </div>
          </div>
        </div>

        {/* Mini 2 Column Split (Mini Chart + Mini Transactions) */}
        <div className="grid grid-cols-12 gap-3 items-center">
          {/* Mini Monthly Overview Chart */}
          <div className="col-span-7 glass-box rounded-2xl p-3 border border-white/90">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-text-primary">
                Monthly Overview
              </span>
              <div className="flex items-center gap-1.5 text-[8px] font-medium text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-income inline-block" />
                <span>In</span>
                <span className="w-1.5 h-1.5 rounded-full bg-expense inline-block ml-1" />
                <span>Ex</span>
              </div>
            </div>

            {/* SVG Wave illustrative graphic */}
            <div className="h-20 w-full relative">
              <svg
                viewBox="0 0 200 80"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Income wave + fill */}
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7A9B72" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#7A9B72" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 50 Q30 45 60 48 T120 28 T170 35 T200 15 L200 80 L0 80 Z"
                  fill="url(#incomeGrad)"
                />
                <path
                  d="M0 50 Q30 45 60 48 T120 28 T170 35 T200 15"
                  fill="none"
                  stroke="#7A9B72"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="200" cy="15" r="3" fill="#7A9B72" stroke="#fff" strokeWidth="1.5" />
                <circle cx="120" cy="28" r="3" fill="#7A9B72" stroke="#fff" strokeWidth="1.5" />

                {/* Expense wave */}
                <path
                  d="M0 65 Q40 68 80 62 T140 60 T200 55"
                  fill="none"
                  stroke="#C96F70"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="200" cy="55" r="3" fill="#C96F70" stroke="#fff" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex justify-between text-[8px] text-text-muted mt-1 px-1 font-semibold">
              <span>Jun</span>
              <span>Aug</span>
              <span>Oct</span>
              <span>Nov</span>
            </div>
          </div>

          {/* Mini Recent Transactions */}
          <div className="col-span-5 space-y-1.5">
            <div className="glass-pill-item rounded-xl p-2 flex items-center justify-between text-[9px]">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-text-secondary" />
                <span className="font-bold text-text-primary">Salary</span>
              </div>
              <span className="font-extrabold text-income">+₹28k</span>
            </div>

            <div className="glass-pill-item rounded-xl p-2 flex items-center justify-between text-[9px]">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="w-3 h-3 text-text-secondary" />
                <span className="font-bold text-text-primary">Groceries</span>
              </div>
              <span className="font-extrabold text-expense">-₹850</span>
            </div>

            <div className="glass-pill-item rounded-xl p-2 flex items-center justify-between text-[9px]">
              <div className="flex items-center gap-1.5">
                <Car className="w-3 h-3 text-text-secondary" />
                <span className="font-bold text-text-primary">Transport</span>
              </div>
              <span className="font-extrabold text-expense">-₹320</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

