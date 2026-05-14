import Link from 'next/link';
import { ArrowRight, BookOpen, Leaf, Baby, Home, ShoppingBag } from 'lucide-react';
import { ProductGrid } from '@/components/product/product-grid';
import { productsApi, categoriesApi } from '@/lib/api/products';

const categories = [
  { slug: 'books', label: 'Books', icon: BookOpen, color: 'bg-amber-50 text-amber-700' },
  { slug: 'organic', label: 'Organic', icon: Leaf, color: 'bg-green-50 text-green-700' },
  { slug: 'baby', label: 'Baby', icon: Baby, color: 'bg-pink-50 text-pink-700' },
  { slug: 'home-decor', label: 'Home Decor', icon: Home, color: 'bg-blue-50 text-blue-700' },
  { slug: 'leather', label: 'Leather', icon: ShoppingBag, color: 'bg-stone-50 text-stone-700' },
];

async function getFeaturedProducts() {
  try { return await productsApi.getFeatured(8); } catch { return []; }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white">
        <div className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
            Premium Quality — Delivered to Your Door
          </span>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Discover the World of <br />
            <span className="text-amber-400">UNKORA</span>
          </h1>
          <p className="max-w-xl text-base text-white/70 sm:text-lg">
            Curated books, leather goods, organic products, baby essentials & home decor.
            Crafted with care, delivered with love — straight from Bangladesh.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/books" className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">
              Shop Books <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/products" className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur hover:bg-white/20 transition-colors">
              All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <h2 className="mb-6 font-serif text-2xl font-bold">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.slug === 'books' ? '/books' : `/products?categorySlug=${cat.slug}`}
              className={`flex flex-col items-center gap-3 rounded-xl p-5 transition-transform hover:-translate-y-1 hover:shadow-md ${cat.color}`}
            >
              <cat.icon className="h-8 w-8" />
              <span className="text-sm font-semibold">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="container py-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold">Featured Products</h2>
            <Link href="/products?isFeatured=true" className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}

      {/* Banner */}
      <section className="container py-8">
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-serif text-2xl font-bold">Free Shipping on Orders Over ৳1,000</h3>
              <p className="mt-1 text-white/80">Shop more, save more. Valid on all categories.</p>
            </div>
            <Link href="/products" className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-amber-700 hover:bg-white/90 transition-colors self-start md:self-auto">
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
