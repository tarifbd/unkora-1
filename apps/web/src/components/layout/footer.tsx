'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Facebook, Instagram, Youtube, MapPin, Phone, Mail,
  MessageSquare, CheckCircle, Send, ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const PAYMENT_METHODS = [
  { name: 'bKash',  color: '#E2136E', text: 'white' },
  { name: 'Nagad',  color: '#F16522', text: 'white' },
  { name: 'Visa',   color: '#1A1F71', text: 'white' },
  { name: 'MC',     color: '#EB001B', text: 'white' },
  { name: 'COD',    color: '#047857', text: 'white' },
];

export function Footer() {
  const { t } = useLanguage();
  const f = t.footer;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const currentYear = new Date().getFullYear();

  const { data: settings } = useQuery({
    queryKey: ['site-settings-footer'],
    queryFn: () => api.get('/settings/store').then(r => r.data.data as Record<string, string>).catch(() => ({} as Record<string, string>)),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const socialLinks = [
    { Icon: Facebook,  label: 'Facebook',  href: settings?.['social.facebook']  || 'https://facebook.com/unkora.shop',  color: '#1877F2' },
    { Icon: Instagram, label: 'Instagram', href: settings?.['social.instagram'] || 'https://instagram.com/unkora.shop', color: '#E1306C' },
    { Icon: Youtube,   label: 'YouTube',   href: settings?.['social.youtube']   || 'https://youtube.com/@unkorashop',   color: '#FF0000' },
  ];

  const contactPhone   = settings?.['site.phone']   || '+880 1911-369686';
  const contactEmail   = settings?.['site.email']   || 'support@unkora.shop';
  const contactAddress = settings?.['site.address'] || '160, Hasan Nagar,\nDhaka-1211';

  const quickLinks = [
    { label: f.home,          href: '/' },
    { label: f.booksLink,     href: '/books' },
    { label: f.orderTracking, href: '/account/orders' },
    { label: f.wishlist,      href: '/account/wishlist' },
    { label: f.myAccount,     href: '/account' },
    { label: f.helpCenter,    href: '/help' },
    { label: 'Sell on UNKORA', href: '/publish' },
  ];

  const policyLinks = [
    { label: f.termsOfUse,     href: '/terms' },
    { label: f.privacyPolicy,  href: '/privacy' },
    { label: f.refundPolicy,   href: '/refund-policy' },
    { label: f.shippingPolicy, href: '/shipping-policy' },
    { label: f.cancellations,  href: '/cancellations' },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-white border-t border-gray-100">

      {/* Newsletter banner */}
      <div className="bg-gradient-to-br from-primary to-emerald-600 text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative text-center lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-widest text-white/70 mb-2">{f.newsletter}</p>
              <h3 className="text-2xl sm:text-3xl font-black mb-2">
                {(f as Record<string,string>).newsletterTitle ?? 'অফার ও আপডেট পান'}
              </h3>
              <p className="text-white/75 text-sm max-w-sm">
                {f.newsletterSub}
              </p>
            </div>

            <div className="w-full lg:w-auto relative">
              {subscribed ? (
                <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">সাবস্ক্রাইব সফল!</p>
                    <p className="text-white/70 text-xs">আপনাকে স্বাগতম 🎉</p>
                  </div>
                </div>
              ) : (
                <form
                  className="flex bg-white rounded-xl overflow-hidden shadow-xl w-full lg:min-w-[400px]"
                  onSubmit={handleSubscribe}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={f.emailPlaceholder}
                    required
                    className="flex-grow px-4 py-3.5 outline-none text-gray-900 text-sm min-w-0 bg-transparent"
                  />
                  <button
                    type="submit"
                    className="bg-secondary text-white px-5 py-3.5 font-bold hover:bg-amber-500 transition-colors flex items-center gap-2 shrink-0 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">{f.subscribe}</span>
                    <ArrowRight className="w-4 h-4 sm:hidden" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 sm:gap-10 lg:gap-12">

          {/* Brand column */}
          <div>
            <Link href="/" className="inline-flex items-baseline mb-5">
              <span className="text-2xl font-black tracking-tighter text-primary">UNKORA</span>
              <span className="text-2xl font-black tracking-tighter text-secondary">.SHOP</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{f.tagline}</p>
            {/* Social links */}
            <div className="flex gap-2.5">
              {socialLinks.map(({ Icon, label, href, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:scale-110 transition-all duration-200"
                  style={{ ['--hover-color' as string]: color }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = color; (e.currentTarget as HTMLAnchorElement).style.borderColor = color; (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = ''; (e.currentTarget as HTMLAnchorElement).style.borderColor = ''; (e.currentTarget as HTMLAnchorElement).style.color = ''; }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-5">{f.quickLinks}</h4>
            <ul className="space-y-2.5">
              {quickLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-gray-500 text-sm hover:text-primary transition-colors duration-150 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-primary group-hover:scale-150 transition-all duration-150 flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-5">{f.policy}</h4>
            <ul className="space-y-2.5">
              {policyLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-gray-500 text-sm hover:text-primary transition-colors duration-150 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-primary group-hover:scale-150 transition-all duration-150 flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-5">{f.contactUs}</h4>
            <div className="space-y-3.5">
              <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-150">
                  <Phone className="w-3.5 h-3.5 text-primary group-hover:text-white transition-colors" />
                </div>
                <span className="text-gray-600 text-sm group-hover:text-primary transition-colors">{contactPhone}</span>
              </a>
              <a href={`mailto:${contactEmail}`} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-150">
                  <Mail className="w-3.5 h-3.5 text-primary group-hover:text-white transition-colors" />
                </div>
                <span className="text-gray-600 text-sm group-hover:text-primary transition-colors">{contactEmail}</span>
              </a>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-gray-600 text-sm leading-relaxed">{contactAddress.split('\n').map((line, i) => <span key={i}>{line}{i < contactAddress.split('\n').length - 1 && <br />}</span>)}</span>
              </div>
              <a href={`https://wa.me/${contactPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-150">
                  <MessageSquare className="w-3.5 h-3.5 text-primary group-hover:text-white transition-colors" />
                </div>
                <span className="text-gray-600 text-sm group-hover:text-primary transition-colors">{f.liveChat}</span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400 font-medium">
            © {currentYear} UNKORA.SHOP · All rights reserved · Made with ❤️ in Bangladesh
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-gray-400 mr-1">{f.paymentMethods}</span>
            {PAYMENT_METHODS.map(({ name, color, text }) => (
              <span
                key={name}
                className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm"
                style={{ background: color, color: text }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}
