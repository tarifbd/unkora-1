'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

export function Footer() {
  const { t } = useLanguage();
  const f = t.footer;

  const quickLinks = [
    { label: f.home,          href: '/' },
    { label: f.booksLink,     href: '/books' },
    { label: f.orderTracking, href: '/account/orders' },
    { label: f.wishlist,      href: '/account/wishlist' },
    { label: f.myAccount,     href: '/account' },
    { label: f.helpCenter,    href: '#' },
  ];

  const policyLinks = [
    f.termsOfUse, f.privacyPolicy, f.refundPolicy, f.shippingPolicy, f.cancellations,
  ];

  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* Newsletter */}
        <div className="bg-primary rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 mb-16 text-white overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-2">{f.newsletter}</h3>
            <p className="opacity-80">{f.newsletterSub}</p>
          </div>
          <div className="w-full lg:w-auto relative z-10">
            <form
              className="flex bg-white rounded-lg p-1.5 overflow-hidden w-full lg:min-w-[400px]"
              onSubmit={e => e.preventDefault()}
            >
              <input
                type="email"
                placeholder={f.emailPlaceholder}
                className="flex-grow px-4 outline-none text-gray-900 text-sm"
              />
              <button
                type="submit"
                className="bg-secondary text-white px-8 py-3 rounded-md font-bold hover:bg-orange-600 transition-colors shadow-lg"
              >
                {f.subscribe}
              </button>
            </form>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <Link href="/" className="text-2xl font-black tracking-tighter flex items-center mb-6">
              <span className="text-primary">UNKORA</span><span className="text-secondary">.SHOP</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{f.tagline}</p>
            <div className="flex gap-4">
              {[
                { Icon: Facebook,  label: 'Facebook' },
                { Icon: Twitter,   label: 'Twitter' },
                { Icon: Instagram, label: 'Instagram' },
                { Icon: Youtube,   label: 'YouTube' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all"
                >
                  <Icon className="w-[18px] h-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-bold mb-6">{f.quickLinks}</h4>
            <ul className="space-y-3">
              {quickLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-gray-500 text-sm hover:text-primary transition-all flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-primary transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-gray-900 font-bold mb-6">{f.policy}</h4>
            <ul className="space-y-3">
              {policyLinks.map(label => (
                <li key={label}>
                  <Link href="#" className="text-gray-500 text-sm hover:text-primary transition-all flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-primary transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gray-900 font-bold mb-6">{f.contactUs}</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-[18px] h-[18px] text-primary mt-1 shrink-0" />
                <span className="text-gray-500 text-sm leading-tight">+880 1708-166233</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-[18px] h-[18px] text-primary mt-1 shrink-0" />
                <span className="text-gray-500 text-sm leading-tight">support@unkora.shop</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-[18px] h-[18px] text-primary mt-1 shrink-0" />
                <span className="text-gray-500 text-sm leading-tight">2/1, RK Mission Road, Motijheel, Dhaka-1203</span>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-[18px] h-[18px] text-primary mt-1 shrink-0" />
                <span className="text-gray-500 text-sm leading-tight">{f.liveChat}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
          <p>{f.rights}</p>
          <div className="flex items-center gap-6">
            <div className="flex gap-4">
              <span>{f.paymentMethods}</span>
              <span className="text-gray-400">bKash, Nagad, Visa, Mastercard, Cash on Delivery</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
