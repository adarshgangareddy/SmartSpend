import React, { useState, useEffect, useCallback } from 'react';
import { Menu, AlertCircle, RefreshCw, Bell } from 'lucide-react';
import { NavTab, Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { SettingsPage } from './components/SettingsPage';
import { TransactionModal } from './components/TransactionModal';
import { LandingPage } from './components/LandingPage';
import { AuthModal, AuthMode } from './components/AuthModal';
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

  /**
   * Check initial auth state & listen for recovery hash
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
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

    const { data: authListener } = authService.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthModal({ isOpen: true, mode: 'reset_password' });
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
        api.getTransactions(),
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

  // Loading Screen while checking initial auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Logo size="lg" />
          <div className="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin mt-4" />
        </div>
      </div>
    );
  }

  // PART 1: PUBLIC PRE-LOGIN LANDING PAGE
  if (!currentUser) {
    return (
      <>
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
      </>
    );
  }

  // PART 2: AUTHENTICATED DASHBOARD & APPLICATION
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Subtle Ambient Background Shapes */}
      <div className="fixed top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-[#E9DCF0] opacity-60 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-[#F7E1EA] opacity-50 blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] right-[25%] w-[400px] h-[400px] rounded-full bg-[#E5E0F2] opacity-45 blur-[120px] pointer-events-none" />

      {/* Floating Glass Sidebar (Desktop) */}
      <Sidebar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-200 pb-24 lg:pb-8">
        {/* Mobile Header Bar matching Reference */}
        <header className="lg:hidden h-16 glass-outer border-b border-white/60 px-5 flex items-center justify-between sticky top-0 z-30 m-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-text-secondary hover:bg-white/60 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Logo size="sm" showSubtitle={false} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              title="Refresh financial data"
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="w-8 h-8 rounded-full bg-white/70 border border-white flex items-center justify-center text-text-secondary">
              <Bell className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-7 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Connection Error Banner (displayed only when an actual error exists) */}
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
                currency={currency}
                onCurrencyChange={(newCurr) => {
                  setCurrency(newCurr);
                  setSummary((prev) => ({ ...prev, currency: newCurr }));
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar matching Reference */}
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
