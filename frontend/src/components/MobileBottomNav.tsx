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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2"
    >
      <div className="pointer-events-auto max-w-md mx-auto rounded-full px-3 py-1.5 flex items-center justify-between shadow-glass-lg border border-white/90 bg-white/90 backdrop-blur-2xl">
        {/* Left Permanent Navigation Items */}
        {leftItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'text-primary font-black scale-105'
                  : 'text-text-secondary hover:text-text-primary font-bold'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-primary stroke-[2.6]' : 'text-text-secondary stroke-[2]'
                }`}
              />
              <span className="text-[10px] truncate max-w-[68px]">{item.label}</span>
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
          className="w-12 h-12 -mt-5 mx-1.5 rounded-full bg-primary hover:bg-primary-dark text-white shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
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
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 px-1 transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'text-primary font-black scale-105'
                  : 'text-text-secondary hover:text-text-primary font-bold'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-primary stroke-[2.6]' : 'text-text-secondary stroke-[2]'
                }`}
              />
              <span className="text-[10px] truncate max-w-[68px]">{item.label}</span>
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
