import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { ThemeProvider } from '@/components/theme-provider';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { AiChatWidget } from '@/components/ai/chat-widget';
import { SessionGuard } from '@/components/auth/session-guard';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider />
      <SessionGuard />
      <Suspense fallback={<div className="h-16 border-b bg-white dark:bg-gray-900" />}>
        <Header />
      </Suspense>
      <CartDrawer />
      <main className="min-h-[calc(100vh-4rem)] animate-fade-in">{children}</main>
      <Footer />
      <ScrollToTop />
      <AiChatWidget />
    </>
  );
}
