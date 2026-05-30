'use client';

import { useEffect } from 'react';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth.store';
import { clearAuthTokens } from '@/lib/api';

export function SessionGuard() {
  const { isAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Verify the stored session is still valid against the server.
    // If the token is expired, revoked, or the DB was wiped, /users/me
    // returns 401 — at that point clear localStorage + cookies so the
    // stale "logged-in" state disappears automatically.
    authApi.getMe().catch(() => {
      clearAuth();
      clearAuthTokens();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  return null;
}
