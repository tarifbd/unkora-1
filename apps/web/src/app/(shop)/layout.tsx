import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { ThemeProvider } from '@/components/theme-provider';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function getPublicSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API}/settings/public`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return {};
    const data = await res.json();
    return data.data ?? {};
  } catch {
    return {};
  }
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  const isMaintenance = settings['store.maintenanceMode'] === 'true';

  if (isMaintenance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4 text-center">
        <div className="max-w-md w-full">
          <div className="text-7xl mb-6">🔧</div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            সাইট রক্ষণাবেক্ষণ চলছে
          </h1>
          <p className="text-gray-500 mb-2">
            We are currently under maintenance.
          </p>
          <p className="text-gray-400 text-sm">
            আমরা শীঘ্রই ফিরে আসছি। অসুবিধার জন্য আন্তরিকভাবে দুঃখিত।
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Maintenance Mode
          </div>
        </div>
      </div>
    );
  }

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
