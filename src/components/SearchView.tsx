import { useState, useEffect } from 'react';
import { Search, User, MapPin, Calendar, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import type { Activity } from '../types';

interface SearchResult {
  user: {
    id: string;
    name: string;
    email: string;
    points: number;
  };
  activities: Activity[];
}

interface SearchViewProps {
  initialQuery?: string;
}

export function SearchView({ initialQuery = '' }: SearchViewProps) {
  const { token } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-search if initial query provided
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchTerm?: string) => {
    const searchQuery = searchTerm || query.trim();
    if (!searchQuery) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await api.searchUsers(searchQuery, token || '');
      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for users by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <p className="text-rose-800">{error}</p>
        </div>
      )}

      {!loading && !error && hasSearched && results.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No users found matching "{query}"</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Found {results.length} user{results.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-sm text-gray-500">
              Showing public activities only
            </p>
          </div>

          {results.map((result) => (
            <div key={result.user.id} className="bg-white border border-gray-200 rounded-lg">
              {/* User Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{result.user.name}</p>
                      <p className="text-sm text-gray-500">{result.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Points</p>
                    <p className="font-semibold text-emerald-600">{result.user.points.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Activities */}
              <div className="divide-y divide-gray-200">
                {result.activities.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No public activities found for this user</p>
                  </div>
                ) : (
                  result.activities.map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{activity.type}</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">
                              {activity.category}
                            </span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              +{activity.points} pts
                            </span>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {activity.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{activity.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(activity.event_time || activity.created_at)}</span>
                            </div>
                            <span>{activity.co2_saved} kg CO₂</span>
                          </div>
                        </div>
                        {activity.image_path && (
                          <div className="flex-shrink-0">
                            <img
                              src={`http://localhost:4000${activity.image_path}`}
                              alt="Activity"
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasSearched && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Enter a user's name or email to search for their public activities</p>
        </div>
      )}
    </div>
  );
}

