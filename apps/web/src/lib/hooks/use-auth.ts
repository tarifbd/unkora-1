'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '../api/auth';
import { saveUserRole } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

function apiErrMsg(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? fallback;
  return msg ?? fallback;
}

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

      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect');

      if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('/admin')) {
        router.push(redirectTo);
      } else if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') {
        router.push(redirectTo ?? '/admin');
      } else if (u.role === 'SELLER') {
        router.push('/seller/dashboard');
      } else {
        router.push(redirectTo ?? '/');
      }
    },
    onError: (err) => toast.error(apiErrMsg(err, 'ইমেইল বা পাসওয়ার্ড সঠিক নয়')),
  });

  const register = useMutation({
    mutationFn: (data: Parameters<typeof authApi.register>[0]) =>
      authApi.register(data),
    onSuccess: ({ user: u }) => {
      setUser(u);
      saveUserRole(u.role);
      toast.success('অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম 🎉');
      router.push('/');
    },
    onError: (err) => toast.error(apiErrMsg(err, 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')),
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
