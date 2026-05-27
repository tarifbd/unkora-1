import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

/**
 * Returns the current admin's access token from localStorage.
 * Redirects to /login if not authenticated or not an admin.
 */
export function useAdminAuth() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
      router.push('/login');
      return;
    }
    const t = typeof window !== 'undefined' ? (localStorage.getItem('access_token') ?? '') : '';
    setToken(t);
  }, [isAuthenticated, user, router]);

  return { token, user };
}
