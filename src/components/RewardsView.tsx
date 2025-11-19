import { Gift, Trophy, Star, ShoppingBag, Coffee, Ticket, Award, Sparkles } from 'lucide-react';

const rewards = [
  {
    id: '1',
    name: 'Local Coffee Shop Voucher',
    description: '$10 discount at participating eco-friendly cafes',
    points: 500,
    category: 'Food & Beverage',
    icon: Coffee,
    available: 50,
    redeemed: false,
  },
  {
    id: '2',
    name: 'Reusable Water Bottle',
    description: 'Premium stainless steel water bottle',
    points: 800,
    category: 'Merchandise',
    icon: Gift,
    available: 30,
    redeemed: false,
  },
  {
    id: '3',
    name: 'Tree Planting Certificate',
    description: 'Plant a real tree in your name',
    points: 1000,
    category: 'Impact',
    icon: Award,
    available: 100,
    redeemed: true,
  },
  {
    id: '4',
    name: 'Eco Event Access Pass',
    description: 'Free entry to sustainability workshops',
    points: 600,
    category: 'Events',
    icon: Ticket,
    available: 25,
    redeemed: false,
  },
  {
    id: '5',
    name: 'Sustainable Tote Bag',
    description: 'Organic cotton shopping bag',
    points: 400,
    category: 'Merchandise',
    icon: ShoppingBag,
    available: 40,
    redeemed: false,
  },
  {
    id: '6',
    name: 'Premium Member Badge',
    description: 'Exclusive profile badge and benefits',
    points: 2000,
    category: 'Digital',
    icon: Star,
    available: 999,
    redeemed: false,
  },
];

const redemptionHistory = [
  {
    id: '1',
    reward: 'Tree Planting Certificate',
    points: 1000,
    date: '2025-11-15',
    status: 'completed',
    code: 'TREE-2025-7892'
  },
  {
    id: '2',
    reward: 'Local Coffee Shop Voucher',
    points: 500,
    date: '2025-11-10',
    status: 'completed',
    code: 'COFFEE-2025-4563'
  },
  {
    id: '3',
    reward: 'Sustainable Tote Bag',
    points: 400,
    date: '2025-11-05',
    status: 'shipped',
    code: 'TOTE-2025-1234'
  },
];

export function RewardsView() {
  const userPoints = 4523;
  const totalRedeemed = redemptionHistory.reduce((sum, r) => sum + r.points, 0);

  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
          <Trophy className="w-8 h-8 mb-3" />
          <p className="text-emerald-100 mb-1">Available Points</p>
          <p className="text-3xl">{userPoints.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <Gift className="w-8 h-8 text-purple-600 mb-3" />
          <p className="text-gray-500 mb-1">Total Redeemed</p>
          <p className="text-gray-900">{totalRedeemed.toLocaleString()} pts</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <Sparkles className="w-8 h-8 text-amber-600 mb-3" />
          <p className="text-gray-500 mb-1">Rewards Unlocked</p>
          <p className="text-gray-900">{redemptionHistory.length} items</p>
        </div>
      </div>

      {/* Available Rewards */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-gray-900">Available Rewards</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <RewardCard 
              key={reward.id} 
              reward={reward} 
              userPoints={userPoints}
            />
          ))}
        </div>
      </div>

      {/* Redemption History */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Redemption History</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {redemptionHistory.map((item) => (
            <RedemptionRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-blue-900 mb-4">How Rewards Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-blue-800">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">1</div>
            <div>
              <p className="mb-1">Earn Points</p>
              <p className="text-blue-700">Complete verified eco-friendly activities</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">2</div>
            <div>
              <p className="mb-1">Choose Reward</p>
              <p className="text-blue-700">Browse available rewards and redeem</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">3</div>
            <div>
              <p className="mb-1">Enjoy Benefits</p>
              <p className="text-blue-700">Use your rewards and keep making impact</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RewardCard({ 
  reward, 
  userPoints 
}: { 
  reward: any; 
  userPoints: number;
}) {
  const Icon = reward.icon;
  const canAfford = userPoints >= reward.points;

  return (
    <div className={`border-2 rounded-lg p-5 transition-all ${
      reward.redeemed 
        ? 'border-emerald-200 bg-emerald-50' 
        : canAfford 
        ? 'border-gray-200 hover:border-emerald-500 hover:shadow-md' 
        : 'border-gray-200 opacity-60'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
          {reward.category}
        </span>
      </div>

      <h3 className="text-gray-900 mb-2">{reward.name}</h3>
      <p className="text-gray-600 mb-4">{reward.description}</p>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span className="text-gray-900">{reward.points.toLocaleString()} pts</span>
        </div>
        <span className="text-gray-500">{reward.available} available</span>
      </div>

      {reward.redeemed ? (
        <button 
          disabled
          className="w-full bg-emerald-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <Award className="w-4 h-4" />
          Redeemed
        </button>
      ) : canAfford ? (
        <button className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors">
          Redeem Now
        </button>
      ) : (
        <button 
          disabled
          className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed"
        >
          Need {(reward.points - userPoints).toLocaleString()} more pts
        </button>
      )}
    </div>
  );
}

function RedemptionRow({ item }: { item: any }) {
  const statusConfig = {
    completed: { color: 'text-emerald-600 bg-emerald-50', label: 'Completed' },
    shipped: { color: 'text-blue-600 bg-blue-50', label: 'Shipped' },
    pending: { color: 'text-amber-600 bg-amber-50', label: 'Pending' },
  };

  const config = statusConfig[item.status as keyof typeof statusConfig];

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 mb-1">{item.reward}</p>
          <div className="flex items-center gap-3 text-gray-500">
            <span>{new Date(item.date).toLocaleDateString()}</span>
            <span>·</span>
            <span>{item.points} points</span>
            <span>·</span>
            <span className="font-mono text-xs">{item.code}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full ${config.color} flex-shrink-0`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
