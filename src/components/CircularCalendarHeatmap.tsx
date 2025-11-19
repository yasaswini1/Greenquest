import React, { useMemo } from 'react';
import { Calendar, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import type { Activity as ActivityType } from '../types';

export function CircularCalendarHeatmap() {
  const { token, profile } = useAuth();
  const [activities, setActivities] = React.useState<ActivityType[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadActivities = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.fetchActivities(token);
        setActivities(response.activities);
      } catch (err) {
        console.error('Failed to load activities:', err);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, [token]);

  // Color mapping for different activity categories
  const getCategoryColor = (category: string): string => {
    const categoryMap: Record<string, string> = {
      transport: '#3B82F6', // Blue
      energy: '#F59E0B',     // Amber
      water: '#06B6D4',      // Cyan
      waste: '#8B5CF6',      // Purple
      food: '#10B981',       // Emerald
      tree: '#059669',       // Dark Green
      event: '#EC4899',      // Pink
    };
    return categoryMap[category.toLowerCase()] || '#6B7280'; // Gray for unknown
  };

  // Process activities by date with categories
  const activityMap = useMemo(() => {
    const map = new Map<string, Array<{ category: string; type: string }>>();
    
    activities.forEach((activity) => {
      const dateStr = activity.event_time 
        ? new Date(activity.event_time).toISOString().split('T')[0]
        : new Date(activity.created_at).toISOString().split('T')[0];
      
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push({
        category: activity.category,
        type: activity.type,
      });
    });
    
    return map;
  }, [activities]);

  // Generate last 30 days of data
  const dailyData = useMemo(() => {
    const days: Array<{ 
      date: Date; 
      activities: Array<{ category: string; type: string }>;
      primaryCategory: string;
    }> = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayActivities = activityMap.get(dateStr) || [];
      
      // Find primary category (most frequent)
      const categoryCounts = new Map<string, number>();
      dayActivities.forEach(a => {
        categoryCounts.set(a.category, (categoryCounts.get(a.category) || 0) + 1);
      });
      let primaryCategory = '';
      let maxCount = 0;
      categoryCounts.forEach((count, category) => {
        if (count > maxCount) {
          maxCount = count;
          primaryCategory = category;
        }
      });
      
      days.push({
        date,
        activities: dayActivities,
        primaryCategory: primaryCategory || 'none',
      });
    }
    
    return days;
  }, [activityMap]);

  // Calculate positions for circular layout with multiple rings
  const getCircularPositions = (totalDays: number) => {
    const positions: Array<{ angle: number; radius: number }> = [];
    
    // Create two concentric rings (inner and outer)
    const innerCount = Math.floor(totalDays / 2);
    const outerCount = totalDays - innerCount;
    const innerRadius = 30;
    const outerRadius = 42;
    
    // Inner ring
    for (let i = 0; i < innerCount; i++) {
      const angle = (i / innerCount) * Math.PI * 2;
      positions.push({ angle, radius: innerRadius });
    }
    
    // Outer ring
    for (let i = 0; i < outerCount; i++) {
      const angle = (i / outerCount) * Math.PI * 2;
      positions.push({ angle, radius: outerRadius });
    }
    
    return positions;
  };

  const positions = getCircularPositions(dailyData.length);
  const centerX = 50;
  const centerY = 50;

  const totalActivities = dailyData.reduce((sum, d) => sum + d.activities.length, 0);
  const activeDays = dailyData.filter(d => d.activities.length > 0).length;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-lg border border-emerald-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-700" />
          <h3 className="text-emerald-900 font-semibold text-lg">Activity Calendar</h3>
        </div>
        <div className="text-sm text-emerald-700">
          <strong>{activeDays}</strong> active day{activeDays !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="relative bg-white rounded-xl p-8 min-h-[400px] flex items-center justify-center">
        {loading ? (
          <div className="text-center text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p>Loading activities...</p>
          </div>
        ) : dailyData.length === 0 ? (
          <div className="text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No activities yet</p>
            <p className="text-gray-500 text-sm mt-1">Start logging activities to see your calendar!</p>
          </div>
        ) : (
          <div className="relative w-full max-w-md aspect-square">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Draw squares in circular pattern */}
              {dailyData.map((day, index) => {
                const pos = positions[index];
                const x = centerX + Math.cos(pos.angle - Math.PI / 2) * pos.radius;
                const y = centerY + Math.sin(pos.angle - Math.PI / 2) * pos.radius;
                const squareSize = 2.8;
                
                // Get color based on primary category or gray if no activities
                const color = day.activities.length > 0 
                  ? getCategoryColor(day.primaryCategory)
                  : '#E5E7EB'; // Light gray for no activities
                
                const activityTypes = day.activities.map(a => a.type).join(', ');
                
                return (
                  <g key={index}>
                    <rect
                      x={x - squareSize / 2}
                      y={y - squareSize / 2}
                      width={squareSize}
                      height={squareSize}
                      fill={color}
                      className="transition-all duration-200 hover:opacity-80"
                      style={{ cursor: 'pointer' }}
                      rx="0.3"
                    >
                      <title>
                        {day.date.toLocaleDateString()}: {day.activities.length} activit{day.activities.length !== 1 ? 'ies' : 'y'}
                        {activityTypes && ` - ${activityTypes}`}
                      </title>
                    </rect>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Legend and Stats */}
      <div className="mt-4 space-y-3">
        <div className="bg-white rounded-lg p-3 border border-emerald-200">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-emerald-700">Total Activities (Last 30 Days)</span>
            <span className="text-emerald-900 font-semibold">{totalActivities}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-700">Active Days</span>
            <span className="text-emerald-900 font-semibold">{activeDays} / 30</span>
          </div>
        </div>

        {/* Category Color Legend */}
        <div className="bg-white rounded-lg p-3 border border-emerald-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Activity Categories</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3B82F6' }} />
              <span className="text-gray-600">Transport</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#F59E0B' }} />
              <span className="text-gray-600">Energy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#06B6D4' }} />
              <span className="text-gray-600">Water</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8B5CF6' }} />
              <span className="text-gray-600">Waste</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }} />
              <span className="text-gray-600">Food</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#059669' }} />
              <span className="text-gray-600">Tree</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EC4899' }} />
              <span className="text-gray-600">Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-200" />
              <span className="text-gray-600">No Activity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

