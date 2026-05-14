import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold">
              <BookOpen className="h-5 w-5 text-brand-600" />
              <span>UNKORA</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Premium books, leather goods, organic products & more. Crafted with care, delivered with love.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Shop</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/books" className="hover:text-foreground transition-colors">Books</Link></li>
              <li><Link href="/products?categorySlug=leather" className="hover:text-foreground transition-colors">Leather</Link></li>
              <li><Link href="/products?categorySlug=organic" className="hover:text-foreground transition-colors">Organic</Link></li>
              <li><Link href="/products?categorySlug=baby" className="hover:text-foreground transition-colors">Baby Products</Link></li>
              <li><Link href="/products?categorySlug=home-decor" className="hover:text-foreground transition-colors">Home Decor</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Account</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/account" className="hover:text-foreground transition-colors">My Account</Link></li>
              <li><Link href="/account/orders" className="hover:text-foreground transition-colors">My Orders</Link></li>
              <li><Link href="/account/addresses" className="hover:text-foreground transition-colors">Addresses</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Help</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-default">Shipping Policy</span></li>
              <li><span className="cursor-default">Return Policy</span></li>
              <li><span className="cursor-default">Privacy Policy</span></li>
              <li><span className="cursor-default">Contact Us</span></li>
            </ul>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>📞 +880 1700 000 000</p>
              <p>✉️ support@unkora.com</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} UNKORA. All rights reserved. Made with ❤️ in Bangladesh.</p>
        </div>
      </div>
    </footer>
  );
}
