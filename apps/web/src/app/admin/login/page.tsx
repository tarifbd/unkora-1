'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';
import { clearAuthTokens } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser, isAuthenticated, user, clearAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      router.replace('/admin');
    } else if (isAuthenticated) {
      // Logged in as non-admin — clear and stay on this page
      clearAuth();
      clearAuthTokens();
    }
  }, [isAuthenticated, user, router, clearAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user: loggedIn } = await authApi.login(email, password);

      if (loggedIn.role !== 'ADMIN' && loggedIn.role !== 'SUPER_ADMIN') {
        // Immediately revoke — customer/seller accounts not allowed here
        clearAuthTokens();
        setError('এই অ্যাকাউন্টে অ্যাডমিন অ্যাক্সেস নেই। Customer login: /login');
        return;
      }

      setUser(loggedIn);
      router.push('/admin');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const raw = Array.isArray(msg) ? msg[0] : msg;
      setError(raw ?? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
          </div>
          <h1 className="font-serif text-3xl font-black text-white tracking-wide">UNKORA</h1>
          <p className="text-sm text-gray-400 mt-1">Admin Panel · Restricted Access</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">Admin Sign In</h2>
          <p className="text-xs text-gray-500 mb-6">
            Only <span className="text-orange-400 font-semibold">ADMIN</span> and{' '}
            <span className="text-orange-400 font-semibold">SUPER_ADMIN</span> accounts can access this panel.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-900/40 border border-red-700/50 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="admin@unkora.com"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In to Admin'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-600">
          Customer?{' '}
          <a href="/login" className="text-gray-400 hover:text-orange-400 underline transition-colors">
            Go to customer login
          </a>
        </p>
      </div>
    </div>
  );
}
