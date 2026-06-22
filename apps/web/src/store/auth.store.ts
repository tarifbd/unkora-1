import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'unkora-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // Only clear auth if BOTH the cookie AND the refresh token are gone.
        // The access_token cookie may have expired (browser can delete it between
        // sessions) even when the refresh_token in localStorage is still valid.
        // In that case the API interceptor will transparently refresh on the
        // first API call — we must not pre-emptively clear the session here.
        if (state?.isAuthenticated && typeof document !== 'undefined') {
          const hasCookie = document.cookie.split(';').some((c) => c.trim().startsWith('access_token='));
          const hasRefresh = !!localStorage.getItem('refresh_token');
          if (!hasCookie && !hasRefresh) {
            state.clearAuth();
          }
        }
      },
    },
  ),
);
