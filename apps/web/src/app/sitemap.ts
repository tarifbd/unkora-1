import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = ['', '/products', '/books', '/categories', '/about', '/contact'].map(route => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic product routes - fetch from API
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1/v1'}/products?limit=500`,
      { next: { revalidate: 3600 } },
    );
    const json = await res.json();
    const products: Array<{ slug: string; updatedAt: string }> = json?.data?.data ?? [];
    productRoutes = products.map(p => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  } catch { /* silently skip */ }

  // Dynamic category routes
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1/v1'}/categories`,
      { next: { revalidate: 3600 } },
    );
    const json = await res.json();
    const categories: Array<{ slug: string }> = json?.data ?? [];
    categoryRoutes = categories.map(c => ({
      url: `${BASE_URL}/categories/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch { /* silently skip */ }

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
