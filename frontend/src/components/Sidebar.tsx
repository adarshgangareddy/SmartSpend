import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
  TrendingDown,
  Settings,
  LogOut,
  X,
  User,
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
          className="fixed inset-0 z-40 bg-[#302C49]/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Desktop & Mobile Fixed Glass Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 h-screen z-40 p-4 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sidebar-glass rounded-[32px] h-full flex flex-col justify-between p-6 shadow-sidebar border border-white/80 overflow-y-auto">
          <div>
            {/* Top Brand Logo */}
            <div className="flex items-center justify-between pb-6 border-b border-white/60 mb-6">
              <Logo size="md" />

              {/* Mobile close button */}
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/60 lg:hidden cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Clickable User Profile Area -> Navigates to /profile */}
            <button
              type="button"
              onClick={() => handleSelect('profile')}
              title="View & Edit Profile Dashboard"
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
                    {user?.email || 'View Profile'}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-text-secondary group-hover:text-text-primary transition-transform ${
                  activeTab === 'profile' ? 'rotate-90 text-primary' : 'group-hover:translate-x-0.5'
                }`}
              />
            </button>

            {/* Navigation Links with larger typography */}
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[16px] font-bold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'text-text-primary bg-white/85 shadow-glass border border-white/90'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/40 font-semibold'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        isActive ? 'text-primary' : 'text-text-secondary'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom: Sign out */}
          <div className="pt-4 border-t border-white/60 mt-auto">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-text-secondary hover:text-expense hover:bg-white/60 rounded-2xl transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
