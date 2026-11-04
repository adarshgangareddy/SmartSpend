import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
  TrendingDown,
  Settings,
  Plus,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2"
    >
      <div className="pointer-events-auto max-w-md mx-auto glass-outer rounded-full px-2 py-1.5 flex items-center justify-between shadow-glass-lg border border-white/90 bg-white/90 backdrop-blur-2xl">
        {/* Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[9px] sm:text-[10px] font-bold py-1 px-1.5 transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'text-primary-dark font-extrabold' : 'text-text-secondary'
          }`}
        >
          <LayoutDashboard className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          <span>Dash</span>
        </button>

        {/* Transactions */}
        <button
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center gap-0.5 text-[9px] sm:text-[10px] font-bold py-1 px-1.5 transition-colors cursor-pointer ${
            activeTab === 'transactions' ? 'text-primary-dark font-extrabold' : 'text-text-secondary'
          }`}
        >
          <ReceiptText className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          <span>Txns</span>
        </button>

        {/* Income */}
        <button
          onClick={() => onTabChange('income')}
          className={`flex flex-col items-center gap-0.5 text-[9px] sm:text-[10px] font-bold py-1 px-1.5 transition-colors cursor-pointer ${
            activeTab === 'income' ? 'text-primary-dark font-extrabold' : 'text-text-secondary'
          }`}
        >
          <TrendingUp className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          <span>Income</span>
        </button>

        {/* Prominent Floating Add Transaction Button */}
        <button
          onClick={onOpenAddModal}
          title="Add Transaction"
          className="w-10 h-10 sm:w-11 sm:h-11 -mt-4 rounded-full bg-primary hover:bg-[#83769D] text-white shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.8]" />
        </button>

        {/* Expenses */}
        <button
          onClick={() => onTabChange('expenses')}
          className={`flex flex-col items-center gap-0.5 text-[9px] sm:text-[10px] font-bold py-1 px-1.5 transition-colors cursor-pointer ${
            activeTab === 'expenses' ? 'text-primary-dark font-extrabold' : 'text-text-secondary'
          }`}
        >
          <TrendingDown className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          <span>Expense</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center gap-0.5 text-[9px] sm:text-[10px] font-bold py-1 px-1.5 transition-colors cursor-pointer ${
            activeTab === 'settings' ? 'text-primary-dark font-extrabold' : 'text-text-secondary'
          }`}
        >
          <Settings className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
};
