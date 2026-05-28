import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { ThemeProvider } from '@/components/theme-provider';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeProvider />
      <Header />
      <CartDrawer />
      <main className="min-h-[calc(100vh-4rem)] animate-fade-in">{children}</main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
