import { useState, useEffect } from 'react';
import { Target, Trophy, CheckCircle2, Clock, Zap, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  target_unit: string;
  bonus_points: number;
  challenge_date: string;
  user_completed: number;
  user_bonus_earned?: number;
}

export function DailyChallengesView() {
  const { token } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const response = await api.fetchChallenges(token || '');
      setChallenges(response.challenges);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (challengeId: string, activityId?: string) => {
    if (!activityId) {
      alert('Please submit an activity first that meets the challenge requirements');
      return;
    }

    try {
      setCompleting(challengeId);
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

      const response = await api.completeChallenge(
        token || '',
        challengeId,
        activityId,
        challenge.target_value,
        challenge.target_unit
      );

      alert(response.message);
      await loadChallenges();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to complete challenge');
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No challenges available today. Check back tomorrow!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Daily Challenges</h2>
          <p className="text-gray-600">Complete challenges for bonus points!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((challenge) => {
          const isCompleted = challenge.user_completed > 0;
          
          return (
            <div
              key={challenge.id}
              className={`bg-white border-2 rounded-lg p-6 ${
                isCompleted
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300 transition-colors'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className={`w-5 h-5 ${isCompleted ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                </div>
                {isCompleted && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Target</p>
                    <p className="font-semibold text-gray-900">
                      {challenge.target_value} {challenge.target_unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Bonus</p>
                    <p className="font-semibold text-emerald-600">
                      +{challenge.bonus_points} pts
                    </p>
                  </div>
                </div>

                {isCompleted ? (
                  <div className="bg-emerald-100 border border-emerald-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-emerald-800">
                      ✓ Completed! +{challenge.user_bonus_earned || challenge.bonus_points} bonus points earned
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Submit an activity that meets this target</span>
                    </div>
                    <button
                      onClick={() => {
                        // Navigate to submit activity with challenge pre-selected
                        window.location.href = '/#submit';
                      }}
                      className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                    >
                      Start Challenge
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

