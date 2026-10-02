/**
 * NEIMAN Auth Store — Zustand
 * Manages JWT token, current user, and active company context.
 */
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface NexoraUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface NexoraCompany {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  mission?: string | null;
  vision?: string | null;
  industry?: string | null;
  status: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  token: string | null;
  user: NexoraUser | null;
  activeCompany: NexoraCompany | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setToken: (token: string | null) => void;
  setUser: (user: NexoraUser | null) => void;
  setActiveCompany: (company: NexoraCompany | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeCompany: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setToken: (token) =>
        set({ token, isAuthenticated: !!token }),

      setUser: (user) =>
        set({ user }),

      setActiveCompany: (company) =>
        set({ activeCompany: company }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      logout: () =>
        set({
          token: null,
          user: null,
          activeCompany: null,
          isAuthenticated: false,
          error: null,
        }),
    }),
    {
      name: 'NEIMAN-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        activeCompany: state.activeCompany,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
