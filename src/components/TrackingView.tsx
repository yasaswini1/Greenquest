import React, { useState } from 'react';
import { Car, Bike, Bus, Zap, Droplet, Utensils, ShoppingBag, Recycle, Plus, Check, AlertTriangle } from 'lucide-react';
import Forest from './Forest';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

interface Action {
  id: string;
  name: string;
  category: string;
  apiCategory: 'transport' | 'energy' | 'water' | 'food' | 'waste' | 'tree' | 'event';
  icon: React.ElementType;
  points: number;
  co2Saved: number;
  color: string;
}

const actions: Action[] = [
  { id: '1', name: 'Used Public Transport', category: 'Transport', apiCategory: 'transport', icon: Bus, points: 25, co2Saved: 2.5, color: 'bg-blue-500' },
  { id: '2', name: 'Cycled to Work', category: 'Transport', apiCategory: 'transport', icon: Bike, points: 30, co2Saved: 3.2, color: 'bg-blue-600' },
  { id: '3', name: 'Walked Instead of Driving', category: 'Transport', apiCategory: 'transport', icon: Car, points: 20, co2Saved: 2.0, color: 'bg-blue-400' },
  { id: '4', name: 'Turned Off Lights', category: 'Energy', apiCategory: 'energy', icon: Zap, points: 15, co2Saved: 1.2, color: 'bg-yellow-500' },
  { id: '5', name: 'Used Cold Water', category: 'Water', apiCategory: 'water', icon: Droplet, points: 10, co2Saved: 0.8, color: 'bg-cyan-500' },
  { id: '6', name: 'Plant-Based Meal', category: 'Food', apiCategory: 'food', icon: Utensils, points: 30, co2Saved: 3.5, color: 'bg-green-500' },
  { id: '7', name: 'Brought Reusable Bag', category: 'Waste', apiCategory: 'waste', icon: ShoppingBag, points: 15, co2Saved: 0.5, color: 'bg-purple-500' },
  { id: '8', name: 'Recycled Waste', category: 'Waste', apiCategory: 'waste', icon: Recycle, points: 20, co2Saved: 1.5, color: 'bg-emerald-500' },
];

export function TrackingView() {
  const [loggedActions, setLoggedActions] = useState<Record<string, number>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [loggingAction, setLoggingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token, profile, refreshProfile } = useAuth();

  const handleLogAction = async (action: Action) => {
    if (!token) {
      setError('Please sign in to log actions.');
      return;
    }
    setLoggingAction(action.id);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('type', action.name);
      formData.append('category', action.apiCategory);
      formData.append('description', `Quick log: ${action.name}`);
      formData.append('points', String(action.points));
      formData.append('co2Saved', String(action.co2Saved));
      await api.submitActivity(formData, token);
      setLoggedActions((prev) => ({ ...prev, [action.id]: (prev[action.id] || 0) + 1 }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log action');
    } finally {
      setLoggingAction(null);
    }
  };

  const totalPoints = profile?.stats.totalPoints ?? 0;
  const totalCO2 = profile?.stats.co2Saved ?? 0;
  const actionsToday = (Object.values(loggedActions) as number[]).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-24 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in z-50">
          <Check className="w-5 h-5" />
          <span>Action logged successfully! 🎉</span>
        </div>
      )}

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-emerald-100 mb-1">Actions Today</p>
          <p>{actionsToday}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-amber-100 mb-1">Points Earned</p>
          <p>{totalPoints}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-green-100 mb-1">CO₂ Saved</p>
          <p>{totalCO2.toFixed(1)} kg</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
        <h2 className="text-emerald-900 mb-6">Log Your Eco-Friendly Actions</h2>
        
        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action) => {
            const timesLogged = loggedActions[action.id] || 0;
            return (
              <ActionCard
                key={action.id}
                action={action}
                timesLogged={timesLogged}
                onLog={() => handleLogAction(action)}
                disabled={loggingAction === action.id}
              />
            );
          })}
        </div>
      </div>

      {/* Custom Action */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
        <h3 className="text-emerald-900 mb-4">Custom Action</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Describe your eco-friendly action..."
            className="flex-1 px-4 py-3 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-5 h-5" />
            Add
          </button>
        </div>
      </div>

      {/* Forest (1 tree per 10 points) */}
      <div>
        <Forest trees={profile?.forest.trees ?? 0} progressToNext={profile?.forest.progressToNext ?? 0} />
      </div>
    </div>
  );
}

interface ActionCardProps {
  action: Action;
  timesLogged: number;
  onLog: () => void | Promise<void>;
  disabled: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ 
  action, 
  timesLogged, 
  onLog,
  disabled
}) => {
  const Icon = action.icon;
  const isLogged = timesLogged > 0;
  
  return (
    <div className={`relative overflow-hidden rounded-xl border-2 transition-all ${
      isLogged 
        ? 'border-green-500 bg-green-50' 
        : 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-md'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shadow-md`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-emerald-900">{action.name}</p>
              <p className="text-emerald-600">{action.category}</p>
            </div>
          </div>
          {timesLogged > 0 && (
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm">
              {timesLogged}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-emerald-600">Points</p>
              <p className="text-amber-600">+{action.points}</p>
            </div>
            <div>
              <p className="text-emerald-600">CO₂ Saved</p>
              <p className="text-green-600">{action.co2Saved} kg</p>
            </div>
          </div>
        </div>

        <button
          onClick={onLog}
          disabled={disabled}
          className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {disabled ? 'Logging...' : 'Log Action'}
        </button>
        {timesLogged > 0 && (
          <div className="mt-2 text-sm text-emerald-700">Logged {timesLogged} time(s)</div>
        )}
      </div>
    </div>
  );
};
