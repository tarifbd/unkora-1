import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="container flex flex-col items-center gap-8 py-16 text-center">
        <div className="space-y-2">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            UNKORA
          </h1>
          <p className="text-lg text-muted-foreground">
            Premium Books & Lifestyle — Coming Soon
          </p>
        </div>

        <p className="max-w-md text-muted-foreground">
          Your destination for curated books, leather goods, organic products, baby essentials &amp;
          home decor. Crafted with care, delivered with love.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
