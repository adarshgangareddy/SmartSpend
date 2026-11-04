import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
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
    <div className="lg:hidden fixed bottom-3 left-4 right-4 z-40">
      <div className="glass-outer rounded-full px-4 py-2 flex items-center justify-between shadow-glass-lg border border-white/90 bg-white/80 backdrop-blur-xl">
        {/* Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-2.5 transition-colors ${
            activeTab === 'dashboard' ? 'text-primary-dark' : 'text-text-secondary'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        {/* Transactions */}
        <button
          onClick={() => onTabChange('transactions')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-2.5 transition-colors ${
            activeTab === 'transactions' ? 'text-primary-dark' : 'text-text-secondary'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span>Transactions</span>
        </button>

        {/* Central Floating Add Button matching reference */}
        <button
          onClick={onOpenAddModal}
          title="Add Transaction"
          className="w-11 h-11 -mt-5 rounded-full bg-primary hover:bg-[#83769D] text-white shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.8]" />
        </button>

        {/* Income */}
        <button
          onClick={() => onTabChange('income')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-2.5 transition-colors ${
            activeTab === 'income' ? 'text-primary-dark' : 'text-text-secondary'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>Income</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-2.5 transition-colors ${
            activeTab === 'settings' ? 'text-primary-dark' : 'text-text-secondary'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
