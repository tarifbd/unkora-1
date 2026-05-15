'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';

const quickLinks = ['Home', 'Books', 'Order Tracking', 'Wishlist', 'My Account', 'Help Center'];
const policyLinks = ['Terms of Use', 'Privacy Policy', 'Refund Policy', 'Shipping Policy', 'Cancellations'];

const quickLinkHrefs: Record<string, string> = {
  'Home': '/',
  'Books': '/books',
  'Order Tracking': '/account/orders',
  'Wishlist': '/account/wishlist',
  'My Account': '/account',
  'Help Center': '#',
};

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter */}
      <div className="bg-primary">
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-white font-bold text-xl">Stay Updated!</h3>
              <p className="text-white/80 text-sm mt-1">
                Subscribe to get the latest deals, new arrivals and exclusive offers.
              </p>
            </div>
            <form className="flex gap-2" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 h-10 px-4 rounded text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="h-10 px-5 bg-secondary hover:bg-amber-400 text-gray-900 text-sm font-semibold rounded transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <span className="font-bold text-2xl text-white tracking-tight">UNKORA</span>
              <span className="font-bold text-2xl text-secondary tracking-tight">.SHOP</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Premium books, leather goods, organic products & more. Crafted with care, delivered with love across Bangladesh.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 mt-5">
              {[
                { Icon: Facebook,  href: '#', label: 'Facebook' },
                { Icon: Twitter,   href: '#', label: 'Twitter' },
                { Icon: Instagram, href: '#', label: 'Instagram' },
                { Icon: Youtube,   href: '#', label: 'YouTube' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="h-8 w-8 rounded-full bg-gray-700 hover:bg-primary flex items-center justify-center transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link}>
                  <Link
                    href={quickLinkHrefs[link] ?? '#'}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Policies</h3>
            <ul className="space-y-2">
              {policyLinks.map(link => (
                <li key={link}>
                  <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <span>House 12, Road 5, Dhanmondi, Dhaka-1205, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 text-secondary shrink-0" />
                <span>16297 (9 AM – 8 PM)</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4 text-secondary shrink-0" />
                <a href="mailto:support@unkora.com" className="hover:text-white transition-colors">
                  support@unkora.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} UNKORA. All rights reserved. Made with ❤️ in Bangladesh.
          </p>
          {/* Payment methods */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 mr-1">We accept:</span>
            {['bKash', 'Nagad', 'Rocket', 'VISA', 'MC'].map(method => (
              <span
                key={method}
                className="text-[9px] font-bold bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
