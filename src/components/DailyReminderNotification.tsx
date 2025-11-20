import { useState, useEffect } from 'react';
import { AlertCircle, X, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function DailyReminderNotification() {
  const { profile, refreshProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [hasActivityToday, setHasActivityToday] = useState(false);

  useEffect(() => {
    // Check if user has submitted any activity today
    if (profile?.recentActivities) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const todayActivities = profile.recentActivities.filter((activity) => {
        // Check both event_time and created_at
        const activityDateStr = (activity.event_time || activity.created_at)?.split('T')[0];
        return activityDateStr === todayStr;
      });

      setHasActivityToday(todayActivities.length > 0);
    }

    // Refresh profile periodically to check for new activities (every 2 minutes)
    const interval = setInterval(() => {
      refreshProfile();
    }, 120000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, [profile, refreshProfile]);

  // Don't show if dismissed or if user has activity today
  if (dismissed || hasActivityToday || !profile) {
    return null;
  }

  // Check if notification was dismissed today (localStorage)
  const todayKey = `dailyReminderDismissed_${new Date().toDateString()}`;
  const wasDismissedToday = localStorage.getItem(todayKey) === 'true';

  if (wasDismissedToday) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(todayKey, 'true');
  };

  // Get user's average daily points or goal
  const avgDailyPoints = profile.stats.totalPoints > 0 
    ? Math.round(profile.stats.totalPoints / Math.max(1, profile.stats.totalActivities)) 
    : 10;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 sm:px-6 lg:px-8 py-2.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              You are yet to meet your goal today!
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Submit an activity to earn points and keep your streak going.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-3 text-amber-600 hover:text-amber-800 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

