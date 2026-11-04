import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notify: (type: NotificationType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (type: NotificationType, message: string, duration: number = 4500) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newItem: NotificationItem = { id, type, message, duration };

      setNotifications((prev) => [...prev.slice(-3), newItem]); // Keep at most 4 notifications to prevent clutter

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }
    },
    [removeNotification]
  );

  const success = useCallback(
    (message: string, duration?: number) => notify('success', message, duration),
    [notify]
  );
  const error = useCallback(
    (message: string, duration?: number) => notify('error', message, duration),
    [notify]
  );
  const info = useCallback(
    (message: string, duration?: number) => notify('info', message, duration),
    [notify]
  );

  return (
    <NotificationContext.Provider
      value={{ notify, success, error, info, removeNotification }}
    >
      {children}

      {/* Floating Notification Container (Top Right / Top Center) */}
      <div
        aria-live="polite"
        className="fixed top-5 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {notifications.map((item) => {
          const isSuccess = item.type === 'success';
          const isError = item.type === 'error';
          const isInfo = item.type === 'info';

          return (
            <div
              key={item.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-glass-lg backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
                isSuccess
                  ? 'bg-white/92 border-[#7A9B72]/30 text-[#302C49]'
                  : isError
                  ? 'bg-white/92 border-[#C96F70]/30 text-[#302C49]'
                  : 'bg-white/92 border-[#9589AD]/30 text-[#302C49]'
              }`}
            >
              {/* Type Icon Badge */}
              <div
                className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                  isSuccess
                    ? 'bg-[#EBF5EA] text-income'
                    : isError
                    ? 'bg-[#FBEFEF] text-expense'
                    : 'bg-[#F0EBF5] text-primary'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-4 h-4 stroke-[2.4]" />}
                {isError && <AlertCircle className="w-4 h-4 stroke-[2.4]" />}
                {isInfo && <Info className="w-4 h-4 stroke-[2.4]" />}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-text-primary leading-snug">
                  {item.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeNotification(item.id)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-white/60 transition-colors shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};
