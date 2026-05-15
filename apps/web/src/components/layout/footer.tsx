'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail, MessageSquare, CheckCircle, Send } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

const SOCIAL_LINKS = [
  { Icon: Facebook,  label: 'Facebook',  href: 'https://facebook.com/unkora.shop' },
  { Icon: Instagram, label: 'Instagram', href: 'https://instagram.com/unkora.shop' },
  { Icon: Youtube,   label: 'YouTube',   href: 'https://youtube.com/@unkorashop' },
];

export function Footer() {
  const { t } = useLanguage();
  const f = t.footer;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const quickLinks = [
    { label: f.home,          href: '/' },
    { label: f.booksLink,     href: '/books' },
    { label: f.orderTracking, href: '/account/orders' },
    { label: f.wishlist,      href: '/account/wishlist' },
    { label: f.myAccount,     href: '/account' },
    { label: f.helpCenter,    href: '/help' },
  ];

  const policyLinks = [
    { label: f.termsOfUse,    href: '/terms' },
    { label: f.privacyPolicy, href: '/privacy' },
    { label: f.refundPolicy,  href: '/refund-policy' },
    { label: f.shippingPolicy,href: '/shipping-policy' },
    { label: f.cancellations, href: '/cancellations' },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

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
            {subscribed ? (
              <div className="flex items-center gap-3 bg-white/20 rounded-xl px-6 py-4 border border-white/30">
                <CheckCircle className="w-6 h-6 text-white shrink-0" />
                <p className="font-bold text-white">
                  {(f as Record<string, string>).subscribeSuccess ?? 'সাবস্ক্রাইব সফল! ধন্যবাদ।'}
                </p>
              </div>
            ) : (
              <form
                className="flex bg-white rounded-lg p-1.5 overflow-hidden w-full lg:min-w-[420px]"
                onSubmit={handleSubscribe}
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={f.emailPlaceholder}
                  required
                  className="flex-grow px-4 outline-none text-gray-900 text-sm min-w-0"
                />
                <button
                  type="submit"
                  className="bg-secondary text-white px-6 py-3 rounded-md font-bold hover:bg-orange-600 transition-colors shadow-lg flex items-center gap-2 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  {f.subscribe}
                </button>
              </form>
            )}
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        </div>

        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <Link href="/" className="text-2xl font-black tracking-tighter flex items-center mb-6">
              <span className="text-primary">UNKORA</span><span className="text-secondary">.SHOP</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{f.tagline}</p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ Icon, label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
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
              {policyLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-gray-500 text-sm hover:text-primary transition-all flex items-center gap-2 group">
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
              <a href="tel:+8801708166233" className="flex items-start gap-3 group">
                <Phone className="w-[18px] h-[18px] text-primary mt-1 shrink-0" />
                <span className="text-gray-500 text-sm group-hover:text-primary transition-colors">+880 1708-166233</span>
              </a>
              <a href="mailto:support@unkora.shop" className="flex items-start gap-3 group">
                <Mail className="w-[18px] h-[18px] text-primary mt-1 shrink-0" />
                <span className="text-gray-500 text-sm group-hover:text-primary transition-colors">support@unkora.shop</span>
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="w-[18px] h-[18px] text-primary mt-1 shrink-0" />
                <span className="text-gray-500 text-sm">2/1, RK Mission Road, Motijheel, Dhaka-1203</span>
              </div>
              <a href="https://wa.me/8801708166233" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                <MessageSquare className="w-[18px] h-[18px] text-primary mt-1 shrink-0" />
                <span className="text-gray-500 text-sm group-hover:text-primary transition-colors">{f.liveChat}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 font-medium">{f.rights}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">{f.paymentMethods}</span>
            {['bKash', 'Nagad', 'Visa', 'MC', 'COD'].map(m => (
              <span key={m} className="inline-flex items-center justify-center px-2.5 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] font-bold text-gray-600">{m}</span>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
