import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
  TrendingDown,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Logo } from './Logo';
import { AuthUser } from '../services/auth';

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'income'
  | 'expenses'
  | 'settings'
  | 'profile';

interface SidebarProps {
  user: AuthUser | null;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onTabChange,
  onSignOut,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as NavTab, label: 'Transactions', icon: ReceiptText },
    { id: 'income' as NavTab, label: 'Income', icon: TrendingUp },
    { id: 'expenses' as NavTab, label: 'Expenses', icon: TrendingDown },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-72 h-screen z-40 p-4">
      <div className="sidebar-glass rounded-[32px] w-full h-full flex flex-col justify-between p-6 shadow-sidebar border border-white/80 overflow-y-auto">
        <div>
          {/* Top Brand Logo */}
          <div className="flex items-center justify-between pb-6 border-b border-white/60 mb-6">
            <Logo size="md" />
          </div>

          {/* Clickable User Profile Area -> Navigates to /profile */}
          <button
            type="button"
            onClick={() => onTabChange('profile')}
            title="View & Edit Profile"
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-150 mb-7 text-left group cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white/90 shadow-glass border border-white'
                : 'bg-white/50 hover:bg-white/80 border border-white/60'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-linear-to-tr from-[#E7DFEE] to-white p-0.5 shadow-2xs border border-white/90 shrink-0 flex items-center justify-center overflow-hidden">
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
                  <span className="text-lg font-black text-primary select-none">
                    {initialLetter}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight leading-tight truncate">
                  {displayName}
                </h3>
                <p className="text-xs text-text-secondary font-semibold tracking-wide mt-0.5 truncate">
                  {user?.email || 'Personal Account'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-secondary group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white/90 text-text-primary shadow-glass border border-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/50 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 stroke-[2.2] ${
                      isActive ? 'text-primary' : 'text-text-secondary'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Sign Out */}
        <div className="pt-4 border-t border-white/60">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-xs text-text-secondary hover:text-expense hover:bg-expense-light/60 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
