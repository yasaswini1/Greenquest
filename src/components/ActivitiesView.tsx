import React, { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle2, Clock, AlertTriangle, TrendingUp, Download, RefreshCcw, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import type { Activity } from '../types';

export function ActivitiesView() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'flagged'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const loadActivities = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchActivities(token);
      setActivities(data.activities);
      if (!selectedActivity && data.activities.length > 0) {
        setSelectedActivity(data.activities[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredActivities = useMemo(() => {
    if (filterStatus === 'all') return activities;
    return activities.filter((activity) => activity.status === filterStatus);
  }, [activities, filterStatus]);

  const stats = {
    total: activities.length,
    verified: activities.filter((a) => a.status === 'verified').length,
    pending: activities.filter((a) => a.status === 'pending').length,
    flagged: activities.filter((a) => a.status === 'flagged').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-500 mb-1">Total Activities</p>
          <p className="text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-500 mb-1">Verified</p>
          <p className="text-emerald-600">{stats.verified}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-500 mb-1">Pending</p>
          <p className="text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-gray-500 mb-1">Flagged</p>
          <p className="text-rose-600">{stats.flagged}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activities List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-gray-900">Activity History</h2>
              <div className="flex gap-2">
                <button
                  onClick={loadActivities}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg"
                  title="Refresh activities"
                >
                  <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-lg">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input 
                    type="text"
                    placeholder="Search activities..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>
            </div>

            {/* List */}
            {error && (
              <div className="p-4 text-sm text-rose-600 bg-rose-50 border-b border-rose-100">{error}</div>
            )}
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading activities…</div>
              ) : filteredActivities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No activities yet. Log your first action!</div>
              ) : (
                filteredActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isSelected={selectedActivity?.id === activity.id}
                    onClick={() => setSelectedActivity(activity)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Activity Details */}
        <div className="lg:col-span-1">
          {selectedActivity ? (
            <ActivityDetails activity={selectedActivity} />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">Select an activity to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  activity: Activity;
  isSelected: boolean;
  onClick: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  isSelected,
  onClick,
}) => {
  const statusConfig = {
    verified: { color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
    pending: { color: 'text-amber-600 bg-amber-50', icon: Clock },
    flagged: { color: 'text-rose-600 bg-rose-50', icon: AlertTriangle },
  };

  const config = statusConfig[activity.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  const timestamp = activity.event_time ?? activity.created_at;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-emerald-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 mb-1">{activity.type}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {activity.category}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs ${config.color} flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {activity.status}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-gray-900">+{activity.points}</p>
          <p className="text-gray-500">{activity.co2_saved} kg</p>
        </div>
      </div>
      <p className="text-gray-500">{new Date(timestamp).toLocaleString()}</p>
      {activity.location && (
        <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3" />
          {activity.location}
        </p>
      )}
    </button>
  );
};

function ActivityDetails({ activity }: { activity: Activity }) {
  const hasCoordinates = typeof activity.latitude === 'number' && typeof activity.longitude === 'number';
  const geoAccuracy = (activity as Activity & { geo_accuracy?: number | null }).geo_accuracy;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-gray-900 mb-4">Activity Details</h3>
        
        <div className="space-y-3">
          <DetailRow label="Type" value={activity.type} />
          <DetailRow label="Category" value={activity.category} />
          <DetailRow label="Date & Time" value={new Date(activity.event_time ?? activity.created_at).toLocaleString()} />
          {activity.location && <DetailRow label="Location" value={activity.location} />}
          {hasCoordinates && (
            <DetailRow
              label="Coordinates"
              value={`${(activity.latitude as number).toFixed(4)}, ${(activity.longitude as number).toFixed(4)}`}
            />
          )}
          {typeof geoAccuracy === 'number' && (
            <DetailRow label="Geo Accuracy" value={`±${Math.round(geoAccuracy)} m`} />
          )}
          {activity.description && <DetailRow label="Notes" value={activity.description} />}
          <DetailRow label="Points" value={`+${activity.points}`} />
          <DetailRow label="CO₂ Saved" value={`${activity.co2_saved} kg`} />
        </div>
      </div>

      {activity.status === 'pending' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 mb-1">Verification Pending</p>
              <p className="text-amber-700">Your submission is awaiting manual review.</p>
            </div>
          </div>
        </div>
      )}

      {activity.status === 'flagged' && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-rose-900 mb-1">Flagged for Review</p>
              <p className="text-rose-700">This submission requires additional verification.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

