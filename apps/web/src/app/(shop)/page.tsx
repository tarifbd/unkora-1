import Link from 'next/link';
import { ArrowRight, BookOpen, Leaf, Baby, Home, ShoppingBag, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { ProductGrid } from '@/components/product/product-grid';
import { productsApi } from '@/lib/api/products';

const categories = [
  { slug: 'books', label: 'Books', icon: BookOpen, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', link: '/books' },
  { slug: 'organic', label: 'Organic', icon: Leaf, color: 'bg-green-50 text-green-700 hover:bg-green-100', link: '/products?categorySlug=organic' },
  { slug: 'baby', label: 'Baby', icon: Baby, color: 'bg-pink-50 text-pink-700 hover:bg-pink-100', link: '/products?categorySlug=baby' },
  { slug: 'home-decor', label: 'Home Decor', icon: Home, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', link: '/products?categorySlug=home-decor' },
  { slug: 'leather', label: 'Leather', icon: ShoppingBag, color: 'bg-stone-50 text-stone-700 hover:bg-stone-100', link: '/products?categorySlug=leather' },
];

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over ৳1,000' },
  { icon: Shield, title: 'Secure Payment', desc: 'bKash, Nagad, COD' },
  { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
  { icon: Star, title: 'Quality Products', desc: '100% authentic goods' },
];

async function getFeaturedProducts() {
  try {
    return await productsApi.getFeatured(8);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03]" />
        <div className="container relative flex flex-col items-center gap-6 py-20 text-center md:py-32">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest backdrop-blur">
            Premium Quality — Made in Bangladesh
          </span>
          <h1 className="max-w-3xl font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your Ultimate Destination for{' '}
            <span className="text-amber-400">Books & Lifestyle</span>
          </h1>
          <p className="max-w-xl text-base text-white/70 sm:text-lg">
            Curated books, leather goods, organic products, baby essentials & home decor.
            Crafted with care, delivered with love.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/books"
              className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-7 py-3 text-sm font-semibold text-white shadow-lg hover:bg-amber-600 transition-colors">
              Shop Books <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/products"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-7 py-3 text-sm font-semibold backdrop-blur hover:bg-white/20 transition-colors">
              All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b bg-muted/30">
        <div className="container py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100">
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold">Shop by Category</h2>
          <Link href="/products" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.link}
              className={`group flex flex-col items-center gap-3 rounded-xl p-6 transition-all hover:-translate-y-1 hover:shadow-md ${cat.color}`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/60 shadow-sm group-hover:scale-110 transition-transform">
                <cat.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="container pb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold">Featured Products</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Handpicked favorites from our collection</p>
            </div>
            <Link href="/products?isFeatured=true"
              className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ProductGrid products={featured} />
        </section>
      )}

      {/* Banner */}
      <section className="container pb-12">
        <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-white/70">Limited Time Offer</p>
              <h3 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">Free Shipping on Orders Over ৳1,000</h3>
              <p className="mt-1 text-white/80">Shop more, save more. Valid on all categories.</p>
            </div>
            <Link href="/products"
              className="inline-flex items-center gap-2 rounded-md bg-white px-7 py-3 text-sm font-semibold text-amber-700 hover:bg-white/90 transition-colors self-start md:self-auto shrink-0">
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Book highlight */}
      <section className="border-t bg-muted/20">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Book Collection</span>
              <h2 className="mt-3 font-serif text-3xl font-bold">Bangladesh&apos;s Finest Literary Selection</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                From timeless Bengali classics to contemporary bestsellers — Islamic literature, self-help, fiction and more.
                All books are 100% original with authentic pricing.
              </p>
              <Link href="/books"
                className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Browse Books <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { bg: 'bg-amber-100', label: 'Bengali Literature' },
                { bg: 'bg-green-100', label: 'Islamic Books' },
                { bg: 'bg-blue-100', label: 'Self-Help' },
              ].map(({ bg, label }) => (
                <div key={label} className={`${bg} aspect-[2/3] rounded-xl flex items-end p-3`}>
                  <span className="text-xs font-medium leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
