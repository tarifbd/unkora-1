'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

// Auth guard for the Recommerce seller area. Previously this tree had no
// layout at all, so the seller dashboard was reachable unauthenticated.
// Server-side data is already user-scoped by the API; this gates the UI shell.
export default function RecommerceSellerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/recommerce/login?as=seller&redirect=' + encodeURIComponent(pathname));
    }
  }, [hydrated, isAuthenticated, router, pathname]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return <>{children}</>;
}
