import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { ShopBottomNav } from '@/components/layout/shop-bottom-nav';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionGuard } from '@/components/auth/session-guard';
import { ContactWidget } from '@/components/chat/contact-widget';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider />
      <SessionGuard />
      <Suspense fallback={<div className="h-16 border-b bg-white" />}>
        <Header />
      </Suspense>
      <CartDrawer />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <Footer />
      <ContactWidget />
      {/* Premium mobile bottom nav (storefront) */}
      <ShopBottomNav />
      {/* Spacer so the fixed bottom nav never covers page content on mobile */}
      <div className="md:hidden h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-hidden />
    </>
  );
}
