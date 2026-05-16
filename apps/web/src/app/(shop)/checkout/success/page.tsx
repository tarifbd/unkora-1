'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLanguage } from '@/lib/i18n/language-context';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { isAuthenticated } = useAuthStore();
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
      </div>

      <h1 className="mb-2 font-serif text-3xl font-bold">{t.checkoutSuccess.title}</h1>
      <p className="mb-2 text-muted-foreground">{t.checkoutSuccess.thankYou}</p>
      {orderId && (
        <p className="mb-6 text-sm text-muted-foreground">
          {t.checkoutSuccess.orderId} <span className="font-mono font-medium text-foreground">{orderId.slice(0, 8).toUpperCase()}</span>
        </p>
      )}

      <div className="mb-8 rounded-xl border bg-muted/30 p-6 text-left space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <Package className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
          <div>
            <p className="font-medium">{t.checkoutSuccess.whatHappensNext}</p>
            <p className="text-muted-foreground">{t.checkoutSuccess.processInfo}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {isAuthenticated && orderId && (
          <Link href={`/account/orders/${orderId}`}
            className="inline-flex items-center justify-center gap-2 rounded-md border px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
            {t.checkoutSuccess.trackOrder}
          </Link>
        )}
        <Link href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          {t.checkoutSuccess.continueShopping} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="container py-20">
      <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
