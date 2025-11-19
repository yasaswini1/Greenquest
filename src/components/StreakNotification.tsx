import React, { useEffect } from 'react';
import { Flame, X } from 'lucide-react';

interface StreakNotificationProps {
  streak: number;
  onDismiss: () => void;
}

export function StreakNotification({ streak, onDismiss }: StreakNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-pulse">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-2xl p-4 min-w-[300px] border-2 border-orange-300">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-lg">🔥 Streak Active!</p>
              <p className="text-sm text-orange-100">
                {streak} day{streak !== 1 ? 's' : ''} in a row
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-white h-full rounded-full transition-all duration-5000"
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

