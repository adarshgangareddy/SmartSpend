import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  AlertCircle,
  Tag,
  DollarSign,
  FileText,
  Clock,
  Zap,
} from 'lucide-react';
import { PlannedItem, PlannedItemCreate, PlannedItemUpdate, UrgencyLevel } from '../types';

interface PlannedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlannedItemCreate | PlannedItemUpdate) => Promise<void>;
  itemToEdit?: PlannedItem | null;
  defaultCurrency?: string;
}

const CATEGORIES = [
  'Personal Care',
  'Food & Groceries',
  'Education',
  'Travel',
  'Shopping',
  'Clothing',
  'Electronics',
  'Healthcare',
  'Entertainment',
  'Home & Living',
  'Other',
];

const QUICK_TAGS = [
  'College',
  'Daily Essentials',
  'Travel / Trip',
  'Tech & Gadgets',
  'Dorm / Room',
  'Work',
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD'];

export const PlannedItemModal: React.FC<PlannedItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  itemToEdit,
  defaultCurrency = 'INR',
}) => {
  const [title, setTitle] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState('Personal Care');
  const [urgency, setUrgency] = useState<UrgencyLevel>('immediate');
  const [eventTag, setEventTag] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setTitle(itemToEdit.title || '');
      setEstimatedAmount(itemToEdit.estimated_amount ? String(itemToEdit.estimated_amount) : '');
      setCurrency(itemToEdit.currency || defaultCurrency);
      setCategory(itemToEdit.category || 'Personal Care');
      setUrgency(itemToEdit.urgency || 'upcoming');
      setEventTag(itemToEdit.event_tag || '');
      setTargetDate(itemToEdit.target_date || '');
      setNotes(itemToEdit.notes || '');
    } else {
      setTitle('');
      setEstimatedAmount('');
      setCurrency(defaultCurrency);
      setCategory('Personal Care');
      setUrgency('immediate');
      setEventTag('');
      // Default immediate items to today or tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setTargetDate(tomorrow.toISOString().split('T')[0]);
      setNotes('');
    }
    setErrorMsg(null);
  }, [itemToEdit, isOpen, defaultCurrency]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('Please enter what you need to buy (e.g. Shampoo, College Books).');
      return;
    }

    const amountNum = parseFloat(estimatedAmount) || 0;
    if (amountNum < 0) {
      setErrorMsg('Estimated budget cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: cleanTitle,
        estimated_amount: amountNum,
        currency,
        category,
        urgency,
        event_tag: eventTag.trim() || null,
        target_date: targetDate || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save planned item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg glass-box rounded-3xl p-5 sm:p-7 shadow-glass-lg border border-white/80 bg-white/95 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-light/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary">
                {itemToEdit ? 'Edit Planned Item' : 'Note What to Buy'}
              </h2>
              <p className="text-xs text-text-secondary font-medium">
                Keep track of items you need today, for college, or future trips.
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
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Urgency Selector Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
              When do you need this? *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUrgency('immediate')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  urgency === 'immediate'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-sm ring-2 ring-rose-200'
                    : 'bg-white/80 border-border-light text-text-secondary hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs text-rose-600 mb-0.5">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>Immediate</span>
                </div>
                <div className="text-[10px] text-text-secondary leading-tight">
                  Today / urgent (e.g. Shampoo, Milk)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('upcoming')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  urgency === 'upcoming'
                    ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm ring-2 ring-amber-200'
                    : 'bg-white/80 border-border-light text-text-secondary hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-600 mb-0.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Upcoming</span>
                </div>
                <div className="text-[10px] text-text-secondary leading-tight">
                  This week/month (e.g. College supplies)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('long_term')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  urgency === 'long_term'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-sm ring-2 ring-indigo-200'
                    : 'bg-white/80 border-border-light text-text-secondary hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs text-indigo-600 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Future Goal</span>
                </div>
                <div className="text-[10px] text-text-secondary leading-tight">
                  Next year / Wishlist (e.g. Japan trip)
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Head & Shoulders Shampoo, College Backpack, Japan Rail Pass"
              className="w-full px-4 py-2.5 rounded-2xl border border-border-light bg-white/80 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-text-muted/60"
            />
          </div>

          {/* Estimated Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Estimated Budget / Price
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                  {currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-14 pr-4 py-2.5 rounded-2xl border border-border-light bg-white/80 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-border-light bg-white/80 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Event Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-border-light bg-white/80 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                Event / Bundle Tag
              </label>
              <input
                type="text"
                value={eventTag}
                onChange={(e) => setEventTag(e.target.value)}
                placeholder="e.g. College, Japan Trip, Room"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-border-light bg-white/80 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-text-muted/60"
              />
            </div>
          </div>

          {/* Quick Tag Pills */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-text-muted">Quick tag:</span>
              {QUICK_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setEventTag(tag)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    eventTag === tag
                      ? 'bg-primary text-white border-primary shadow-2xs'
                      : 'bg-white/80 text-text-secondary border-border-light hover:bg-neutral-light'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Target Deadline / Needed By
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border-light bg-white/80 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Check for student discount, buy 400ml bottle, etc."
              className="w-full px-4 py-2 rounded-2xl border border-border-light bg-white/80 text-text-primary text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none placeholder:text-text-muted/60"
            />
          </div>

          {/* Action Buttons */}
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
              className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-primary/20 hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <span>{itemToEdit ? 'Save Changes' : 'Add to Plan'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

