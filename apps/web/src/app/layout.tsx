import type { Metadata, Viewport } from 'next';

import '@/styles/globals.css';

import { Providers } from './providers';
import { AnalyticsScripts } from '@/components/analytics/analytics-scripts';
import { PopupRenderer } from '@/components/ui/popup-renderer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'UNKORA — বাংলাদেশের প্রিমিয়াম শপিং', template: '%s | UNKORA' },
  description: 'UNKORA-তে বই, ইলেকট্রনিক্স, শিশু পণ্যসহ লাখো পণ্য কিনুন। সারা বাংলাদেশে দ্রুত ডেলিভারি।',
  keywords: ['অনলাইন শপিং', 'বাংলাদেশ', 'বই', 'ইকমার্স', 'আনকোরা', 'shopping', 'bangladesh', 'books'],
  authors: [{ name: 'UNKORA' }],
  creator: 'UNKORA',
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    siteName: 'UNKORA',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#d97706',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers><PopupRenderer />{children}</Providers>
        <AnalyticsScripts />
      </body>
    </html>
  );
}
