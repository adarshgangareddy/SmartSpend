import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
  Calendar,
  X,
  RotateCcw,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';

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

  // Extract unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category) cats.add(tx.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Filter transactions in real-time
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Type filter
      if (typeFilter && tx.type !== typeFilter) return false;

      // 2. Search term (description or category)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchDesc = tx.description ? tx.description.toLowerCase().includes(term) : false;
        const matchCat = tx.category ? tx.category.toLowerCase().includes(term) : false;
        if (!matchDesc && !matchCat) return false;
      }

      // 3. Category filter
      if (categoryFilter && tx.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // 4. Date range
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
    setTypeFilter('');
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

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 tracking-tight">
            Transactions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage and view all your recorded incomes and expenses
          </p>
        </div>

        <button
          onClick={onAddTransaction}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#00A896] hover:bg-[#028090] shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Main Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Type Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setTypeFilter('')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  typeFilter === ''
                    ? 'bg-white text-charcoal-900 shadow-xs'
                    : 'hover:text-charcoal-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  typeFilter === 'income'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'hover:text-emerald-700'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  typeFilter === 'expense'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'hover:text-rose-700'
                }`}
              >
                Expenses
              </button>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showFilters || activeFiltersCount > 0
                  ? 'border-[#00A896] text-[#00A896] bg-primary-light/40'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#00A896] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Collapsible Filters */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-100">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] bg-white"
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
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                To Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896]"
                />
                {(categoryFilter || startDate || endDate) && (
                  <button
                    onClick={handleResetFilters}
                    title="Reset filters"
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-charcoal-700 hover:bg-slate-50 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-charcoal-800">
              No transactions found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {transactions.length === 0
                ? 'Get started by creating your first transaction.'
                : 'No transactions match the selected filters. Try clearing some criteria.'}
            </p>
            {transactions.length > 0 && (
              <button
                onClick={handleResetFilters}
                className="mt-3 text-xs font-semibold text-[#00A896] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-500 whitespace-nowrap">
                        {tx.transaction_date}
                      </td>

                      {/* Description & Type Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`p-1.5 rounded-lg shrink-0 ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span className="font-semibold text-charcoal-900">
                            {tx.description || tx.category}
                          </span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                          {tx.category}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold">
                        <span
                          className={
                            isIncome ? 'text-emerald-600' : 'text-charcoal-900'
                          }
                        >
                          {isIncome ? '+' : '-'}₹
                          {tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Edit Transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-charcoal-700 hover:bg-slate-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteConfirm(tx.id)}
                            disabled={deletingId === tx.id}
                            title="Delete Transaction"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
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

        {/* Table Footer info */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40 text-[11px] font-medium text-slate-400 flex items-center justify-between">
          <span>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </span>
          <span>Currency: {currency}</span>
        </div>
      </div>
    </div>
  );
};

