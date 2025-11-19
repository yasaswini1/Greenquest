export type ActivityStatus = 'verified' | 'pending' | 'flagged';

export type Visibility = 'public' | 'community' | 'private';

export interface Activity {
  id: string;
  user_id: string;
  user_name?: string;
  type: string;
  category: string;
  description?: string | null;
  points: number;
  co2_saved: number;
  status: ActivityStatus;
  image_path?: string | null;
  event_time?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geo_accuracy?: number | null;
  visibility?: Visibility;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  co2_saved: number;
  avatar_url?: string | null;
  current_streak?: number;
  created_at: string;
}

export interface ProfileStats {
  totalPoints: number;
  totalActivities: number;
  co2Saved: number;
  streakDays: number;
}

export interface ForestProgress {
  trees: number;
  progressToNext: number;
  pointsToNext: number;
}

export interface ProfileResponse {
  user: User;
  stats: ProfileStats;
  forest: ForestProgress;
  recentActivities: Activity[];
}

export interface LeaderboardEntry extends User {
  rank: number;
  activities: number;
  trustScore: number;
}

