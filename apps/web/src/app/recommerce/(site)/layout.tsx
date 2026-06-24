'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { RefreshCw, Search, Plus, User, Menu, X, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/recommerce',          labelBn: 'হোম',            labelEn: 'Home' },
  { href: '/recommerce/listings', labelBn: 'সব বিজ্ঞাপন',   labelEn: 'Browse' },
  { href: '/recommerce/post-ad',  labelBn: 'বিজ্ঞাপন দিন',  labelEn: 'Post Ad', highlight: true },
];

const CATS_QUICK = [
  { emoji: '📱', labelBn: 'ইলেকট্রনিক্স',   labelEn: 'Electronics',     href: '/recommerce/listings?cat=electronics' },
  { emoji: '🛋️', labelBn: 'আসবাবপত্র',      labelEn: 'Furniture',       href: '/recommerce/listings?cat=furniture' },
  { emoji: '🚗', labelBn: 'যানবাহন',        labelEn: 'Vehicles',        href: '/recommerce/listings?cat=vehicles' },
  { emoji: '👗', labelBn: 'পোশাক',          labelEn: 'Clothing',        href: '/recommerce/listings?cat=clothing' },
  { emoji: '📚', labelBn: 'বই',             labelEn: 'Books',           href: '/recommerce/listings?cat=books' },
  { emoji: '🏠', labelBn: 'হোম অ্যাপ্লায়েন্স', labelEn: 'Appliances', href: '/recommerce/listings?cat=appliances' },
  { emoji: '🎮', labelBn: 'গেমিং',          labelEn: 'Gaming',          href: '/recommerce/listings?cat=gaming' },
  { emoji: '🧸', labelBn: 'শিশু পণ্য',      labelEn: 'Baby & Kids',     href: '/recommerce/listings?cat=kids' },
];

