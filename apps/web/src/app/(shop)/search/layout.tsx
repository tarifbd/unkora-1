import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Search | UNKORA',
  description: 'Search products at UNKORA — fast delivery across Bangladesh.',
  alternates: { canonical: `${BASE_URL}/search` },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
