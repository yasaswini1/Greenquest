import { Target, Trophy, Users, Clock, TrendingUp, Check, Lock } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'community';
  progress: number;
  target: number;
  reward: number;
  deadline: string;
  participants?: number;
  status: 'active' | 'completed' | 'locked';
}

const challenges: Challenge[] = [
  {
    id: '1',
    title: 'Zero Car Week',
    description: 'Go 7 days without using a car',
    type: 'weekly',
    progress: 4,
    target: 7,
    reward: 200,
    deadline: '3 days left',
    status: 'active'
  },
  {
    id: '2',
    title: 'Plant-Based Pioneer',
    description: 'Eat 5 plant-based meals this week',
    type: 'weekly',
    progress: 3,
    target: 5,
    reward: 150,
    deadline: '5 days left',
    status: 'active'
  },
  {
    id: '3',
    title: 'Energy Saver',
    description: 'Reduce energy usage by 20% today',
    type: 'daily',
    progress: 15,
    target: 20,
    reward: 50,
    deadline: 'Today',
    status: 'active'
  },
  {
    id: '4',
    title: 'Recycle Champion',
    description: 'Recycle 10 items this week',
    type: 'weekly',
    progress: 10,
    target: 10,
    reward: 100,
    deadline: 'Completed',
    status: 'completed'
  },
  {
    id: '5',
    title: 'Community Clean-Up',
    description: 'Join 1000 people in reducing 500kg CO₂',
    type: 'community',
    progress: 347,
    target: 500,
    reward: 500,
    deadline: '14 days left',
    participants: 1847,
    status: 'active'
  },
  {
    id: '6',
    title: 'Elite Eco Warrior',
    description: 'Reach 5000 total points to unlock',
    type: 'weekly',
    progress: 0,
    target: 100,
    reward: 1000,
    deadline: 'Locked',
    status: 'locked'
  },
];

export function ChallengesView() {
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');
  const lockedChallenges = challenges.filter(c => c.status === 'locked');

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8" />
            <div>
              <p className="text-blue-100">Active</p>
              <p>{activeChallenges.length} Challenges</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <p className="text-green-100">Completed</p>
              <p>{completedChallenges.length} Challenges</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8" />
            <div>
              <p className="text-amber-100">Total Rewards</p>
              <p>850 Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Challenges */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
        <h2 className="text-emerald-900 mb-6">Active Challenges</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </div>

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h3 className="text-emerald-900 mb-6">Completed Challenges</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {/* Locked Challenges */}
      {lockedChallenges.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
          <h3 className="text-emerald-900 mb-6">Locked Challenges</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lockedChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const progressPercentage = (challenge.progress / challenge.target) * 100;
  
  const typeColors = {
    daily: 'bg-blue-500',
    weekly: 'bg-purple-500',
    community: 'bg-pink-500',
  };

  const typeLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    community: 'Community',
  };

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${
      challenge.status === 'completed' 
        ? 'border-green-500 bg-green-50' 
        : challenge.status === 'locked'
        ? 'border-gray-300 bg-gray-50 opacity-60'
        : 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-md'
    }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`${typeColors[challenge.type]} text-white px-2 py-1 rounded-full`}>
                {typeLabels[challenge.type]}
              </span>
              {challenge.status === 'completed' && (
                <span className="bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Done
                </span>
              )}
              {challenge.status === 'locked' && (
                <span className="bg-gray-400 text-white px-2 py-1 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
            </div>
            <h3 className="text-emerald-900 mb-1">{challenge.title}</h3>
            <p className="text-emerald-600">{challenge.description}</p>
          </div>
        </div>

        {/* Progress */}
        {challenge.status !== 'locked' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-700">
                {challenge.progress} / {challenge.target}
              </span>
              <span className="text-emerald-600">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-3">
              <div 
                className={`${challenge.status === 'completed' ? 'bg-green-500' : 'bg-gradient-to-r from-emerald-500 to-teal-600'} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-amber-600">
              <Trophy className="w-4 h-4" />
              <span>+{challenge.reward}</span>
            </div>
            {challenge.participants && (
              <div className="flex items-center gap-1 text-emerald-600">
                <Users className="w-4 h-4" />
                <span>{challenge.participants.toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-emerald-600">
            <Clock className="w-4 h-4" />
            <span>{challenge.deadline}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
