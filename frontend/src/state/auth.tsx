import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { safeGet, safeRemove, safeSet } from '../lib/storage';

export type Role = 'user' | 'admin';

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => safeGet('pm_token'));

  const logout = () => {
    setUser(null);
    setToken(null);
    safeRemove('pm_token');
  };

  const setSession = (payload: any) => {
    const nextToken = payload?.token as string | undefined;
    if (nextToken) {
      safeSet('pm_token', nextToken);
      setToken(nextToken);
    }
    const nextUser: AuthUser = {
      _id: payload._id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
    setUser(nextUser);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setSession(res.data);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    setSession(res.data);
  };

  const refreshMe = async () => {
    if (!safeGet('pm_token')) return;
    const res = await api.get('/auth/me');
    setUser(res.data);
  };

  useEffect(() => {
    refreshMe().catch(() => {
      // token could be stale
      logout();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

