'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth';
import { saveUserRole } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: ({ user: u }) => {
      setUser(u);
      saveUserRole(u.role);
      void qc.invalidateQueries({ queryKey: ['cart'] });

      // Check for ?redirect= param in current URL
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect');

      if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('/admin')) {
        // Customer clicked Buy Now / Checkout while logged out → go there
        router.push(redirectTo);
      } else if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') {
        router.push(redirectTo ?? '/admin');
      } else {
        router.push(redirectTo ?? '/');
      }
    },
  });

  const register = useMutation({
    mutationFn: (data: Parameters<typeof authApi.register>[0]) =>
      authApi.register(data),
    onSuccess: ({ user: u }) => {
      setUser(u);
      router.push('/');
    },
  });

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth();
      qc.clear();
      router.push('/login');
    },
  });

  return { user, isAuthenticated, login, register, logout };
}
