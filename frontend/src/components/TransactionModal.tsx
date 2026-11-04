import React, { useState, useEffect } from 'react';
import { X, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { Transaction, TransactionCreate, TransactionType, TransactionUpdate } from '../types';
import { SUPPORTED_CURRENCIES } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionCreate | TransactionUpdate) => Promise<void>;
  transactionToEdit?: Transaction | null;
  defaultCurrency?: string;
}

const COMMON_CATEGORIES = [
  'Food',
  'Salary',
  'Rent',
  'Utilities',
  'Transit',
  'Shopping',
  'Entertainment',
  'Investment',
  'Healthcare',
  'Other',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transactionToEdit,
  defaultCurrency = 'INR',
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDescription(transactionToEdit.description || '');
      setCurrency(transactionToEdit.currency || defaultCurrency);
      setTransactionDate(transactionToEdit.transaction_date);
    } else {
      setType('expense');
      setAmount('');
      setCategory('Food');
      setDescription('');
      setCurrency(defaultCurrency);
      setTransactionDate(new Date().toISOString().split('T')[0]);
    }
    setErrorMessage(null);
  }, [transactionToEdit, isOpen, defaultCurrency]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    if (!category.trim()) {
      setErrorMessage('Please select or specify a category.');
      return;
    }

    if (!transactionDate) {
      setErrorMessage('Please select a valid date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        category: category.trim(),
        description: description.trim() || null,
        currency: currency.toUpperCase().trim(),
        transaction_date: transactionDate,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252344]/25 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-modal rounded-3xl w-full max-w-lg overflow-hidden border border-white/90 shadow-glass-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-white/60 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5 font-medium">
              {transactionToEdit
                ? 'Update your record details'
                : 'Enter details for your new record'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-text-secondary hover:text-text-primary hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-expense-light border border-expense/30 text-xs text-expense font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Type Switcher */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold border transition-all ${
                  type === 'expense'
                    ? 'bg-expense-light border-expense/40 text-expense shadow-2xs'
                    : 'glass-pill text-text-secondary hover:bg-white/80'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold border transition-all ${
                  type === 'income'
                    ? 'bg-income-light border-income/40 text-income shadow-2xs'
                    : 'glass-pill text-text-secondary hover:bg-white/80'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Income
              </button>
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-bold rounded-2xl glass-pill text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full px-2.5 py-2.5 text-xs font-bold text-center rounded-2xl glass-pill text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-white text-text-primary">
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              Category *
            </label>
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    category.toLowerCase() === cat.toLowerCase()
                      ? 'bg-text-primary text-white shadow-2xs'
                      : 'bg-white/60 text-text-secondary hover:bg-white/90'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              placeholder="Or type a custom category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 text-xs font-semibold rounded-2xl glass-pill text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-text-muted"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              Description <span className="font-normal text-text-muted">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Flight ticket, Groceries, Dinner"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl glass-pill text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-text-muted"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-text-secondary mb-1.5">
              Transaction Date *
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl glass-pill text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-white/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-primary hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2 shadow-glass transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {transactionToEdit ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
