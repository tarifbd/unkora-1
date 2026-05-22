'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth';
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
      void qc.invalidateQueries({ queryKey: ['cart'] });
      router.push(u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? '/admin' : '/');
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
