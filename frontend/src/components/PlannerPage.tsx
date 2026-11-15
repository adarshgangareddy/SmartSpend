import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Zap,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Search,
  Tag,
  DollarSign,
  ArrowRight,
  Filter,
  Check,
  Plane,
  GraduationCap,
  ShoppingBag,
} from 'lucide-react';
import { PlannedItem, UrgencyLevel, PlannedItemStatus } from '../types';

interface PlannerPageProps {
  items: PlannedItem[];
  onOpenAddModal: () => void;
  onOpenEditModal: (item: PlannedItem) => void;
  onOpenConvertModal: (item: PlannedItem) => void;
  onDeleteItem: (id: number) => Promise<void>;
  isLoading?: boolean;
  preferredCurrency?: string;
}

type FilterTab = 'all' | 'immediate' | 'upcoming' | 'long_term' | 'bought';

export const PlannerPage: React.FC<PlannerPageProps> = ({
  items,
  onOpenAddModal,
  onOpenEditModal,
  onOpenConvertModal,
  onDeleteItem,
  isLoading = false,
  preferredCurrency = 'INR',
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => {
      if (item.event_tag) tags.add(item.event_tag.trim());
    });
    return Array.from(tags);
  }, [items]);

  // Statistics
  const stats = useMemo(() => {
    const pending = items.filter((i) => i.status === 'pending');
    const immediate = pending.filter((i) => i.urgency === 'immediate');
    const upcoming = pending.filter((i) => i.urgency === 'upcoming');
    const longTerm = pending.filter((i) => i.urgency === 'long_term');
    const bought = items.filter((i) => i.status === 'bought');

    const totalEstimated = pending.reduce((sum, i) => sum + (i.estimated_amount || 0), 0);

    return {
      totalCount: pending.length,
      immediateCount: immediate.length,
      upcomingCount: upcoming.length,
      longTermCount: longTerm.length,
      boughtCount: bought.length,
      totalEstimated,
    };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeFilter === 'immediate') {
        if (item.urgency !== 'immediate' || item.status !== 'pending') return false;
      } else if (activeFilter === 'upcoming') {
        if (item.urgency !== 'upcoming' || item.status !== 'pending') return false;
      } else if (activeFilter === 'long_term') {
        if (item.urgency !== 'long_term' || item.status !== 'pending') return false;
      } else if (activeFilter === 'bought') {
        if (item.status !== 'bought') return false;
      } else {
        // 'all' shows pending items by default
        if (item.status !== 'pending') return false;
      }

      // Tag filter
      if (selectedTag !== 'all' && item.event_tag !== selectedTag) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchNotes = (item.notes || '').toLowerCase().includes(query);
        const matchTag = (item.event_tag || '').toLowerCase().includes(query);
        const matchCat = item.category.toLowerCase().includes(query);
        if (!matchTitle && !matchNotes && !matchTag && !matchCat) return false;
      }

      return true;
    });
  }, [items, activeFilter, selectedTag, searchQuery]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this planned item?')) {
      setDeletingId(id);
      try {
        await onDeleteItem(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                Smart Planner
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary font-medium">
                Note what you need to buy—from immediate essentials to college supplies and travel dreams.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-black shadow-primary/25 hover:shadow-xl transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Note New Item</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Planned Budget */}
        <div className="glass-box rounded-3xl p-4 sm:p-5 border border-white/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Planned Budget
          </div>
          <div className="text-xl sm:text-2xl font-black text-text-primary">
            {preferredCurrency} {stats.totalEstimated.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-text-secondary font-medium mt-1">
            Across {stats.totalCount} pending item(s)
          </div>
        </div>

        {/* Immediate Needs */}
        <div
          onClick={() => setActiveFilter('immediate')}
          className={`glass-box rounded-3xl p-4 sm:p-5 border transition-all cursor-pointer ${
            activeFilter === 'immediate'
              ? 'ring-2 ring-rose-400 bg-rose-50/70 border-rose-200 shadow-md'
              : 'border-white/80 hover:bg-white/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Immediate Needs
            </span>
            <Zap className="w-4 h-4 text-rose-500 fill-rose-500/20" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
            {stats.immediateCount}
          </div>
          <div className="text-[11px] text-text-secondary font-medium mt-1">
            Shampoo, groceries, urgent
          </div>
        </div>

        {/* Upcoming Events */}
        <div
          onClick={() => setActiveFilter('upcoming')}
          className={`glass-box rounded-3xl p-4 sm:p-5 border transition-all cursor-pointer ${
            activeFilter === 'upcoming'
              ? 'ring-2 ring-amber-400 bg-amber-50/70 border-amber-200 shadow-md'
              : 'border-white/80 hover:bg-white/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Upcoming & Events
            </span>
            <GraduationCap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
            {stats.upcomingCount}
          </div>
          <div className="text-[11px] text-text-secondary font-medium mt-1">
            College prep, near-term items
          </div>
        </div>

        {/* Long-Term Goals */}
        <div
          onClick={() => setActiveFilter('long_term')}
          className={`glass-box rounded-3xl p-4 sm:p-5 border transition-all cursor-pointer ${
            activeFilter === 'long_term'
              ? 'ring-2 ring-indigo-400 bg-indigo-50/70 border-indigo-200 shadow-md'
              : 'border-white/80 hover:bg-white/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Future Goals
            </span>
            <Plane className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-1">
            {stats.longTermCount}
          </div>
          <div className="text-[11px] text-text-secondary font-medium mt-1">
            Travel (Japan, etc.), gadgets
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="glass-box rounded-3xl p-3 sm:p-4 border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeFilter === 'all'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-neutral-light/80'
            }`}
          >
            All Pending ({stats.totalCount})
          </button>

          <button
            onClick={() => setActiveFilter('immediate')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'immediate'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Immediate ({stats.immediateCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'upcoming'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Upcoming ({stats.upcomingCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('long_term')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'long_term'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Goals ({stats.longTermCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('bought')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'bought'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Bought ({stats.boughtCount})</span>
          </button>
        </div>

        {/* Search & Tag Filter */}
        <div className="flex items-center gap-2">
          {allTags.length > 0 && (
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-1.5 rounded-2xl border border-border-light bg-white/90 text-text-primary text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 shrink-0"
            >
              <option value="all">All Events / Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-9 pr-3 py-1.5 rounded-2xl border border-border-light bg-white/90 text-text-primary text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-text-muted/60"
            />
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="glass-box rounded-3xl p-12 text-center border border-white/80">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
            <ShoppingBag className="w-8 h-8 opacity-75" />
          </div>
          <h3 className="text-base font-black text-text-primary">
            No planned items found
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1 mb-5">
            {activeFilter === 'bought'
              ? 'Items you mark as bought will show up here along with their linked expense transactions.'
              : 'Add things you need to purchase so you can organize your budget and get notified.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Note What to Buy</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isImmediate = item.urgency === 'immediate';
            const isUpcoming = item.urgency === 'upcoming';
            const isLongTerm = item.urgency === 'long_term';
            const isBought = item.status === 'bought';

            return (
              <div
                key={item.id}
                className={`glass-box rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between hover:shadow-glass-lg ${
                  isBought
                    ? 'bg-emerald-50/40 border-emerald-200 opacity-80'
                    : isImmediate
                    ? 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-200/50'
                    : isUpcoming
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white/80 border-white/90'
                }`}
              >
                <div>
                  {/* Card Header badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isImmediate && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                          <Zap className="w-2.5 h-2.5" />
                          Immediate
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-2xs">
                          <Clock className="w-2.5 h-2.5" />
                          Upcoming
                        </span>
                      )}
                      {isLongTerm && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                          <Sparkles className="w-2.5 h-2.5" />
                          Goal
                        </span>
                      )}
                      {isBought && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          <Check className="w-2.5 h-2.5" />
                          Bought
                        </span>
                      )}
                      {item.event_tag && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-text-primary border border-border-light shadow-2xs">
                          {item.event_tag}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-bold text-text-muted">
                      {item.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-black text-text-primary leading-snug">
                    {item.title}
                  </h4>

                  {/* Estimated Price */}
                  {item.estimated_amount > 0 && (
                    <div className="text-lg font-black text-text-primary mt-1">
                      <span className="text-xs text-text-muted font-bold mr-1">Est:</span>
                      {item.currency} {item.estimated_amount.toLocaleString()}
                    </div>
                  )}

                  {/* Target Date */}
                  {item.target_date && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mt-2">
                      <Calendar className="w-3.5 h-3.5 text-text-muted" />
                      <span>Target: {item.target_date}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-xs text-text-muted mt-2 italic line-clamp-2">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-border-light/70 flex items-center justify-between gap-2">
                  {!isBought ? (
                    <button
                      onClick={() => onOpenConvertModal(item)}
                      className="flex-1 py-2 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as Bought</span>
                    </button>
                  ) : (
                    <div className="flex-1 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Added to Expenses</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditModal(item)}
                      title="Edit Item"
                      className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/80 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      title="Delete Item"
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

