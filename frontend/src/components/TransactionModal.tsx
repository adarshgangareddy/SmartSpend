import React, { useState, useEffect } from 'react';
import { X, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { Transaction, TransactionCreate, TransactionType, TransactionUpdate } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionCreate | TransactionUpdate) => Promise<void>;
  transactionToEdit?: Transaction | null;
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
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset form when modal opens or edit item changes
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category);
      setDescription(transactionToEdit.description || '');
      setCurrency(transactionToEdit.currency || 'INR');
      setTransactionDate(transactionToEdit.transaction_date);
    } else {
      setType('expense');
      setAmount('');
      setCategory('Food');
      setDescription('');
      setCurrency('INR');
      setTransactionDate(new Date().toISOString().split('T')[0]);
    }
    setErrorMessage(null);
  }, [transactionToEdit, isOpen]);

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
      if (transactionToEdit) {
        await onSubmit({
          type,
          amount: parsedAmount,
          category: category.trim(),
          description: description.trim() || null,
          currency: currency.toUpperCase().trim(),
          transaction_date: transactionDate,
        });
      } else {
        await onSubmit({
          type,
          amount: parsedAmount,
          category: category.trim(),
          description: description.trim() || null,
          currency: currency.toUpperCase().trim(),
          transaction_date: transactionDate,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl w-full max-w-lg border border-slate-200/90 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-charcoal-900">
              {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {transactionToEdit
                ? 'Update your existing financial record'
                : 'Enter details for your new income or expense'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-charcoal-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'expense'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  type === 'income'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
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
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Amount *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Currency
              </label>
              <input
                type="text"
                maxLength={3}
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 text-sm uppercase font-semibold text-center rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Category *
              </label>
            </div>
            {/* Quick selection chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    category.toLowerCase() === cat.toLowerCase()
                      ? 'bg-charcoal-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Description <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Lunch with team, Groceries, Monthly bill"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Transaction Date *
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A896]/20 focus:border-[#00A896] transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#00A896] hover:bg-[#028090] disabled:opacity-60 flex items-center gap-2 shadow-xs transition-colors"
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

