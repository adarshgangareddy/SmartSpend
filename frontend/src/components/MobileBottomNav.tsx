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
  const itemDashboard: NavItem = { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard };
  const itemTransactions: NavItem = { id: 'transactions', label: 'Transactions', icon: ReceiptText };
  const itemIncome: NavItem = { id: 'income', label: 'Income', icon: TrendingUp };
  const itemExpenses: NavItem = { id: 'expenses', label: 'Expenses', icon: TrendingDown };
  const itemSettings: NavItem = { id: 'settings', label: 'Settings', icon: Settings };

  // Context-Aware Navigation strictly following the specification:
  // Shows ONLY the other available dashboards.
  // The active dashboard is excluded, and 'Dashboard' takes its slot!
  let leftItems: NavItem[] = [];
  let rightItems: NavItem[] = [];

  switch (activeTab) {
    case 'dashboard':
    case 'profile':
      // User on Dashboard or Profile:
      // Show [Transactions, Income] + Add + [Expenses, Settings]
      leftItems = [itemTransactions, itemIncome];
      rightItems = [itemExpenses, itemSettings];
      break;

    case 'transactions':
      // User on Transactions:
      // Transactions disappears, replaced by Dashboard
      // Show [Dashboard, Income] + Add + [Expenses, Settings]
      leftItems = [itemDashboard, itemIncome];
      rightItems = [itemExpenses, itemSettings];
      break;

    case 'income':
      // User on Income:
      // Income disappears, replaced by Dashboard
      // Show [Dashboard, Transactions] + Add + [Expenses, Settings]
      leftItems = [itemDashboard, itemTransactions];
      rightItems = [itemExpenses, itemSettings];
      break;

    case 'expenses':
      // User on Expenses:
      // Expenses disappears, replaced by Dashboard
      // Show [Dashboard, Transactions] + Add + [Income, Settings]
      leftItems = [itemDashboard, itemTransactions];
      rightItems = [itemIncome, itemSettings];
      break;

    case 'settings':
      // User on Settings:
      // Settings disappears, replaced by Dashboard
      // Show [Dashboard, Transactions] + Add + [Income, Expenses]
      leftItems = [itemDashboard, itemTransactions];
      rightItems = [itemIncome, itemExpenses];
      break;

    default:
      leftItems = [itemTransactions, itemIncome];
      rightItems = [itemExpenses, itemSettings];
      break;
  }

  return (
    <nav
      aria-label="Context-Aware Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2"
    >
      <div className="pointer-events-auto max-w-md mx-auto rounded-full px-3 py-1.5 flex items-center justify-between shadow-glass-lg border border-white/90 bg-white/90 backdrop-blur-2xl">
        {/* Left 2 Contextual Navigation Items */}
        {leftItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex-1 flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-1 text-text-secondary hover:text-text-primary transition-all duration-150 cursor-pointer"
            >
              <Icon className="w-5 h-5 text-text-secondary hover:text-primary transition-colors" />
              <span className="truncate max-w-[58px]">{item.label}</span>
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

        {/* Right 2 Contextual Navigation Items */}
        {rightItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex-1 flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-1 text-text-secondary hover:text-text-primary transition-all duration-150 cursor-pointer"
            >
              <Icon className="w-5 h-5 text-text-secondary hover:text-primary transition-colors" />
              <span className="truncate max-w-[58px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
