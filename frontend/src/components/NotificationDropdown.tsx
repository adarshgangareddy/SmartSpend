import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Zap,
  Clock,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { PlannedItem } from '../types';

interface NotificationDropdownProps {
  plannedItems: PlannedItem[];
  onOpenPlanner: () => void;
  onMarkBought: (item: PlannedItem) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  plannedItems,
  onOpenPlanner,
  onMarkBought,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Compute urgent and due notifications
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingItems = plannedItems.filter((item) => item.status === 'pending');

  const immediateItems = pendingItems.filter((item) => item.urgency === 'immediate');
  const dueSoonItems = pendingItems.filter((item) => {
    if (item.urgency === 'immediate') return false; // Already in immediate
    if (!item.target_date) return false;
    // Target date is today or within the next 3 days
    const target = new Date(item.target_date);
    const today = new Date(todayStr);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  });

  const totalAlertCount = immediateItems.length + dueSoonItems.length;

  const requestBrowserPush = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted' && immediateItems.length > 0) {
        new Notification('SmartSpend Reminder', {
          body: `You have ${immediateItems.length} immediate purchase(s) needed: ${immediateItems
            .map((i) => i.title)
            .join(', ')}`,
          icon: '/favicon.ico',
        });
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications and reminders"
        title={totalAlertCount > 0 ? `${totalAlertCount} items need attention` : 'Reminders & Notifications'}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
          isOpen
            ? 'bg-primary text-white shadow-md'
            : totalAlertCount > 0
            ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 shadow-2xs'
            : 'bg-white/70 border border-white text-text-secondary hover:text-text-primary hover:bg-white shadow-2xs'
        }`}
      >
        <Bell className="w-4 h-4" />
        {totalAlertCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
            {totalAlertCount > 9 ? '9+' : totalAlertCount}
          </span>
        )}
      </button>

      {/* Flyout Drawer / Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl glass-box bg-white/98 shadow-glass-xl border border-white/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-light mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-text-primary">Reminders & Alerts</span>
            </div>
            {totalAlertCount > 0 && (
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {totalAlertCount} Actionable
              </span>
            )}
          </div>

          {/* Browser notification permission banner */}
          {browserPermission === 'default' && (
            <div className="mb-3 p-2.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[11px] font-semibold text-text-primary">
                  Enable device alerts?
                </span>
              </div>
              <button
                type="button"
                onClick={requestBrowserPush}
                className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
              >
                Allow
              </button>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {totalAlertCount === 0 && (
              <div className="py-6 text-center text-text-muted">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                <p className="text-xs font-bold text-text-primary">All caught up!</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  No immediate items or upcoming deadlines right now.
                </p>
              </div>
            )}

            {/* Immediate items */}
            {immediateItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200/80 hover:bg-rose-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-rose-600 text-white">
                        <Zap className="w-2.5 h-2.5" />
                        Immediate
                      </span>
                      {item.event_tag && (
                        <span className="text-[10px] font-bold text-rose-800">
                          {item.event_tag}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-black text-text-primary mt-1.5">
                      {item.title}
                    </div>
                    {item.estimated_amount > 0 && (
                      <div className="text-[11px] font-bold text-text-secondary mt-0.5">
                        Est: {item.currency} {item.estimated_amount.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      onMarkBought(item);
                      setIsOpen(false);
                    }}
                    title="Mark as bought"
                    className="shrink-0 p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Bought</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Due soon items */}
            {dueSoonItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-600 text-white">
                        <Clock className="w-2.5 h-2.5" />
                        Due Soon
                      </span>
                      {item.event_tag && (
                        <span className="text-[10px] font-bold text-amber-800">
                          {item.event_tag}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-black text-text-primary mt-1.5">
                      {item.title}
                    </div>
                    <div className="text-[10px] font-medium text-text-muted mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {item.target_date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onMarkBought(item);
                      setIsOpen(false);
                    }}
                    title="Mark as bought"
                    className="shrink-0 p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Bought</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer: Link to full planner */}
          <div className="pt-3 mt-3 border-t border-border-light text-center">
            <button
              onClick={() => {
                onOpenPlanner();
                setIsOpen(false);
              }}
              className="w-full py-2 px-3 rounded-2xl bg-neutral-light hover:bg-neutral-light/80 text-text-primary text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Open Smart Planner</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

