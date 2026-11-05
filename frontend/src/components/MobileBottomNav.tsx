import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
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

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  // Static, permanent navigation items that NEVER change their positions or labels
  const leftItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  ];

  const rightItems: NavItem[] = [
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Fixed Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-2.5 sm:px-4 pb-[max(0.6rem,calc(env(safe-area-inset-bottom,0px)+0.4rem))] pt-1"
    >
      <div className="pointer-events-auto w-full max-w-md mx-auto rounded-full px-1.5 sm:px-3 py-1 flex items-center justify-between shadow-glass-lg border border-white/90 bg-white/92 backdrop-blur-2xl">
        {/* Left Permanent Navigation Items */}
        {leftItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 transition-all duration-150 cursor-pointer min-h-[44px] ${
                isActive
                  ? 'text-primary font-black scale-102'
                  : 'text-text-secondary hover:text-text-primary font-bold'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-colors ${
                  isActive ? 'text-primary stroke-[2.6]' : 'text-text-secondary stroke-[2]'
                }`}
              />
              <span className="text-[9px] sm:text-[10px] truncate max-w-[56px] sm:max-w-[68px] leading-tight mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Prominent Floating Central Add Button */}
        <button
          onClick={onOpenAddModal}
          title="Add Transaction"
          aria-label="Add Transaction"
          className="w-11 h-11 sm:w-12 sm:h-12 -mt-4 sm:-mt-5 mx-1 rounded-full bg-primary hover:bg-primary-dark text-white shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.8]" />
        </button>

        {/* Right Permanent Navigation Items */}
        {rightItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 transition-all duration-150 cursor-pointer min-h-[44px] ${
                isActive
                  ? 'text-primary font-black scale-102'
                  : 'text-text-secondary hover:text-text-primary font-bold'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-colors ${
                  isActive ? 'text-primary stroke-[2.6]' : 'text-text-secondary stroke-[2]'
                }`}
              />
              <span className="text-[9px] sm:text-[10px] truncate max-w-[56px] sm:max-w-[68px] leading-tight mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
