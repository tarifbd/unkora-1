import type { Metadata, Viewport } from 'next';
import { Inter, Lora } from 'next/font/google';

import '@/styles/globals.css';

import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'UNKORA — Premium Books & Lifestyle',
    template: '%s | UNKORA',
  },
  description:
    'UNKORA — Your destination for premium books, leather goods, organic products, baby essentials & home decor. Crafted with care, delivered with love.',
  keywords: ['books', 'leather', 'organic', 'baby products', 'home decor', 'Bangladesh', 'online shop'],
  authors: [{ name: 'UNKORA' }],
  creator: 'UNKORA',
  metadataBase: new URL(process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://unkora.com'),
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
