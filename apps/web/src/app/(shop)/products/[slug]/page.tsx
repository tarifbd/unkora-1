import { Metadata } from 'next';
import ProductDetailClient from './product-detail-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1/v1';

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product Not Found | UNKORA' };

  const price = product.salePrice ?? product.basePrice;
  const imageUrl = product.images?.[0]?.url;
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    title: `${product.name} | UNKORA`,
    description: product.shortDesc ?? product.description?.slice(0, 160) ?? `Buy ${product.name} at UNKORA`,
    openGraph: {
      title: product.name,
      description: product.shortDesc ?? product.description?.slice(0, 160),
      url: `${BASE_URL}/products/${slug}`,
      siteName: 'UNKORA',
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: product.name }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.shortDesc ?? product.description?.slice(0, 160),
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
