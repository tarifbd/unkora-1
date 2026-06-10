import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
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
    </>
  );
}
