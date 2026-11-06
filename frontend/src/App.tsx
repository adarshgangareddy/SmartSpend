import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, Bell, User, LogOut } from 'lucide-react';
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
import { FinancialSummary, Transaction, TransactionCreate, TransactionUpdate } from './types';
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

  // Display Preferences
  const [dateFormat, setDateFormat] = useState<string>('DD/MM/YYYY');

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

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

  // Check if current route is OAuth / verification callback
  const isAuthCallback =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/auth/callback') ||
      window.location.search.includes('code=') ||
      window.location.search.includes('type=confirm_password_change') ||
      window.location.hash.includes('access_token=') ||
      window.location.hash.includes('type=signup') ||
      window.location.hash.includes('type=recovery'));

  /**
   * Check initial auth state, listen for recovery hash & OAuth state transitions
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);

        // Fetch user profile from database to get preferred currency and date format
        if (user) {
          try {
            const profile = await api.getProfile();
            if (profile?.preferred_currency) {
              setCurrency(profile.preferred_currency);
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

    // Listen for automatic session expiration from API calls
    const handleSessionExpired = () => {
      authService.signOut();
      setCurrentUser(null);
      setActiveTab('dashboard');
      error('Your session has expired. Please sign in again.');
    };
    window.addEventListener('smartspend:session_expired', handleSessionExpired);

    return () => {
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('smartspend:session_expired', handleSessionExpired);
    };
  }, [error]);

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
      const isAuthError =
        err.message?.includes('session expired') ||
        err.message?.includes('Authentication required') ||
        err.message?.includes('401');
      if (isAuthError) {
        await authService.signOut();
        setCurrentUser(null);
        setActiveTab('dashboard');
        error('Your session has expired. Please sign in again.');
      } else {
        setErrorMessage(
          err.message || 'Unable to connect to SmartSpend backend service.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currency, error]);

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
      <div>
        <AuthCallback
          onSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('dashboard');
            success(`Welcome back, ${user.fullName}!`);
          }}
          onFailure={(msg) => {
            error(msg || 'Authentication could not be completed.');
          }}
          onPasswordRecovery={() => {
            window.history.replaceState(null, '', '/');
            setAuthModal({ isOpen: true, mode: 'reset_password' });
          }}
        />
      </div>
    );
  }

  // 2. Loading Screen while checking initial auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
      <div>
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
    <div className="min-h-screen relative overflow-x-hidden bg-background text-text-primary transition-colors duration-300">
      {/* Subtle Ambient Background Shapes */}
      <div className="fixed top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-[#E9DCF0] opacity-40 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-[#F7E1EA] opacity-35 blur-[140px] pointer-events-none" />

      {/* Desktop Fixed Glass Sidebar (Hidden on mobile) */}
      <Sidebar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area: Fixed desktop sidebar left padding, top & bottom padding for mobile safe nav */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-200 pt-16 sm:pt-20 lg:pt-0 pb-32 sm:pb-36 lg:pb-8">
        {/* Mobile Fixed Top Navbar: Sticky/Fixed with backdrop blur & No Hamburger Menu */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 sm:h-16 bg-white/85 backdrop-blur-xl border-b border-white/80 shadow-xs px-3 sm:px-6 flex items-center justify-between">
          {/* Left: Original Brand Logo (Clicking redirects to Dashboard) */}
          <div className="flex items-center min-w-0 pr-2">
            <Logo
              size="sm"
              showSubtitle={true}
              onClick={() => setActiveTab('dashboard')}
            />
          </div>

          {/* Right: Refresh + Bell + Profile Avatar Button + Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={loadData}
              title="Refresh financial data"
              aria-label="Refresh financial data"
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="hidden sm:flex w-8 h-8 rounded-full bg-white/70 border border-white items-center justify-center text-text-secondary shadow-2xs">
              <Bell className="w-4 h-4" />
            </div>
            {/* Visible Profile Avatar Button */}
            <button
              onClick={() => setActiveTab('profile')}
              title="Open Profile"
              aria-label="Open Profile"
              className={`w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full flex items-center justify-center transition-all cursor-pointer overflow-hidden ${
                activeTab === 'profile'
                  ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-white shadow-sm'
                  : 'bg-[#EAE4F2] text-primary hover:bg-[#DDD5E8] border-2 border-white shadow-2xs'
              }`}
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-4 h-4 stroke-[2.2]" />
              )}
            </button>
            {/* Mobile Header Logout Button */}
            <button
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 rounded-xl text-text-secondary hover:text-expense hover:bg-expense-light/80 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-expense stroke-[2.2]" />
            </button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Connection Error Banner */}
          {errorMessage && (
            <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-expense-light/90 border border-expense/30 backdrop-blur-md flex items-start justify-between gap-3 text-xs text-expense shadow-sm">
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
          <div className="glass-outer rounded-[26px] sm:rounded-[36px] lg:rounded-[40px] p-3.5 sm:p-6 lg:p-8">
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
                dateFormat={dateFormat}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileDashboard
                user={currentUser}
                onProfileUpdate={(updated) => {
                  setCurrentUser(updated);
                }}
                onBackToDashboard={() => setActiveTab('dashboard')}
                onSignOut={handleSignOut}
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
                dateFormat={dateFormat}
                onDateFormatChange={(fmt) => setDateFormat(fmt)}
                transactions={transactions}
                summary={summary}
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
        defaultCurrency={currency}
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
