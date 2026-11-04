import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  X,
  RotateCcw,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatAmount } from '../utils/formatters';

interface TransactionsPageProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: number) => Promise<void>;
  currency?: string;
  initialTypeFilter?: TransactionType | '';
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  currency = 'INR',
  initialTypeFilter = '',
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>(initialTypeFilter);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category) cats.add(tx.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter && tx.type !== typeFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchDesc = tx.description ? tx.description.toLowerCase().includes(term) : false;
        const matchCat = tx.category ? tx.category.toLowerCase().includes(term) : false;
        if (!matchDesc && !matchCat) return false;
      }

      if (categoryFilter && tx.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      if (startDate && tx.transaction_date < startDate) return false;
      if (endDate && tx.transaction_date > endDate) return false;

      return true;
    });
  }, [transactions, typeFilter, searchTerm, categoryFilter, startDate, endDate]);

  const activeFiltersCount =
    (categoryFilter ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  const handleResetFilters = () => {
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setTypeFilter(initialTypeFilter);
  };

  const handleDeleteConfirm = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setDeletingId(id);
      try {
        await onDeleteTransaction(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getPageTitle = () => {
    if (initialTypeFilter === 'income') return 'Incomes';
    if (initialTypeFilter === 'expense') return 'Expenses';
    return 'Transactions';
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-medium">
            Manage and view your financial entries
          </p>
        </div>

        <button
          onClick={onAddTransaction}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-primary-dark shadow-glass transition-all duration-150 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Main Filter & Search Toolbar */}
      <div className="glass-card rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-2xl glass-pill focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary placeholder:text-text-muted transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Type Filter Tabs (only if not on a locked view) */}
            {!initialTypeFilter && (
              <div className="flex items-center bg-white/50 p-1 rounded-2xl border border-white/80 text-xs font-bold text-text-secondary">
                <button
                  onClick={() => setTypeFilter('')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    typeFilter === ''
                      ? 'bg-white text-text-primary shadow-2xs'
                      : 'hover:text-text-primary'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter('income')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    typeFilter === 'income'
                      ? 'bg-white text-income shadow-2xs'
                      : 'hover:text-income'
                  }`}
                >
                  Income
                </button>
                <button
                  onClick={() => setTypeFilter('expense')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    typeFilter === 'expense'
                      ? 'bg-white text-expense shadow-2xs'
                      : 'hover:text-expense'
                  }`}
                >
                  Expenses
                </button>
              </div>
            )}

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-primary-light text-primary-dark border border-primary/30'
                  : 'glass-pill text-text-secondary hover:text-text-primary hover:bg-white/80'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Collapsible Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-white/60 grid grid-cols-1 sm:grid-cols-3 gap-3.5 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-2xl glass-pill focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary bg-white/70"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-2xl glass-pill focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                To Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-2xl glass-pill focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
                />
                {(categoryFilter || startDate || endDate) && (
                  <button
                    onClick={handleResetFilters}
                    title="Reset filters"
                    className="p-2 rounded-2xl glass-pill text-text-secondary hover:text-text-primary shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Glass Transaction Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-14 text-center">
            <Calendar className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-60" />
            <h3 className="text-base font-bold text-text-primary">
              No transactions found
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
              {transactions.length === 0
                ? 'Get started by creating your first entry.'
                : 'No transactions match the selected criteria. Try adjusting your filters.'}
            </p>
            {transactions.length > 0 && (
              <button
                onClick={handleResetFilters}
                className="mt-3 text-xs font-bold text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/60 bg-white/30 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Description</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5 text-right">Amount</th>
                  <th className="py-3.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50 text-xs font-medium">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-white/45 transition-colors group"
                    >
                      <td className="py-3.5 px-5 font-semibold text-text-secondary whitespace-nowrap">
                        {tx.transaction_date}
                      </td>

                      <td className="py-3.5 px-5 font-bold text-text-primary">
                        {tx.description || tx.category}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="inline-block px-3 py-1 rounded-xl text-[11px] font-bold bg-white/70 border border-white/80 text-text-secondary">
                          {tx.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap font-extrabold text-sm">
                        <span className={isIncome ? 'text-income' : 'text-expense'}>
                          {isIncome ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Edit"
                            className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/80 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(tx.id)}
                            disabled={deletingId === tx.id}
                            title="Delete"
                            className="p-1.5 rounded-xl text-text-secondary hover:text-expense hover:bg-expense-light transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/60 bg-white/20 text-xs font-semibold text-text-secondary flex items-center justify-between">
          <span>
            Showing {filteredTransactions.length} of {transactions.length} entries
          </span>
          <span>Currency: {currency}</span>
        </div>
      </div>
    </div>
  );
};
