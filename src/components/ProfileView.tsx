import { Award, Calendar, Flame, Trophy, TrendingUp, Shield, Leaf, Zap, MapPin, Mail, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const badges = [
  { id: '1', name: 'First Steps', icon: '👣', description: 'Complete your first activity', earned: true, date: 'Oct 22, 2025' },
  { id: '2', name: 'Week Warrior', icon: '🔥', description: 'Maintain 7-day streak', earned: true, date: 'Oct 29, 2025' },
  { id: '3', name: 'Transport Hero', icon: '🚌', description: '20 public transport trips', earned: true, date: 'Nov 5, 2025' },
  { id: '4', name: 'Plant Power', icon: '🌱', description: '50 plant-based activities', earned: true, date: 'Nov 10, 2025' },
  { id: '5', name: 'Energy Saver', icon: '⚡', description: 'Reduce energy by 30%', earned: true, date: 'Nov 12, 2025' },
  { id: '6', name: 'Century Club', icon: '💯', description: 'Complete 100 activities', earned: false, date: null },
  { id: '7', name: 'Eco Legend', icon: '👑', description: 'Reach top 10 global', earned: false, date: null },
  { id: '8', name: 'Zero Waste', icon: '♻️', description: 'Zero waste for a month', earned: false, date: null },
];

const milestones = [
  { id: '1', title: 'Joined EcoScore AI', date: 'Oct 22, 2025', icon: '🎉' },
  { id: '2', title: 'First 100 Points', date: 'Oct 25, 2025', icon: '🌟' },
  { id: '3', title: 'Completed First Challenge', date: 'Nov 1, 2025', icon: '🏆' },
  { id: '4', title: 'Reached 1000 Points', date: 'Nov 10, 2025', icon: '💎' },
  { id: '5', title: 'Top 10 Global Ranking', date: 'Nov 15, 2025', icon: '👑' },
  { id: '6', title: 'Became #1 Globally', date: 'Nov 18, 2025', icon: '🥇' },
];

export function ProfileView() {
  const { profile } = useAuth();
  const user = profile?.user;
  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);
  const statCards = [
    { label: 'Total Points', value: (profile?.stats.totalPoints ?? 0).toLocaleString(), icon: Trophy, color: 'text-amber-600' },
    { label: 'Total Activities', value: `${profile?.stats.totalActivities ?? 0}`, icon: Award, color: 'text-blue-600' },
    { label: 'Current Streak', value: `${profile?.stats.streakDays ?? 0} days`, icon: Flame, color: 'text-orange-600' },
    { label: 'CO₂ Saved', value: `${profile?.stats.co2Saved ?? 0} kg`, icon: Leaf, color: 'text-green-600' },
    { label: 'Forest Trees', value: `${profile?.forest.trees ?? 0}`, icon: Zap, color: 'text-green-500' },
    { label: 'Member Since', value: user ? new Date(user.created_at).toLocaleDateString() : '—', icon: Shield, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
              SG
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-gray-900 mb-2">{user?.name ?? 'Eco Warrior'}</h1>
                <p className="text-gray-600 mb-3">Member since {user ? new Date(user.created_at).toLocaleDateString() : '—'}</p>
                <div className="flex flex-wrap gap-3">
                  <span className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    Earth
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Mail className="w-4 h-4" />
                    {user?.email ?? 'you@email.com'}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <Globe className="w-4 h-4" />
                    @ecoscore
                  </span>
                </div>
              </div>
              <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Edit Profile
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                🏆 {profile?.stats.totalPoints ?? 0} pts earned
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                🌳 {profile?.forest.trees ?? 0} trees planted
              </span>
              <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
                🔥 {profile?.stats.streakDays ?? 0} Day Streak
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
            <p className="text-gray-500 mb-1">{stat.label}</p>
            <p className="text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Impact Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-gray-900 mb-6">Environmental Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ImpactCard
            icon="🌍"
            value={`${profile?.stats.co2Saved ?? 0} kg`}
            label="Total CO₂ Saved"
            equivalent={`${profile?.forest.trees ?? 0} trees planted`}
          />
          <ImpactCard
            icon="⚡"
            value={`${Math.round((profile?.stats.totalPoints ?? 0) * 0.08)} kWh`}
            label="Energy Saved"
            equivalent="Estimated savings"
          />
          <ImpactCard
            icon="💧"
            value={`${Math.round((profile?.stats.co2Saved ?? 0) * 7)} L`}
            label="Water Conserved"
            equivalent="≈ household usage"
          />
        </div>
      </div>

      {/* Earned Badges */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-gray-900">Earned Badges ({earnedBadges.length}/{badges.length})</h2>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {earnedBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>

      {/* Locked Badges */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Locked Badges</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {lockedBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Journey Milestones</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-2xl shadow-md">
                    {milestone.icon}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <p className="text-gray-900 mb-1">{milestone.title}</p>
                  <p className="text-gray-500">{milestone.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-gray-900 mb-6">Activity Breakdown</h3>
        <div className="space-y-4">
          <CategoryProgress label="Transport" count={35} total={89} color="bg-blue-500" />
          <CategoryProgress label="Energy" count={22} total={89} color="bg-yellow-500" />
          <CategoryProgress label="Plastic Avoidance" count={18} total={89} color="bg-green-500" />
          <CategoryProgress label="Nature" count={8} total={89} color="bg-emerald-500" />
          <CategoryProgress label="Events" count={6} total={89} color="bg-purple-500" />
        </div>
      </div>
    </div>
  );
}

function ImpactCard({ 
  icon, 
  value, 
  label, 
  equivalent 
}: { 
  icon: string; 
  value: string; 
  label: string; 
  equivalent: string;
}) {
  return (
    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-900 mb-1">{value}</p>
      <p className="text-gray-600 mb-2">{label}</p>
      <p className="text-emerald-600">≈ {equivalent}</p>
    </div>
  );
}

function BadgeCard({ badge }: { badge: any }) {
  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${
      badge.earned 
        ? 'border-emerald-200 hover:shadow-md bg-white' 
        : 'border-gray-200 opacity-50 bg-gray-50'
    }`}>
      <div className={`text-4xl mb-2 ${badge.earned ? '' : 'grayscale'}`}>
        {badge.icon}
      </div>
      <p className="text-gray-900 mb-1">{badge.name}</p>
      <p className="text-gray-600 mb-2">{badge.description}</p>
      {badge.earned && badge.date && (
        <p className="text-emerald-600">{badge.date}</p>
      )}
      {!badge.earned && (
        <p className="text-gray-500">Locked</p>
      )}
    </div>
  );
}

function CategoryProgress({ 
  label, 
  count, 
  total, 
  color 
}: { 
  label: string; 
  count: number; 
  total: number; 
  color: string;
}) {
  const percentage = (count / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-600">{count} / {total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`${color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
