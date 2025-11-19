import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import * as api from '../lib/api';
import type { ProfileResponse, User } from '../types';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  profile: ProfileResponse | null;
  loading: boolean;
  error: string | null;
  streakNotification: { streak: number; show: boolean } | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  dismissStreakNotification: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'ecoScoreToken';

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);
  const [error, setError] = useState<string | null>(null);
  const [streakNotification, setStreakNotification] = useState<{ streak: number; show: boolean } | null>(null);

  const applyToken = useCallback((nextToken: string | null) => {
    setToken(nextToken);
    if (nextToken) {
      localStorage.setItem(STORAGE_KEY, nextToken);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const fetchProfile = useCallback(
    async (overrideToken?: string) => {
      const activeToken = overrideToken ?? token;
      if (!activeToken) return;

      setLoading(true);
      setError(null);

      try {
        const data = await api.fetchProfile(activeToken);
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        applyToken(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    },
    [applyToken, token],
  );

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.login(email, password);
        const { token: nextToken, streakIncreased, currentStreak } = response;
        applyToken(nextToken);
        await fetchProfile(nextToken);
        
        // Show streak notification if streak increased
        if (streakIncreased && currentStreak) {
          setStreakNotification({ streak: currentStreak, show: true });
          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            setStreakNotification((prev) => prev ? { ...prev, show: false } : null);
          }, 5000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applyToken, fetchProfile],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const { token: nextToken } = await api.register(name, email, password);
        applyToken(nextToken);
        await fetchProfile(nextToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [applyToken, fetchProfile],
  );

  const logout = useCallback(() => {
    applyToken(null);
    setProfile(null);
    setError(null);
    setStreakNotification(null);
  }, [applyToken]);

  const dismissStreakNotification = useCallback(() => {
    setStreakNotification(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user: profile?.user ?? null,
      profile,
      loading,
      error,
      streakNotification,
      login,
      register,
      logout,
      refreshProfile: fetchProfile,
      dismissStreakNotification,
    }),
    [token, profile, loading, error, streakNotification, login, register, logout, fetchProfile, dismissStreakNotification],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

