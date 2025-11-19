import React, { useEffect, useState } from 'react';
import { Globe, Lock, Image as ImageIcon, MapPin, Calendar, Heart, MessageCircle, Share2, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import type { Activity } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function FeedView() {
  const [activeTab, setActiveTab] = useState<'private' | 'public'>('private');
  const [posts, setPosts] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const loadFeed = async () => {
      if (!token) {
        setError('Please sign in to view the feed');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await api.fetchFeed(token, activeTab);
        setPosts(response.posts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [token, activeTab]);

  const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 text-2xl font-semibold">Activity Feed</h2>
          <p className="text-gray-600 mt-1">
            {activeTab === 'private' 
              ? 'View your private activities' 
              : 'See what others are doing for the planet'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg p-1 flex gap-1">
        <button
          onClick={() => setActiveTab('private')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'private'
              ? 'bg-emerald-50 text-emerald-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Lock className="w-4 h-4" />
          Private
        </button>
        <button
          onClick={() => setActiveTab('public')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'public'
              ? 'bg-emerald-50 text-emerald-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          Public
        </button>
      </div>

      {/* Feed Content */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-2 text-rose-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Loader className="w-8 h-8 text-emerald-600 mx-auto animate-spin" />
          <p className="text-gray-600 mt-4">Loading feed...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No posts yet. Be the first to share your eco-friendly activity!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const imageUrl = getImageUrl(post.image_path);
            return (
              <div key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Post Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {post.user_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{post.user_name || 'Anonymous'}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(post.event_time || post.created_at)}</span>
                          {post.location && (
                            <>
                              <span>·</span>
                              <MapPin className="w-3 h-3" />
                              <span>{post.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                      {post.type}
                    </div>
                  </div>
                </div>

                {/* Post Image */}
                {imageUrl && (
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={post.type}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Post Content */}
                <div className="p-4 space-y-3">
                  {post.description && (
                    <p className="text-gray-700">{post.description}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-emerald-600">+{post.points}</span>
                      <span>points</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-blue-600">{post.co2_saved.toFixed(1)} kg</span>
                      <span>CO₂ saved</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">Like</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

