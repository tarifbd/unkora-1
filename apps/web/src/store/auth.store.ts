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
        // If localStorage says "logged in" but the access_token cookie is gone
        // (e.g. after a DB wipe or server restart), clear the stale auth state
        // synchronously before the first render so no "logged in" flash occurs.
        if (state?.isAuthenticated && typeof document !== 'undefined') {
          const hasCookie = document.cookie.split(';').some((c) => c.trim().startsWith('access_token='));
          if (!hasCookie) {
            state.clearAuth();
          }
        }
      },
    },
  ),
);
