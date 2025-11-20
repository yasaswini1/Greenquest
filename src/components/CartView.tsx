import { useState } from 'react';
import { ShoppingBag, X, Trash2, CheckCircle2, ArrowLeft, Trophy, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';

interface CartViewProps {
  onBack: () => void;
}

export function CartView({ onBack }: CartViewProps) {
  const { items, removeFromCart, clearCart, getTotalPoints } = useCart();
  const { token, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

  const userPoints = profile?.stats.totalPoints ?? 0;
  const totalPoints = getTotalPoints();
  const canAfford = userPoints >= totalPoints;

  const handleCheckout = async () => {
    if (!token) {
      setError('You must be logged in to checkout');
      return;
    }

    if (!canAfford) {
      setError(`Insufficient points. You need ${totalPoints} points but only have ${userPoints}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Redeem all items in cart
      const redemptionIds: string[] = [];
      for (const item of items) {
        const result = await api.redeemReward(token, item.id, item.points);
        redemptionIds.push(result.redemption.id);
      }

      setPurchasedItems(items.map(i => i.id));
      setPurchaseSuccess(true);
      clearCart();
      
      // Refresh profile to update points
      await refreshProfile();

      // Auto-close success message after 5 seconds
      setTimeout(() => {
        setPurchaseSuccess(false);
        onBack();
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (purchaseSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Purchased!</h2>
          <p className="text-gray-600 mb-6">
            Your rewards have been redeemed. {totalPoints} points have been deducted from your account.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-emerald-800">
              <strong>Remaining Points:</strong> {userPoints - totalPoints} pts
            </p>
          </div>
          <button
            onClick={onBack}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some rewards to your cart to get started!</p>
          <button
            onClick={onBack}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Browse Rewards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-3">
          <X className="w-5 h-5 text-rose-600" />
          <p className="text-rose-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-medium mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="text-gray-900 font-medium">{item.points.toLocaleString()} pts</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                  aria-label="Remove from cart"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Items ({items.length})</span>
                <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between text-gray-900 font-semibold text-lg">
                <span>Total Points</span>
                <span>{totalPoints.toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Your Points</span>
                <span className={userPoints >= totalPoints ? 'text-emerald-600' : 'text-rose-600'}>
                  {userPoints.toLocaleString()} pts
                </span>
              </div>
              {!canAfford && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-800">
                  <p>You need {(totalPoints - userPoints).toLocaleString()} more points</p>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || !canAfford}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Checkout
                </>
              )}
            </button>

            <button
              onClick={onBack}
              className="w-full mt-3 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

