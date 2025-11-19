import { useEffect, useMemo, useState } from 'react';
import { Medal, TrendingUp, Globe, Users, Building2, Crown, MapPin } from 'lucide-react';
import * as api from '../lib/api';
import type { LeaderboardEntry } from '../types';
import { useAuth } from '../context/AuthContext';

export function LeaderboardView() {
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'company' | 'city'>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.fetchLeaderboard();
        setEntries(response.leaderboard);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const yourRank = useMemo(() => {
    if (!entries.length) return null;
    return entries.find((entry) => entry.id === user?.id) ?? entries[0];
  }, [entries, user]);

  const currentLeaderboard = useMemo(() => {
    if (activeTab === 'global') return entries;
    if (activeTab === 'friends') return entries.slice(0, 5);
    if (activeTab === 'company') return entries.slice(0, 8);
    return entries.slice(0, 5);
  }, [activeTab, entries]);

  return (
    <div className="space-y-6">
      {/* Your Rank Card */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white/90 mb-1">Your Rank</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl">
                  {yourRank ? `#${yourRank.rank}` : loading ? '…' : '—'}
                </span>
                {yourRank && (
                  <span className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                    <TrendingUp className="w-4 h-4" />
                    <span>Top performer</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <p className="text-white/80 mb-1">Points</p>
            <p className="text-xl">{yourRank ? yourRank.points.toLocaleString() : '—'}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <p className="text-white/80 mb-1">CO₂ Saved</p>
            <p className="text-xl">{yourRank ? `${yourRank.co2_saved.toFixed(1)} kg` : '—'}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <p className="text-white/80 mb-1">Trust Score</p>
            <p className="text-xl">{yourRank ? `${yourRank.trustScore}%` : '—'}</p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Tabs */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 overflow-x-auto">
            <TabButton
              icon={<Globe className="w-4 h-4" />}
              label="Global"
              active={activeTab === 'global'}
              onClick={() => setActiveTab('global')}
            />
            <TabButton
              icon={<Users className="w-4 h-4" />}
              label="Friends"
              active={activeTab === 'friends'}
              onClick={() => setActiveTab('friends')}
            />
            <TabButton
              icon={<Building2 className="w-4 h-4" />}
              label="Company"
              active={activeTab === 'company'}
              onClick={() => setActiveTab('company')}
            />
            <TabButton
              icon={<MapPin className="w-4 h-4" />}
              label="City"
              active={activeTab === 'city'}
              onClick={() => setActiveTab('city')}
            />
          </div>
        </div>

        {/* Header */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 hidden md:grid grid-cols-12 gap-4 text-gray-600">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">User</div>
          <div className="col-span-2">Points</div>
          <div className="col-span-2">CO₂ Saved</div>
          <div className="col-span-2">Activities</div>
          <div className="col-span-1">Trust</div>
        </div>

        {/* List */}
        {error && <div className="px-6 py-4 text-sm text-rose-600">{error}</div>}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="px-6 py-8 text-center text-gray-500">Loading leaderboard…</div>
          ) : currentLeaderboard.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">No leaderboard data yet.</div>
          ) : (
            currentLeaderboard.map((entry) => (
              <LeaderboardRow 
                key={entry.id} 
                entry={entry} 
                isYou={entry.id === user?.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-gray-900 mb-4">Total Community Impact</h3>
          <div className="space-y-3">
            <StatRow label="Total Users" value={entries.length ? entries.length.toString() : '—'} />
            <StatRow
              label="CO₂ Reduced"
              value={
                entries.length
                  ? `${entries.reduce((sum, entry) => sum + entry.co2_saved, 0).toFixed(1)} kg`
                  : '—'
              }
            />
            <StatRow
              label="Trees Equivalent"
              value={
                entries.length
                  ? `${entries.reduce((sum, entry) => sum + entry.points, 0) / 10}`
                  : '—'
              }
            />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-gray-900 mb-4">This Week</h3>
          <div className="space-y-3">
            <StatRow label="New Users" value="+2" />
            <StatRow
              label="Activities"
              value={
                entries.length
                  ? entries.reduce((sum, entry) => sum + entry.activities, 0).toString()
                  : '—'
              }
            />
            <StatRow
              label="CO₂ Saved"
              value={
                entries.length
                  ? `${entries.reduce((sum, entry) => sum + entry.co2_saved, 0).toFixed(1)} kg`
                  : '—'
              }
            />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-gray-900 mb-4">Top Categories</h3>
          <div className="space-y-3">
            <StatRow label="Transport" value="42%" />
            <StatRow label="Energy" value="28%" />
            <StatRow label="Plastic" value="18%" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function LeaderboardRow({ entry, isYou }: { entry: LeaderboardEntry; isYou: boolean }) {
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-gray-600">#{rank}</span>;
  };

  return (
    <div className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
      isYou ? 'bg-emerald-50 hover:bg-emerald-100' : ''
    }`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Rank */}
        <div className="col-span-1 flex items-center gap-2">
          {getRankDisplay(entry.rank)}
        </div>

        {/* User */}
        <div className="col-span-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-900">{entry.name}</span>
            {isYou && (
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-xs">You</span>
            )}
          </div>
        </div>

        {/* Points */}
        <div className="col-span-2">
          <p className="text-gray-900">{entry.points.toLocaleString()}</p>
          <p className="text-gray-500">points</p>
        </div>

        {/* CO2 */}
        <div className="col-span-2">
          <p className="text-gray-900">{entry.co2_saved.toFixed(1)} kg</p>
          <p className="text-gray-500">CO₂</p>
        </div>

        {/* Activities */}
        <div className="col-span-2">
          <p className="text-gray-900">{entry.activities}</p>
          <p className="text-gray-500">activities</p>
        </div>

        {/* Trust */}
        <div className="col-span-1">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${
              entry.trustScore >= 95 ? 'bg-emerald-500' : 
              entry.trustScore >= 85 ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
            <span className="text-gray-600">{entry.trustScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
