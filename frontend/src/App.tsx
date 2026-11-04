import React, { useState, useEffect, useCallback } from 'react';
import { Menu, AlertCircle, RefreshCw } from 'lucide-react';
import { NavTab, Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { SettingsPage } from './components/SettingsPage';
import { TransactionModal } from './components/TransactionModal';
import { FinancialSummary, Transaction, TransactionCreate, TransactionUpdate } from './types';
import { api } from './services/api';
import logoImg from './assets/logo_recolored.png';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    total_income: 0,
    total_expenses: 0,
    balance: 0,
    currency: 'INR',
  });

  const [currency, setCurrency] = useState<string>('INR');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  /**
   * Load transactions and summary from backend
   */
  const loadData = useCallback(async () => {
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
      console.error('Failed to load data:', err);
      setErrorMessage(
        err.message || 'Unable to connect to SmartSpend backend service.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setTransactionToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: TransactionCreate | TransactionUpdate) => {
    if (transactionToEdit) {
      await api.updateTransaction(transactionToEdit.id, data as TransactionUpdate);
    } else {
      await api.createTransaction(data as TransactionCreate);
    }
    await loadData();
  };

  const handleDeleteTransaction = async (id: number) => {
    await api.deleteTransaction(id);
    await loadData();
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Subtle Ambient Background Shapes enhancing the glass effect */}
      <div className="fixed top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-[#E9DCF0] opacity-60 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full bg-[#F7E1EA] opacity-50 blur-[140px] pointer-events-none" />
      <div className="fixed top-[40%] right-[25%] w-[400px] h-[400px] rounded-full bg-[#E5E0F2] opacity-45 blur-[120px] pointer-events-none" />

      {/* Floating Glass Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-200">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-16 glass-pill border-b border-white/60 px-5 flex items-center justify-between sticky top-0 z-30 m-4 rounded-3xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-text-secondary hover:bg-white/60 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="SmartSpend" className="h-7 w-auto object-contain" />
            </div>
          </div>

          <button
            onClick={loadData}
            title="Refresh data"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
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
                className="font-bold underline shrink-0 hover:opacity-80"
              >
                Retry
              </button>
            </div>
          )}

          {/* Active Tab Router View */}
          {activeTab === 'dashboard' && (
            <Dashboard
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
              onCurrencyChange={(newCur) => {
                setCurrency(newCur);
              }}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
};

export default App;
