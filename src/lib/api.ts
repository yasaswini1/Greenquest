import type { Activity, LeaderboardEntry, ProfileResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isFormData && options.body && !(options.body instanceof URLSearchParams)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = (data && data.message) || 'Request failed';
    throw new Error(error);
  }

  return data as T;
}

export async function register(name: string, email: string, password: string) {
  return request<{ token: string; user: any }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    },
  );
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: any; streakIncreased?: boolean; currentStreak?: number }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
  );
}

export async function fetchProfile(token: string): Promise<ProfileResponse> {
  return request<ProfileResponse>('/api/me', {}, token);
}

export async function fetchActivities(token: string): Promise<{ activities: Activity[] }> {
  return request<{ activities: Activity[] }>('/api/activities', {}, token);
}

export async function submitActivity(formData: FormData, token: string) {
  return request<{ activity: Activity; profile: ProfileResponse; geoBonus: number }>(
    '/api/activities',
    {
      method: 'POST',
      body: formData,
    },
    token,
  );
}

export async function fetchLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return request<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
}

export async function fetchFeed(token: string, scope: 'public' | 'private' = 'private'): Promise<{ posts: Activity[] }> {
  return request<{ posts: Activity[] }>(`/api/feed?scope=${scope}`, {}, token);
}

