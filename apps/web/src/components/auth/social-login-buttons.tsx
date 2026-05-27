'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? '';

declare global {
  interface Window {
    google?: any;
    FB?: any;
  }
}

interface SocialLoginButtonsProps {
  onSuccess?: (tokens: { accessToken: string; refreshToken: string }) => void;
  redirectTo?: string;
}

export function SocialLoginButtons({ onSuccess, redirectTo = '/account' }: SocialLoginButtonsProps) {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    if (!GOOGLE_CLIENT_ID) { toast.error('Google login not configured'); return; }
    setLoadingGoogle(true);
    try {
      await new Promise<void>((resolve) => {
        if (window.google) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => resolve();
        document.head.appendChild(script);
      });

      const idToken = await new Promise<string>((resolve, reject) => {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => response.credential ? resolve(response.credential) : reject(new Error('No credential')),
        });
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback: use popup
            window.google.accounts.id.renderButton(document.createElement('div'), { type: 'standard' });
          }
        });
      });

      const res = await fetch(`${API}/auth/social/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Google login failed');
      localStorage.setItem('access_token', data.data?.tokens?.accessToken ?? data.tokens?.accessToken);
      toast.success('Logged in with Google!');
      onSuccess?.(data.data?.tokens ?? data.tokens);
      router.push(redirectTo);
    } catch (e: any) {
      toast.error(e.message ?? 'Google login failed');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleFacebookLogin = async () => {
    if (!FACEBOOK_APP_ID) { toast.error('Facebook login not configured'); return; }
    setLoadingFacebook(true);
    try {
      await new Promise<void>((resolve) => {
        if (window.FB) { resolve(); return; }
        (window as any).fbAsyncInit = () => {
          window.FB!.init({ appId: FACEBOOK_APP_ID, cookie: true, xfbml: false, version: 'v18.0' });
          resolve();
        };
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        document.head.appendChild(script);
      });

      const accessToken = await new Promise<string>((resolve, reject) => {
        window.FB!.login((response: any) => {
          if (response.authResponse?.accessToken) resolve(response.authResponse.accessToken);
          else reject(new Error('Facebook login cancelled'));
        }, { scope: 'email,public_profile' });
      });

      const res = await fetch(`${API}/auth/social/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Facebook login failed');
      localStorage.setItem('access_token', data.data?.tokens?.accessToken ?? data.tokens?.accessToken);
      toast.success('Logged in with Facebook!');
      onSuccess?.(data.data?.tokens ?? data.tokens);
      router.push(redirectTo);
    } catch (e: any) {
      toast.error(e.message ?? 'Facebook login failed');
    } finally {
      setLoadingFacebook(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 font-medium">or continue with</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50"
        >
          {loadingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Google
        </button>

        {/* Facebook */}
        <button
          onClick={handleFacebookLogin}
          disabled={loadingFacebook}
          className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50"
        >
          {loadingFacebook ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <svg className="h-4 w-4 text-blue-600 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
          Facebook
        </button>
      </div>
    </div>
  );
}
