import React, { useState, useEffect, useCallback } from 'react';
import { Menu, AlertCircle, RefreshCw } from 'lucide-react';
import { NavTab, Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TransactionsPage } from './components/TransactionsPage';
import { SettingsPage } from './components/SettingsPage';
import { TransactionModal } from './components/TransactionModal';
import { FinancialSummary, Transaction, TransactionCreate, TransactionUpdate } from './types';
import { api } from './services/api';
import logoImg from './assets/logo.jpg';

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
   * Load transactions and summary from the backend
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
      console.error('Failed to load data from backend:', err);
      setErrorMessage(
        err.message || 'Unable to connect to the SmartSpend backend service.'
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
    <div className="min-h-screen bg-[#F8F9FA] text-charcoal-800 flex">
      {/* 1. Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="SmartSpend" className="h-7 w-auto rounded" />
              <span className="font-bold text-sm tracking-tight text-charcoal-900">
                Smart<span className="text-[#00A896]">Spend</span>
              </span>
            </div>
          </div>

          <button
            onClick={loadData}
            title="Refresh data"
            className="p-2 rounded-lg text-slate-400 hover:text-charcoal-700 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-xs text-rose-700">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-800">Connection Notice</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={loadData}
                className="font-semibold text-rose-800 underline shrink-0 hover:text-rose-950"
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

      {/* 3. Add / Edit Transaction Modal */}
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

