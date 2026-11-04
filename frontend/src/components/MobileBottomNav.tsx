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
  // All available navigation items in canonical order
  const allNavItems = [
    { id: 'dashboard' as NavTab, label: 'Dash', icon: LayoutDashboard },
    { id: 'transactions' as NavTab, label: 'Txns', icon: ReceiptText },
    { id: 'income' as NavTab, label: 'Income', icon: TrendingUp },
    { id: 'expenses' as NavTab, label: 'Expense', icon: TrendingDown },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  // Context-Aware Navigation:
  // Hide the currently active tab from bottom navigation so screen space is utilized intelligently!
  // If viewing 'profile', display the 4 core sections.
  const visibleItems =
    activeTab === 'profile'
      ? allNavItems.slice(0, 4)
      : allNavItems.filter((item) => item.id !== activeTab);

  // Balanced around the prominent central Add button: 2 on the left, 2 on the right
  const leftItems = visibleItems.slice(0, 2);
  const rightItems = visibleItems.slice(2, 4);

  return (
    <nav
      aria-label="Context-Aware Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2"
    >
      <div className="pointer-events-auto max-w-sm mx-auto glass-outer rounded-full px-3 py-1.5 flex items-center justify-between shadow-glass-lg border border-white/90 bg-white/90 backdrop-blur-2xl">
        {/* Left 2 Contextual Navigation Tabs */}
        {leftItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex-1 flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Prominent Floating Central Add Button */}
        <button
          onClick={onOpenAddModal}
          title="Add Transaction"
          className="w-11 h-11 -mt-5 mx-1 rounded-full bg-primary hover:bg-primary-dark text-white shadow-md flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.8]" />
        </button>

        {/* Right 2 Contextual Navigation Tabs */}
        {rightItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex-1 flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
