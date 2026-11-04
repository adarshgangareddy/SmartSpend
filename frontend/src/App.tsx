import React, { useState, useEffect, useCallback } from 'react';
import { Menu, AlertCircle, RefreshCw, Bell } from 'lucide-react';
import { NavTab, Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { SettingsPage } from './components/SettingsPage';
import { ProfileDashboard } from './components/ProfileDashboard';
import { TransactionModal } from './components/TransactionModal';
import { LandingPage } from './components/LandingPage';
import { AuthModal, AuthMode } from './components/AuthModal';
import { AuthCallback } from './components/AuthCallback';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Logo } from './components/Logo';
import { useNotification } from './components/NotificationToast';
import { FinancialSummary, Transaction, TransactionCreate, TransactionUpdate, ThemeId } from './types';
import { api } from './services/api';
import { authService, AuthUser } from './services/auth';

export const App: React.FC = () => {
  const { success, info, error } = useNotification();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: AuthMode;
  }>({
    isOpen: false,
    mode: 'login',
  });

  // Global Theme & Display Preferences
  const [activeTheme, setActiveTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('smartspend_theme') as ThemeId) || 'lavender-glass';
  });
  const [previewTheme, setPreviewTheme] = useState<ThemeId | null>(null);
  const [dateFormat, setDateFormat] = useState<string>('DD/MM/YYYY');

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Financial Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    total_income: 0,
    total_expenses: 0,
    balance: 0,
    currency: 'INR',
  });

  const [currency, setCurrency] = useState<string>('INR');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  // Check if current route is OAuth callback
  const isAuthCallback =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/auth/callback') ||
      window.location.search.includes('code='));

  // Sync theme with document root
  useEffect(() => {
    const effectiveTheme = previewTheme || activeTheme;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [activeTheme, previewTheme]);

  /**
   * Check initial auth state, listen for recovery hash & OAuth state transitions
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);

        // Fetch user profile from database to get preferred currency, theme, and date format
        if (user) {
          try {
            const profile = await api.getProfile();
            if (profile?.preferred_currency) {
              setCurrency(profile.preferred_currency);
            }
            if (profile?.theme) {
              setActiveTheme(profile.theme);
              localStorage.setItem('smartspend_theme', profile.theme);
            }
            if (profile?.date_format) {
              setDateFormat(profile.date_format);
            }
            if (profile?.full_name || profile?.avatar_url || profile?.bio) {
              setCurrentUser((prev) => ({
                ...prev!,
                fullName: profile.full_name || prev!.fullName,
                avatarUrl: profile.avatar_url || prev!.avatarUrl,
                bio: profile.bio || prev!.bio,
                phone: profile.phone || prev!.phone,
                location: profile.location || prev!.location,
                dob: profile.dob || prev!.dob,
              }));
            }
          } catch {
            // Profile migration fallback
          }
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    initAuth();

    // Check if recovery link was clicked
    if (
      window.location.hash.includes('type=recovery') ||
      window.location.hash.includes('reset-password')
    ) {
      setAuthModal({ isOpen: true, mode: 'reset_password' });
    }

    const { data: authListener } = authService.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthModal({ isOpen: true, mode: 'reset_password' });
      } else if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        const authUser: AuthUser = {
          id: u.id,
          email: u.email || '',
          fullName: meta.full_name || meta.name || u.email?.split('@')[0] || 'User',
          avatarUrl: meta.avatar_url || meta.picture,
          provider: session.user.app_metadata?.provider === 'google' ? 'google' : 'email',
        };
        setCurrentUser(authUser);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  /**
   * Load transactions and summary from backend
   */
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [txList, summaryData] = await Promise.all([
        api.getTransactions({ display_currency: currency }),
        api.getFinancialSummary(currency),
      ]);
      setTransactions(txList);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Failed to load financial data:', err);
      setErrorMessage(
        err.message || 'Unable to connect to SmartSpend backend service.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currency]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  // Auth Handlers
  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setActiveTab('dashboard');
    info('Signed out successfully.');
  };

  // Theme Handlers
  const handleApplyTheme = async (theme: ThemeId) => {
    setActiveTheme(theme);
    setPreviewTheme(null);
    localStorage.setItem('smartspend_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    try {
      await api.updateProfile({ theme });
      success('Theme applied successfully.');
    } catch {
      info('Theme applied locally.');
    }
  };

  // Transaction Modal Handlers
  const handleOpenAddModal = () => {
    setTransactionToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: TransactionCreate | TransactionUpdate) => {
    try {
      if (transactionToEdit) {
        await api.updateTransaction(transactionToEdit.id, data as TransactionUpdate);
        success('Transaction updated successfully.');
      } else {
        await api.createTransaction(data as TransactionCreate);
        success('Transaction added successfully.');
      }
      await loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save transaction.');
      throw err;
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await api.deleteTransaction(id);
      info('Transaction deleted.');
      await loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete transaction.');
    }
  };

  // 1. OAUTH CALLBACK ROUTE (/auth/callback)
  if (isAuthCallback) {
    return (
      <div data-theme={activeTheme}>
        <AuthCallback
          onSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('dashboard');
            success(`Welcome back, ${user.fullName}!`);
          }}
          onFailure={(msg) => {
            error(msg || 'Google sign-in could not be completed.');
            setAuthModal({ isOpen: true, mode: 'login' });
          }}
        />
      </div>
    );
  }

  // 2. Loading Screen while checking initial auth
  if (isCheckingAuth) {
    return (
      <div data-theme={activeTheme} className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <div className="w-7 h-7 border-3 border-primary/40 border-t-primary rounded-full animate-spin mt-4" />
        </div>
      </div>
    );
  }

  // 3. PUBLIC PRE-LOGIN LANDING PAGE
  if (!currentUser) {
    return (
      <div data-theme={activeTheme}>
        <LandingPage
          onOpenLogin={() => setAuthModal({ isOpen: true, mode: 'login' })}
          onOpenSignup={() => setAuthModal({ isOpen: true, mode: 'signup' })}
        />
        <AuthModal
          isOpen={authModal.isOpen}
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ ...authModal, isOpen: false })}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // 4. AUTHENTICATED DASHBOARD & APPLICATION
  return (
    <div
      data-theme={previewTheme || activeTheme}
      className="min-h-screen relative overflow-x-hidden bg-background text-text-primary transition-colors duration-300"
    >
      {/* Subtle Ambient Background Shapes */}
      <div className="fixed top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-[#E9DCF0] opacity-40 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-[#F7E1EA] opacity-35 blur-[140px] pointer-events-none" />

      {/* Desktop & Mobile Fixed Glass Sidebar */}
      <Sidebar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area: Fixed desktop sidebar left padding, bottom padding for mobile safe nav */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-200 pb-36 lg:pb-8">
        {/* Mobile Single-Row Header Bar */}
        <header className="lg:hidden h-16 glass-outer border-b border-white/60 px-4 sm:px-5 flex items-center justify-between sticky top-0 z-30 m-3 sm:m-4 rounded-3xl shadow-glass">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-text-secondary hover:bg-white/60 transition-colors cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Logo size="sm" showSubtitle={false} />
          </div>

          {/* Right: Refresh + Bell + Profile Avatar Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refresh financial data"
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="w-8 h-8 rounded-full bg-white/70 border border-white flex items-center justify-center text-text-secondary shadow-2xs">
              <Bell className="w-4 h-4" />
            </div>
            <button
              onClick={() => setActiveTab('profile')}
              title="Open Profile"
              className="w-8 h-8 rounded-full bg-linear-to-tr from-[#E7DFEE] to-white p-0.5 border border-white/90 shadow-2xs flex items-center justify-center overflow-hidden cursor-pointer"
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-xs font-black text-primary">
                  {(currentUser?.fullName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-7 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Connection Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-3xl bg-expense-light/90 border border-expense/30 backdrop-blur-md flex items-start justify-between gap-3 text-xs text-expense shadow-sm">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-expense shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Connection Notice</p>
                  <p className="mt-0.5 font-medium">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={loadData}
                className="font-bold underline shrink-0 hover:opacity-80 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Master Outer Glass Frame */}
          <div className="glass-outer rounded-[36px] sm:rounded-[40px] p-5 sm:p-7 lg:p-8">
            {/* Active Tab Router View */}
            {activeTab === 'dashboard' && (
              <Dashboard
                user={currentUser}
                summary={summary}
                transactions={transactions}
                onAddTransaction={handleOpenAddModal}
                onViewAllTransactions={() => setActiveTab('transactions')}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileDashboard
                user={currentUser}
                onProfileUpdate={(updated) => {
                  setCurrentUser(updated);
                }}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsPage
                transactions={transactions}
                onAddTransaction={handleOpenAddModal}
                onEditTransaction={handleOpenEditModal}
                onDeleteTransaction={handleDeleteTransaction}
                currency={currency}
              />
            )}

            {activeTab === 'income' && (
              <TransactionsPage
                transactions={transactions}
                onAddTransaction={handleOpenAddModal}
                onEditTransaction={handleOpenEditModal}
                onDeleteTransaction={handleDeleteTransaction}
                currency={currency}
                initialTypeFilter="income"
              />
            )}

            {activeTab === 'expenses' && (
              <TransactionsPage
                transactions={transactions}
                onAddTransaction={handleOpenAddModal}
                onEditTransaction={handleOpenEditModal}
                onDeleteTransaction={handleDeleteTransaction}
                currency={currency}
                initialTypeFilter="expense"
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                user={currentUser}
                currency={currency}
                onCurrencyChange={(newCurr) => {
                  setCurrency(newCurr);
                  setSummary((prev) => ({ ...prev, currency: newCurr }));
                }}
                activeTheme={activeTheme}
                previewTheme={previewTheme}
                onPreviewTheme={(th) => {
                  setPreviewTheme(th);
                }}
                onApplyTheme={handleApplyTheme}
                dateFormat={dateFormat}
                onDateFormatChange={(fmt) => setDateFormat(fmt)}
                onSignOut={handleSignOut}
              />
            )}
          </div>
        </main>
      </div>

      {/* Context-Aware Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* Create / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        transactionToEdit={transactionToEdit}
      />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default App;
