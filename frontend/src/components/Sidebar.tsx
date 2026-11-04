import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
  TrendingDown,
  Settings,
  LogOut,
  X,
  Wallet,
} from 'lucide-react';
import logoImg from '../assets/logo.jpg';

export type NavTab = 'dashboard' | 'transactions' | 'income' | 'expenses' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as NavTab, label: 'Transactions', icon: ReceiptText },
    { id: 'income' as NavTab, label: 'Income', icon: TrendingUp },
    { id: 'expenses' as NavTab, label: 'Expenses', icon: TrendingDown },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const handleSelect = (tab: NavTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-900/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Branding */}
        <div>
          <div className="h-18 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="SmartSpend Logo"
                className="h-9 w-auto object-contain rounded-md"
              />
              <div>
                <span className="text-base font-bold tracking-tight text-charcoal-900 block leading-tight">
                  Smart<span className="text-[#00A896]">Spend</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400 block tracking-wide">
                  Expense Tracker
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-charcoal-700 hover:bg-slate-100 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-100/90 text-[#00A896] font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-charcoal-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors ${
                      isActive ? 'text-[#00A896]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Sign out */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-50/60">
            <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary-dark font-semibold text-sm border border-emerald-100">
              C
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-charcoal-800 truncate leading-tight">
                Cedric
              </p>
              <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                Money Track
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Ready to sign out?')) {
                alert('Signed out successfully.');
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-expense hover:bg-rose-50/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

