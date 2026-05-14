import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { UserDto } from '@unkora/types';

interface AuthState {
  user: UserDto | null;
  isAuthenticated: boolean;
  setUser: (user: UserDto | null) => void;
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
    },
  ),
);
