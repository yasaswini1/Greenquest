import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, Leaf, Zap, Droplet, TreePine, MapPin } from 'lucide-react';
import { ImpactChart } from './ImpactChart';
import { WeeklyActivity } from './WeeklyActivity';
import { TrackingView } from './TrackingView';
import Forest from './Forest';
import { useAuth } from '../context/AuthContext';
import type { Activity } from '../types';

export function Dashboard() {
  const { profile } = useAuth();
  const statCards = [
    { label: 'Total EcoScore', value: profile?.stats.totalPoints.toLocaleString() ?? '0', change: '+4% this week', trend: 'up', icon: Leaf, color: 'text-emerald-600' },
    { label: 'CO₂ Saved', value: `${profile?.stats.co2Saved ?? 0} kg`, change: '+1.8 kg', trend: 'up', icon: Zap, color: 'text-blue-600' },
    { label: 'Activities', value: `${profile?.stats.totalActivities ?? 0}`, change: 'New logs', trend: 'up', icon: CheckCircle2, color: 'text-purple-600' },
    { label: 'Trees Planted', value: `${profile?.forest.trees ?? 0}`, change: `${Math.round((profile?.forest.progressToNext ?? 0) * 100)}% to next`, trend: 'up', icon: TreePine, color: 'text-green-600' },
  ];

const aiInsights = [
    { 
    title: 'Impact Tips',
    description: 'Stay consistent with daily eco actions',
      icon: CheckCircle2,
      color: 'text-emerald-600'
    },
    { 
    title: 'Water Impact',
    description: `≈ ${(profile?.stats.co2Saved ?? 0) / 5} L saved`,
      icon: Droplet,
      color: 'text-blue-600'
    },
    { 
    title: 'Forest Growth',
    description: `${profile?.forest.trees ?? 0} trees in your forest`,
      icon: TreePine,
      color: 'text-green-600'
    },
  ];

  const recentActivities = profile?.recentActivities ?? [];

  return (
    <div className="space-y-6">
      {/* Forest Section - Top Half */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <Forest trees={profile?.forest.trees ?? 0} progressToNext={profile?.forest.progressToNext ?? 0} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Impact Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900">CO₂ Impact Over Time</h2>
              <select className="text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
              </select>
            </div>
            <ImpactChart />
          </div>

          {/* Recent Activities */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-gray-900">Recent Activities</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Log your first activity to see insights.</div>
              ) : (
                recentActivities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </div>

          {/* Tracking / Forest (Quick Access) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Quick Tracking & Forest</h3>
            <TrackingView />
          </div>
        </div>

          {/* Right Column - Insights & Weekly */}
        <div className="space-y-6">
          {/* Impact Insights */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Impact Insights</h3>
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className="flex gap-3">
                  <insight.icon className={`w-5 h-5 ${insight.color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="text-gray-900 mb-1">{insight.title}</p>
                    <p className="text-gray-500">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Activity Heatmap */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">Weekly Pattern</h3>
            <WeeklyActivity />
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-900 mb-4">This Week</h3>
            <div className="space-y-3">
              <QuickStat label="Activities Logged" value={`${profile?.stats.totalActivities ?? 0}`} />
              <QuickStat label="Points Earned" value={`${profile?.stats.totalPoints ?? 0}`} />
              <QuickStat label="CO₂ Avoided" value={`${profile?.stats.co2Saved ?? 0} kg`} />
              <QuickStat label="Streak Days" value={`${profile?.stats.streakDays ?? 0}`} />
            </div>
          </div>

          {/* Trust Score */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
            <h3 className="mb-2">Trust Score</h3>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl">98.5%</span>
              <span className="text-emerald-100">Excellent</span>
            </div>
            <p className="text-emerald-100">
              Your submissions are consistently verified with high confidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ stat }: { stat: any }) {
  const Icon = stat.icon;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 ${stat.color}`} />
        {stat.trend === 'up' ? (
          <span className="flex items-center gap-1 text-emerald-600">
            <TrendingUp className="w-4 h-4" />
            <span>{stat.change}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-rose-600">
            <TrendingDown className="w-4 h-4" />
            <span>{stat.change}</span>
          </span>
        )}
      </div>
      <p className="text-gray-500 mb-1">{stat.label}</p>
      <p className="text-gray-900">{stat.value}</p>
    </div>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const statusConfig = {
    verified: { 
      color: 'text-emerald-600 bg-emerald-50', 
      icon: CheckCircle2,
      label: 'Verified'
    },
    pending: { 
      color: 'text-amber-600 bg-amber-50', 
      icon: Clock,
      label: 'Pending'
    },
    flagged: { 
      color: 'text-rose-600 bg-rose-50', 
      icon: AlertTriangle,
      label: 'Flagged'
    },
  };

  const config = statusConfig[activity.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  const timestamp = activity.event_time ?? activity.created_at;

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-900">{activity.type}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${config.color} flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-gray-500">
            <span>{activity.category}</span>
            <span>·</span>
            <span>+{activity.points} pts</span>
            <span>·</span>
            <span>{activity.co2_saved} kg CO₂</span>
          </div>
          {activity.location && (
            <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
              <MapPin className="w-3 h-3" />
              <span>{activity.location}</span>
            </div>
          )}
        </div>
        <span className="text-gray-400 flex-shrink-0">{new Date(timestamp).toLocaleString()}</span>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
