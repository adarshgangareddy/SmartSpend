import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
  TrendingDown,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import logoImg from '../assets/logo_recolored.png';

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
    { id: 'income' as NavTab, label: 'Incomes', icon: TrendingUp },
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
          className="fixed inset-0 z-40 bg-[#252344]/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Floating Glass Sidebar */}
      <aside
        className={`fixed top-4 bottom-4 left-4 z-50 w-64 rounded-4xl sidebar-glass flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-glass-lg' : '-translate-x-[115%]'
        }`}
      >
        <div className="p-6">
          {/* Top Brand Logo */}
          <div className="flex items-center justify-between pb-6 border-b border-white/60 mb-6">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="SmartSpend Logo"
                className="h-10 w-auto object-contain drop-shadow-xs"
              />
            </div>
            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/60 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile matching reference (Cedric - Money Track) */}
          <div className="flex items-center gap-3.5 mb-8 px-2 py-1.5">
            <div className="relative w-12 h-12 rounded-full bg-linear-to-tr from-[#E6DEEE] to-white p-0.5 shadow-sm border border-white/80 shrink-0 flex items-center justify-center overflow-hidden">
              <span className="text-2xl select-none" role="img" aria-label="Avatar">
                👨🏻‍💼
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight truncate">
                Cedric
              </h3>
              <p className="text-xs text-text-secondary font-medium tracking-wide mt-0.5 truncate">
                Money Track
              </p>
            </div>
          </div>

          {/* Navigation Links with Reference-Matched Active Indicator */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full relative flex items-center gap-3.5 px-3 py-3 rounded-2xl text-[15px] transition-all duration-150 ${
                    isActive
                      ? 'text-text-primary font-bold bg-white/50 shadow-2xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/30 font-medium'
                  }`}
                >
                  {/* Left accent indicator bar like in reference image */}
                  {isActive && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-text-primary" />
                  )}

                  <Icon
                    className={`w-5 h-5 transition-colors ml-1 ${
                      isActive ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Sign out */}
        <div className="p-6 pt-3">
          <button
            onClick={() => {
              if (window.confirm('Ready to sign out?')) {
                alert('Signed out successfully.');
              }
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-text-secondary hover:text-expense transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
