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
  return request<{ 
    activity: Activity; 
    profile: ProfileResponse; 
    geoBonus: number;
    aiVerification?: {
      score: number;
      label: string;
      matches: boolean;
      confidence: number;
    };
    challengeCompleted?: {
      challengeId: string;
      title: string;
      bonusPoints: number;
    };
  }>(
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

// Ticket functions
export async function createTicket(formData: FormData, token: string) {
  return request<{ ticket: any; message: string }>(
    '/api/tickets',
    {
      method: 'POST',
      body: formData,
    },
    token,
  );
}

export async function fetchTickets(token: string) {
  return request<{ tickets: any[] }>('/api/tickets', {}, token);
}

// Admin functions
export async function adminLogin(email: string, password: string) {
  return request<{ token: string; user: any }>(
    '/api/auth/admin/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
  );
}

export async function fetchAdminTickets(token: string, status?: string) {
  const url = status ? `/api/admin/tickets?status=${status}` : '/api/admin/tickets';
  return request<{ tickets: any[] }>(url, {}, token);
}

export async function fetchAdminTicketDetails(token: string, ticketId: string) {
  return request<{ ticket: any; evidence: any[] }>(`/api/admin/tickets/${ticketId}`, {}, token);
}

export async function reviewTicket(token: string, ticketId: string, action: 'approve' | 'reject', newPoints?: number, notes?: string) {
  return request<{ ticket: any; message: string }>(
    `/api/admin/tickets/${ticketId}/review`,
    {
      method: 'POST',
      body: JSON.stringify({ action, newPoints, notes }),
    },
    token,
  );
}

// Challenge functions
export async function fetchChallenges(token: string) {
  return request<{ challenges: any[] }>('/api/challenges', {}, token);
}

export async function completeChallenge(token: string, challengeId: string, activityId: string, evidenceValue: number, evidenceUnit: string) {
  return request<{ completion: any; bonusPoints: number; message: string }>(
    `/api/challenges/${challengeId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({ activityId, evidenceValue, evidenceUnit }),
    },
    token,
  );
}

// Search functions
export async function searchUsers(query: string, token: string) {
  return request<{ results: any[] }>(`/api/search?q=${encodeURIComponent(query)}`, {}, token);
}

// Reward functions
export async function redeemReward(token: string, rewardId: string, points: number) {
  return request<{ redemption: any; message: string }>(
    '/api/rewards/redeem',
    {
      method: 'POST',
      body: JSON.stringify({ rewardId, points }),
    },
    token,
  );
}

// Delete activity
export async function deleteActivity(activityId: string, token: string) {
  return request<{ message: string }>(
    `/api/activities/${activityId}`,
    {
      method: 'DELETE',
    },
    token,
  );
}

