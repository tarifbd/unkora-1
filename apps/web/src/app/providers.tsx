'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { LanguageProvider } from '@/lib/i18n/language-context';
import { useAuthStore } from '@/store/auth.store';

function AuthLogoutHandler() {
  const { clearAuth } = useAuthStore();
  useEffect(() => {
    const handler = () => clearAuth();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearAuth]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AuthLogoutHandler />
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={3500}
          toastOptions={{
            style: { fontFamily: 'var(--font-sans)' },
            classNames: {
              toast: 'group',
            },
          }}
        />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </LanguageProvider>
  );
}
