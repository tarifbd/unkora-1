import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'All Products | UNKORA',
  description: 'Browse all products at UNKORA — fast delivery across Bangladesh.',
  alternates: { canonical: `${BASE_URL}/products` },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
