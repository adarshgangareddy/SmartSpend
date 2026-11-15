import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ArrowRight, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { PlannedItem } from '../types';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    item: PlannedItem,
    actualAmount: number,
    transactionDate: string,
    description: string
  ) => Promise<void>;
  item: PlannedItem | null;
}

export const ConvertModal: React.FC<ConvertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  item,
}) => {
  const [actualAmount, setActualAmount] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setActualAmount(item.estimated_amount > 0 ? String(item.estimated_amount) : '');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      let defaultDesc = `Bought: ${item.title}`;
      if (item.event_tag) {
        defaultDesc += ` (${item.event_tag})`;
      }
      setDescription(defaultDesc);
      setErrorMsg(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(actualAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setErrorMsg('Please enter a valid purchase amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirm(item, amountVal, transactionDate, description);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record expense transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md glass-box rounded-3xl p-5 sm:p-7 shadow-glass-lg border border-white/80 bg-white/95 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-light/80 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-text-primary">Mark as Bought</h2>
              <p className="text-xs text-text-secondary font-medium">
                Record this item directly as an expense transaction.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-neutral-light transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Item summary badge */}
          <div className="p-3.5 rounded-2xl bg-neutral-light/70 border border-border-light flex items-center justify-between">
            <div>
              <div className="text-xs text-text-muted font-bold uppercase tracking-wider">
                Planned Item
              </div>
              <div className="text-sm font-black text-text-primary mt-0.5">
                {item.title}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {item.category}
              </span>
            </div>
          </div>

          {/* Actual Amount Paid */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Actual Amount Paid ({item.currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                {item.currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-14 pr-4 py-2.5 rounded-2xl border border-border-light bg-white/80 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Date Purchased *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border-light bg-white/80 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Transaction Note
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-border-light bg-white/80 text-text-primary text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-light/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-2xl border border-border-light text-text-secondary hover:text-text-primary hover:bg-neutral-light text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Recording...</span>
              ) : (
                <>
                  <span>Save Expense</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