function RecommerceHeader() {
  const pathname = usePathname();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const [lang, setLang]         = useState<'bn' | 'en'>('bn');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [catOpen, setCatOpen]   = useState(false);
  const [search, setSearch]     = useState('');

  const L = (bn: string, en: string) => lang === 'bn' ? bn : en;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
      {/* Top strip */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white text-[11px] font-semibold py-1 text-center tracking-wide">
        ♻️ {L('পুরানো পণ্য কিনুন ও বিক্রি করুন — বিনামূল্যে বিজ্ঞাপন দিন', 'Buy & sell pre-owned goods — Post ads for free')}
      </div>

      {/* Main header row */}
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/recommerce" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-black text-gray-900 leading-none">{L('সালভেজ ইয়ার্ড', 'Salvage Yard')}</p>
            <p className="text-[10px] text-amber-600 font-semibold leading-none">{L('পুরানো পণ্যের বাজার', 'Pre-owned marketplace')}</p>
          </div>
        </Link>

        {/* Search bar */}
        <form className="flex-1 flex" onSubmit={e => { e.preventDefault(); if (search.trim()) window.location.href = `/recommerce/listings?q=${encodeURIComponent(search)}`; }}>
          <div className="flex w-full max-w-xl mx-auto rounded-xl overflow-hidden border-2 border-amber-400 focus-within:border-amber-500 transition-colors">
            {/* Category quick-pick */}
            <div className="relative hidden sm:block">
              <button type="button" onClick={() => setCatOpen(o => !o)}
                className="h-full px-3 text-xs font-bold text-gray-600 bg-gray-50 border-r border-amber-200 flex items-center gap-1 hover:bg-amber-50 transition-colors whitespace-nowrap">
                {L('বিভাগ', 'Category')} <ChevronDown className="w-3 h-3" />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded-xl shadow-xl w-52 z-50 py-1">
                  {CATS_QUICK.map(c => (
                    <Link key={c.href} href={c.href} onClick={() => setCatOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                      <span>{c.emoji}</span>
                      <span>{lang === 'bn' ? c.labelBn : c.labelEn}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={L('কী খুঁজছেন? যেমন: Samsung Galaxy, Sofa…', 'Search listings… e.g. iPhone, Table')}
              className="flex-1 px-3 py-2.5 text-sm outline-none bg-white min-w-0" />
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 transition-colors flex-shrink-0">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Lang */}
          <button onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
            className="hidden lg:block text-xs text-gray-400 hover:text-amber-600 border border-gray-200 rounded-full px-2.5 py-1 transition-colors">
            {lang === 'bn' ? 'EN' : 'বাং'}
          </button>

          {/* Post Ad CTA */}
          <Link href="/recommerce/post-ad"
            className="hidden sm:flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" />
            {L('বিজ্ঞাপন দিন', 'Post Ad')}
          </Link>

          {/* User */}
          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setUserOpen(o => !o)}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-amber-600 transition-colors">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-600" />
                </div>
                <ChevronDown className="w-3.5 h-3.5 hidden sm:block" />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border rounded-2xl shadow-xl w-48 py-1 z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-bold text-gray-900">{user?.firstName ?? user?.name ?? 'User'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link href="/recommerce/seller/dashboard" onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> {L('আমার ড্যাশবোর্ড', 'My Dashboard')}
                  </Link>
                  <button onClick={() => { clearAuth(); setUserOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> {L('লগআউট', 'Logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/recommerce/login"
              className="text-sm font-bold text-gray-700 hover:text-amber-600 transition-colors flex items-center gap-1">
              <User className="w-4 h-4" />
              <span className="hidden sm:block">{L('লগইন', 'Login')}</span>
            </Link>
          )}

          {/* Mobile menu */}
          <button onClick={() => setMenuOpen(o => !o)} className="lg:hidden p-1.5 text-gray-600">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Category quick-nav bar */}
      <div className="bg-gray-50 border-t hidden lg:block">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 h-9 overflow-x-auto [scrollbar-width:none]">
          {CATS_QUICK.map(c => (
            <Link key={c.href} href={c.href}
              className={cn(
                'flex items-center gap-1.5 px-3 h-full text-[12px] font-semibold whitespace-nowrap transition-colors hover:text-amber-700',
                pathname === c.href ? 'text-amber-700 border-b-2 border-amber-500' : 'text-gray-600'
              )}>
              {c.emoji} {lang === 'bn' ? c.labelBn : c.labelEn}
            </Link>
          ))}
          <Link href="/recommerce/listings" className="ml-auto text-[11px] text-amber-600 font-bold hover:underline whitespace-nowrap">
            {L('সব বিভাগ →', 'All categories →')}
          </Link>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="lg:hidden border-t bg-white py-2 shadow-lg">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
              className={cn('block px-5 py-3 text-sm font-semibold transition-colors',
                n.highlight ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600')}>
              {lang === 'bn' ? n.labelBn : n.labelEn}
            </Link>
          ))}
          <div className="px-5 py-2 border-t">
            <button onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
              className="text-xs text-gray-500 border rounded-full px-3 py-1">
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function RecommerceFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-black text-sm">Salvage Yard</span>
          </div>
          <p className="text-xs leading-relaxed">পুরানো পণ্যের সবচেয়ে বিশ্বস্ত বাজার। Buy &amp; sell pre-owned goods.</p>
        </div>
        <div>
          <p className="text-white font-bold mb-3 text-xs uppercase tracking-wider">ক্রেতা</p>
          {([['Browse Listings', '/recommerce/listings'], ['How to Buy', '/recommerce/how-to-buy'], ['Safety Tips', '/recommerce/safety']] as [string, string][]).map(([l, h]) => (
            <Link key={h} href={h} className="block py-1 hover:text-amber-400 transition-colors text-xs">{l}</Link>
          ))}
        </div>
        <div>
          <p className="text-white font-bold mb-3 text-xs uppercase tracking-wider">বিক্রেতা</p>
          {([['Post Free Ad', '/recommerce/post-ad'], ['Seller Dashboard', '/recommerce/seller/dashboard'], ['Pricing Guide', '/recommerce/pricing']] as [string, string][]).map(([l, h]) => (
            <Link key={h} href={h} className="block py-1 hover:text-amber-400 transition-colors text-xs">{l}</Link>
          ))}
        </div>
        <div>
          <p className="text-white font-bold mb-3 text-xs uppercase tracking-wider">সাপোর্ট</p>
          {([['Help Center', '/support'], ['Contact Us', '/contact'], ['Report Issue', '/support/report']] as [string, string][]).map(([l, h]) => (
            <Link key={h} href={h} className="block py-1 hover:text-amber-400 transition-colors text-xs">{l}</Link>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        © 2025 UNKORA · Salvage Yard. All rights reserved.
      </div>
    </footer>
  );
}

export default function RecommerceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <RecommerceHeader />
      <main className="flex-1">{children}</main>
      <RecommerceFooter />
    </div>
  );
}
