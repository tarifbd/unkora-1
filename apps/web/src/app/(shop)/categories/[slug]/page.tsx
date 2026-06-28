import { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { JsonLd } from '@/components/ui/json-ld';
import CategoryDetailClient from './category-detail-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function getCategory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const name = category?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const description = category?.description ?? `Shop ${name} products at UNKORA — fast delivery across Bangladesh.`;

  return {
    title: `${name} | UNKORA`,
    description,
    alternates: { canonical: `${BASE_URL}/categories/${slug}` },
    openGraph: {
      title: `${name} | UNKORA`,
      description,
      url: `${BASE_URL}/categories/${slug}`,
      siteName: 'UNKORA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | UNKORA`,
      description,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategory(slug); // deduped with generateMetadata's fetch

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const name = category?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const url = `${BASE_URL}/categories/${slug}`;

  // Home > Category breadcrumb trail for rich results.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name, item: url },
    ],
  };

  // CollectionPage describing this category listing.
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description: category?.description ?? `Shop ${name} products at UNKORA.`,
    url,
  };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd, collectionJsonLd]} />
      <Suspense fallback={<div className="container flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}>
        <CategoryDetailClient slug={slug} />
      </Suspense>
    </>
  );
}
