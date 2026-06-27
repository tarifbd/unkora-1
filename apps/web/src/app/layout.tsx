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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Sitewide Organization + WebSite structured data (brand knowledge panel +
// sitelinks search box eligibility).
const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'UNKORA',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'UNKORA',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }} />
        {/* Preconnect to image/asset origins for faster LCP */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://pub-c7c71d2de0d04a0099ccdff17d97daba.r2.dev" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://analytics.tiktok.com" />
      </head>
      <body className="font-sans antialiased">
        <Providers><PopupRenderer />{children}</Providers>
        <AnalyticsScripts />
      </body>
    </html>
  );
}
