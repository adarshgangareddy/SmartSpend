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
import { Logo } from './Logo';
import { AuthUser } from '../services/auth';

export type NavTab = 'dashboard' | 'transactions' | 'income' | 'expenses' | 'settings';

interface SidebarProps {
  user: AuthUser | null;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
  onSignOut,
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

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-[#302C49]/25 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Floating Glass Sidebar */}
      <aside
        className={`fixed top-4 bottom-4 left-4 z-50 w-64 rounded-[32px] sidebar-glass flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-glass-lg' : '-translate-x-[115%]'
        }`}
      >
        <div className="p-6">
          {/* Top Brand Logo */}
          <div className="flex items-center justify-between pb-6 border-b border-white/60 mb-6">
            <Logo size="md" />

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/60 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile matching reference */}
          <div className="flex items-center gap-3.5 mb-8 px-2 py-1.5">
            <div className="w-11 h-11 rounded-full bg-linear-to-tr from-[#E7DFEE] to-white p-0.5 shadow-2xs border border-white/90 shrink-0 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-base font-black text-primary select-none">
                  {initialLetter}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-text-primary tracking-tight leading-tight truncate">
                {displayName}
              </h3>
              <p className="text-xs text-text-secondary font-semibold tracking-wide mt-0.5 truncate">
                {user?.email || 'My Account'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'text-text-primary bg-white/70 shadow-2xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/35 font-semibold'
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors ${
                      isActive ? 'text-primary-dark' : 'text-text-secondary'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Sign out */}
        <div className="p-6 pt-3 border-t border-white/60">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-text-secondary hover:text-expense hover:bg-white/40 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
