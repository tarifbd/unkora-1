'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Book, Baby, Briefcase, Leaf, Palette, Zap, ShoppingBag,
  Menu, X, Search, User, ShoppingCart, ChevronDown,
  MapPin, Phone, Download, HelpCircle,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useAuth } from '@/lib/hooks/use-auth';
import { useLanguage } from '@/lib/i18n/language-context';
import type { LucideIcon } from 'lucide-react';

interface NavCategory {
  nameKey: keyof typeof import('@/lib/i18n/translations').translations.bn.nav;
  displayName: string;
  icon: LucideIcon;
  slug: string;
  subnav: string[];
}

const NAV_CATEGORIES: NavCategory[] = [
  { nameKey: 'books',           displayName: 'Books',            icon: Book,        slug: '/books',                       subnav: ['Authors', 'Subjects', 'Publishers', 'Academic Books', 'E-Books', 'Islamic Books'] },
  { nameKey: 'babyProducts',    displayName: 'Baby Products',    icon: Baby,        slug: '/categories/baby-products',    subnav: ['Diapering & Care', 'Feeding & Nursing', 'Baby Gear', 'Toys & Games', 'Baby Clothing'] },
  { nameKey: 'leatherProducts', displayName: 'Leather Products', icon: Briefcase,   slug: '/categories/leather-products', subnav: ['Wallets & Cards', 'Bags & Backpacks', 'Belts & Accessories', "Men's Footwear", "Women's Footwear"] },
  { nameKey: 'organicFoods',    displayName: 'Organic Foods',    icon: Leaf,        slug: '/categories/organic-foods',    subnav: ['Nuts & Seeds', 'Honey & Sweeteners', 'Spices & Herbs', 'Healthy Snacks', 'Tea & Beverages'] },
  { nameKey: 'handicrafts',     displayName: 'Handicrafts',      icon: Palette,     slug: '/categories/handicrafts',      subnav: ['Wall Art', 'Showpieces', 'Lamps & Lighting', 'Rugs & Carpets', 'Traditional Crafts'] },
  { nameKey: 'electronics',     displayName: 'Electronics',      icon: Zap,         slug: '/categories/electronics',      subnav: ['Mobiles', 'Laptops', 'Accessories', 'Home Appliances', 'Gadgets'] },
  { nameKey: 'dailyNeeds',      displayName: 'Daily Needs',      icon: ShoppingBag, slug: '/categories/daily-needs',      subnav: ['Grocery', 'Personal Care', 'Household', 'Stationery', 'Pet Care'] },
];

/* Map Books subnav items to proper filter URLs */
function getSubnavHref(catSlug: string, sub: string): string {
  if (catSlug === '/books') {
    const map: Record<string, string> = {
      'Authors':        '/books?sortBy=bookDetail.author&sortOrder=asc',
      'Subjects':       '/books',
      'Publishers':     '/books',
      'Academic Books': '/books?genre=Academic',
      'E-Books':        '/books?language=English',
      'Islamic Books':  '/books?genre=Islamic',
    };
    return map[sub] ?? `/books?tag=${encodeURIComponent(sub)}`;
  }
  return `${catSlug}?tag=${encodeURIComponent(sub)}`;
}

const SUBNAV_DROPDOWNS: Record<string, { label: string; labelBn: string; href: string }[]> = {
  'Authors': [
    { label: 'Humayun Ahmed',       labelBn: 'হুমায়ূন আহমেদ',          href: '/books?author=হুমায়ূন আহমেদ' },
    { label: 'Manik Bandyopadhyay', labelBn: 'মানিক বন্দ্যোপাধ্যায়',   href: '/books?author=মানিক বন্দ্যোপাধ্যায়' },
    { label: 'Sarat Chandra',       labelBn: 'শরৎচন্দ্র চট্টোপাধ্যায়', href: '/books?author=শরৎচন্দ্র চট্টোপাধ্যায়' },
    { label: 'Rabindranath Tagore', labelBn: 'রবীন্দ্রনাথ ঠাকুর',       href: '/books?author=Rabindranath Tagore' },
    { label: 'Samaresh Majumdar',   labelBn: 'সমরেশ মজুমদার',           href: '/books?author=সমরেশ মজুমদার' },
    { label: 'James Clear',         labelBn: 'James Clear',              href: '/books?author=James Clear' },
    { label: 'All Authors →',      labelBn: 'সব লেখক →',               href: '/books?sortBy=bookDetail.author&sortOrder=asc' },
  ],
  'Subjects': [
    { label: 'Fiction',      labelBn: 'উপন্যাস',       href: '/books?genre=Fiction' },
    { label: 'Non-Fiction',  labelBn: 'নন-ফিকশন',      href: '/books?genre=Non-Fiction' },
    { label: 'Islamic',      labelBn: 'ইসলামিক',        href: '/books?genre=Islamic' },
    { label: 'Academic',     labelBn: 'একাডেমিক',       href: '/books?genre=Academic' },
    { label: 'Self-Help',    labelBn: 'আত্মোন্নয়ন',    href: '/books?genre=Self-Help' },
    { label: "Children's",   labelBn: 'শিশুদের বই',     href: "/books?genre=Children's" },
    { label: 'Productivity', labelBn: 'প্রোডাক্টিভিটি', href: '/books?genre=Productivity' },
  ],
  'Publishers': [
    { label: 'Anyaprokash',           labelBn: 'অন্যপ্রকাশ',          href: '/books?publisher=Anyaprokash' },
    { label: 'Prothoma',              labelBn: 'প্রথমা',               href: '/books?publisher=Prothoma' },
    { label: 'Islamic Foundation',    labelBn: 'ইসলামিক ফাউন্ডেশন',   href: '/books?publisher=Islamic Foundation' },
    { label: 'Panjeree Publications', labelBn: 'পাঞ্জেরি পাবলিকেশন্স', href: '/books?publisher=Panjeree Publications' },
    { label: 'Bangla Academy',        labelBn: 'বাংলা একাডেমি',        href: '/books?publisher=Bangla Academy' },
    { label: 'All Publishers →',     labelBn: 'সব প্রকাশক →',         href: '/books' },
  ],
  'Academic Books': [
    { label: 'SSC',            labelBn: 'এসএসসি',          href: '/books?genre=Academic&tag=ssc' },
    { label: 'HSC',            labelBn: 'এইচএসসি',         href: '/books?genre=Academic&tag=hsc' },
    { label: 'BCS Prep',       labelBn: 'বিসিএস প্রস্তুতি', href: '/books?genre=Academic&tag=bcs' },
    { label: 'University',     labelBn: 'বিশ্ববিদ্যালয়',   href: '/books?genre=Academic&tag=university' },
    { label: 'All Academic →', labelBn: 'সব একাডেমিক →',   href: '/books?genre=Academic' },
  ],
  'Islamic Books': [
    { label: 'Quran & Tafsir', labelBn: 'কুরআন ও তাফসির', href: '/books?genre=Islamic&tag=quran' },
    { label: 'Hadith',         labelBn: 'হাদিস',            href: '/books?genre=Islamic&tag=hadith' },
    { label: 'Biography',      labelBn: 'জীবনী',            href: '/books?genre=Islamic&tag=biography' },
    { label: 'All Islamic →',  labelBn: 'সব ইসলামিক →',     href: '/books?genre=Islamic' },
  ],
  'Diapering & Care': [
    { label: 'Diapers',          labelBn: 'ডায়াপার',          href: '/categories/baby-products?tag=diapers' },
    { label: 'Baby Wipes',       labelBn: 'বেবি ওয়াইপস',      href: '/categories/baby-products?tag=wipes' },
    { label: 'Rash Creams',      labelBn: 'র‍্যাশ ক্রিম',       href: '/categories/baby-products?tag=rash-cream' },
    { label: 'Baby Wash',        labelBn: 'বেবি ওয়াশ',         href: '/categories/baby-products?tag=baby-wash' },
  ],
  'Feeding & Nursing': [
    { label: 'Baby Bottles',     labelBn: 'ফিডিং বোতল',       href: '/categories/baby-products?tag=bottles' },
    { label: 'Breast Pumps',     labelBn: 'ব্রেস্ট পাম্প',      href: '/categories/baby-products?tag=breast-pump' },
    { label: 'Baby Food',        labelBn: 'বেবি ফুড',          href: '/categories/baby-products?tag=baby-food' },
    { label: 'High Chairs',      labelBn: 'হাই চেয়ার',          href: '/categories/baby-products?tag=high-chair' },
  ],
  'Baby Gear': [
    { label: 'Strollers',        labelBn: 'স্ট্রোলার',          href: '/categories/baby-products?tag=stroller' },
    { label: 'Car Seats',        labelBn: 'কার সিট',           href: '/categories/baby-products?tag=car-seat' },
    { label: 'Baby Carriers',    labelBn: 'বেবি ক্যারিয়ার',    href: '/categories/baby-products?tag=carrier' },
    { label: 'All Baby Gear →', labelBn: 'সব বেবি গিয়ার →',  href: '/categories/baby-products' },
  ],
  'Toys & Games': [
    { label: 'Educational Toys', labelBn: 'শিক্ষামূলক খেলনা',  href: '/categories/baby-products?tag=educational' },
    { label: 'Soft Toys',        labelBn: 'নরম খেলনা',          href: '/categories/baby-products?tag=soft-toys' },
    { label: 'Board Games',      labelBn: 'বোর্ড গেমস',         href: '/categories/baby-products?tag=board-games' },
  ],
  'Baby Clothing': [
    { label: 'Newborn (0-3m)',   labelBn: 'নবজাতক (০-৩ মাস)', href: '/categories/baby-products?tag=newborn' },
    { label: 'Infant (3-12m)',   labelBn: 'শিশু (৩-১২ মাস)',  href: '/categories/baby-products?tag=infant' },
    { label: 'Toddler (1-3y)',   labelBn: 'ছোটো শিশু (১-৩ বছর)',href: '/categories/baby-products?tag=toddler' },
  ],
  'Wallets & Cards': [
    { label: 'Bifold Wallets',   labelBn: 'বাইফোল্ড মানিব্যাগ', href: '/categories/leather-products?tag=bifold' },
    { label: 'Card Holders',     labelBn: 'কার্ড হোল্ডার',       href: '/categories/leather-products?tag=card-holder' },
    { label: 'Coin Purses',      labelBn: 'কয়েন পার্স',          href: '/categories/leather-products?tag=coin-purse' },
  ],
  'Bags & Backpacks': [
    { label: 'Office Bags',      labelBn: 'অফিস ব্যাগ',         href: '/categories/leather-products?tag=office-bag' },
    { label: 'Backpacks',        labelBn: 'ব্যাকপ্যাক',          href: '/categories/leather-products?tag=backpack' },
    { label: 'Ladies Bags',      labelBn: 'লেডিস ব্যাগ',         href: '/categories/leather-products?tag=ladies-bag' },
    { label: 'Clutches',         labelBn: 'ক্লাচ ব্যাগ',         href: '/categories/leather-products?tag=clutch' },
  ],
  'Belts & Accessories': [
    { label: 'Formal Belts',     labelBn: 'ফর্মাল বেল্ট',        href: '/categories/leather-products?tag=formal-belt' },
    { label: 'Casual Belts',     labelBn: 'ক্যাজুয়াল বেল্ট',     href: '/categories/leather-products?tag=casual-belt' },
    { label: 'Keychains',        labelBn: 'কী চেইন',             href: '/categories/leather-products?tag=keychain' },
  ],
  "Men's Footwear": [
    { label: 'Formal Shoes',     labelBn: 'ফর্মাল জুতা',         href: '/categories/leather-products?tag=mens-formal' },
    { label: 'Loafers',          labelBn: 'লোফার',               href: '/categories/leather-products?tag=loafers' },
    { label: 'Sandals',          labelBn: 'স্যান্ডেল',            href: '/categories/leather-products?tag=sandals' },
  ],
  "Women's Footwear": [
    { label: 'Heels',            labelBn: 'হিলস',                href: '/categories/leather-products?tag=heels' },
    { label: 'Flats',            labelBn: 'ফ্ল্যাটস',             href: '/categories/leather-products?tag=flats' },
    { label: 'Wedges',           labelBn: 'ওয়েজেস',              href: '/categories/leather-products?tag=wedges' },
  ],
  'Nuts & Seeds': [
    { label: 'Almonds',          labelBn: 'কাঠবাদাম',            href: '/categories/organic-foods?tag=almonds' },
    { label: 'Cashews',          labelBn: 'কাজুবাদাম',           href: '/categories/organic-foods?tag=cashews' },
    { label: 'Pumpkin Seeds',    labelBn: 'কুমড়ার বীজ',          href: '/categories/organic-foods?tag=pumpkin-seeds' },
    { label: 'Mixed Nuts',       labelBn: 'মিক্সড নাটস',          href: '/categories/organic-foods?tag=mixed-nuts' },
  ],
  'Honey & Sweeteners': [
    { label: 'Wild Honey',       labelBn: 'বন মধু',              href: '/categories/organic-foods?tag=wild-honey' },
    { label: 'Mustard Honey',    labelBn: 'সরিষার মধু',           href: '/categories/organic-foods?tag=mustard-honey' },
    { label: 'Date Molasses',    labelBn: 'খেজুরের গুড়',          href: '/categories/organic-foods?tag=date-molasses' },
  ],
  'Spices & Herbs': [
    { label: 'Turmeric',         labelBn: 'হলুদ',                href: '/categories/organic-foods?tag=turmeric' },
    { label: 'Black Seed',       labelBn: 'কালিজিরা',            href: '/categories/organic-foods?tag=black-seed' },
    { label: 'Cinnamon',         labelBn: 'দারচিনি',             href: '/categories/organic-foods?tag=cinnamon' },
  ],
  'Healthy Snacks': [
    { label: 'Granola Bars',     labelBn: 'গ্রানোলা বার',         href: '/categories/organic-foods?tag=granola' },
    { label: 'Dried Fruits',     labelBn: 'শুকনো ফল',            href: '/categories/organic-foods?tag=dried-fruits' },
    { label: 'Trail Mix',        labelBn: 'ট্রেইল মিক্স',         href: '/categories/organic-foods?tag=trail-mix' },
  ],
  'Tea & Beverages': [
    { label: 'Green Tea',        labelBn: 'গ্রিন টি',            href: '/categories/organic-foods?tag=green-tea' },
    { label: 'Herbal Tea',       labelBn: 'হার্বাল টি',           href: '/categories/organic-foods?tag=herbal-tea' },
    { label: 'Black Tea',        labelBn: 'ব্লাক টি',            href: '/categories/organic-foods?tag=black-tea' },
  ],
  'Wall Art': [
    { label: 'Canvas Prints',    labelBn: 'ক্যানভাস প্রিন্ট',    href: '/categories/handicrafts?tag=canvas' },
    { label: 'Calligraphy',      labelBn: 'ক্যালিগ্রাফি',         href: '/categories/handicrafts?tag=calligraphy' },
    { label: 'Paintings',        labelBn: 'চিত্রকর্ম',            href: '/categories/handicrafts?tag=paintings' },
  ],
  'Showpieces': [
    { label: 'Clay Items',       labelBn: 'মাটির জিনিস',          href: '/categories/handicrafts?tag=clay' },
    { label: 'Wooden Crafts',    labelBn: 'কাঠের শিল্প',          href: '/categories/handicrafts?tag=wooden' },
    { label: 'Jute Products',    labelBn: 'পাটের পণ্য',           href: '/categories/handicrafts?tag=jute' },
  ],
  'Traditional Crafts': [
    { label: 'Nakshi Kantha',    labelBn: 'নকশি কাঁথা',           href: '/categories/handicrafts?tag=nakshi-kantha' },
    { label: 'Muslin',           labelBn: 'মসলিন',               href: '/categories/handicrafts?tag=muslin' },
    { label: 'Jamdani',          labelBn: 'জামদানি',              href: '/categories/handicrafts?tag=jamdani' },
  ],
  'Mobiles': [
    { label: 'Samsung',          labelBn: 'স্যামসাং',             href: '/categories/electronics?tag=samsung' },
    { label: 'iPhone',           labelBn: 'আইফোন',               href: '/categories/electronics?tag=iphone' },
    { label: 'Xiaomi',           labelBn: 'শাওমি',               href: '/categories/electronics?tag=xiaomi' },
    { label: 'Realme',           labelBn: 'রিয়েলমি',             href: '/categories/electronics?tag=realme' },
  ],
  'Laptops': [
    { label: 'Gaming Laptops',   labelBn: 'গেমিং ল্যাপটপ',        href: '/categories/electronics?tag=gaming-laptop' },
    { label: 'Office Laptops',   labelBn: 'অফিস ল্যাপটপ',         href: '/categories/electronics?tag=office-laptop' },
    { label: 'MacBook',          labelBn: 'ম্যাকবুক',             href: '/categories/electronics?tag=macbook' },
  ],
  'Accessories': [
    { label: 'Earbuds & TWS',    labelBn: 'ইয়ারবাডস',            href: '/categories/electronics?tag=earbuds' },
    { label: 'Smartwatches',     labelBn: 'স্মার্টওয়াচ',          href: '/categories/electronics?tag=smartwatch' },
    { label: 'Power Banks',      labelBn: 'পাওয়ার ব্যাংক',         href: '/categories/electronics?tag=power-bank' },
    { label: 'Chargers & Cables',labelBn: 'চার্জার ও ক্যাবল',     href: '/categories/electronics?tag=charger' },
  ],
  'Home Appliances': [
    { label: 'Air Purifiers',    labelBn: 'এয়ার পিউরিফায়ার',      href: '/categories/electronics?tag=air-purifier' },
    { label: 'Rice Cookers',     labelBn: 'রাইস কুকার',           href: '/categories/electronics?tag=rice-cooker' },
    { label: 'Fans',             labelBn: 'ফ্যান',                href: '/categories/electronics?tag=fan' },
  ],
  'Gadgets': [
    { label: 'Smart Cameras',    labelBn: 'স্মার্ট ক্যামেরা',      href: '/categories/electronics?tag=camera' },
    { label: 'Drones',           labelBn: 'ড্রোন',               href: '/categories/electronics?tag=drone' },
    { label: 'Gaming Controllers',labelBn:'গেমিং কন্ট্রোলার',    href: '/categories/electronics?tag=gaming' },
  ],
  'Grocery': [
    { label: 'Rice & Flour',     labelBn: 'চাল ও আটা',            href: '/categories/daily-needs?tag=rice' },
    { label: 'Cooking Oil',      labelBn: 'রান্নার তেল',           href: '/categories/daily-needs?tag=oil' },
    { label: 'Pulses & Lentils', labelBn: 'ডাল',                  href: '/categories/daily-needs?tag=lentils' },
  ],
  'Personal Care': [
    { label: 'Skin Care',        labelBn: 'স্কিন কেয়ার',          href: '/categories/daily-needs?tag=skincare' },
    { label: 'Hair Care',        labelBn: 'হেয়ার কেয়ার',           href: '/categories/daily-needs?tag=haircare' },
    { label: 'Oral Care',        labelBn: 'ওরাল কেয়ার',           href: '/categories/daily-needs?tag=oral' },
  ],
  'Household': [
    { label: 'Cleaning Products',labelBn: 'ক্লিনিং প্রোডাক্ট',   href: '/categories/daily-needs?tag=cleaning' },
    { label: 'Kitchen Tools',    labelBn: 'কিচেন টুলস',           href: '/categories/daily-needs?tag=kitchen' },
    { label: 'Storage & Org.',   labelBn: 'স্টোরেজ',              href: '/categories/daily-needs?tag=storage' },
  ],
  'Stationery': [
    { label: 'Notebooks & Pads', labelBn: 'নোটবুক',              href: '/categories/daily-needs?tag=notebooks' },
    { label: 'Pens & Markers',   labelBn: 'কলম',                 href: '/categories/daily-needs?tag=pens' },
    { label: 'Art Supplies',     labelBn: 'আর্ট সাপ্লাইজ',        href: '/categories/daily-needs?tag=art' },
  ],
  'Pet Care': [
    { label: 'Pet Food',         labelBn: 'পোষা প্রাণীর খাবার',   href: '/categories/daily-needs?tag=pet-food' },
    { label: 'Pet Accessories',  labelBn: 'পোষা প্রাণীর সামগ্রী', href: '/categories/daily-needs?tag=pet-accessories' },
  ],
};

const BN_SUBNAV: Record<string, Record<string, string>> = {
  '/categories/baby-products':    { 'Diapering & Care': 'ডায়াপার ও যত্ন', 'Feeding & Nursing': 'ফিডিং', 'Baby Gear': 'বেবি গিয়ার', 'Toys & Games': 'খেলনা', 'Baby Clothing': 'শিশু পোশাক' },
  '/categories/leather-products': { 'Wallets & Cards': 'পার্স ও কার্ড', 'Bags & Backpacks': 'ব্যাগ', 'Belts & Accessories': 'বেল্ট', "Men's Footwear": 'পুরুষ জুতা', "Women's Footwear": 'নারী জুতা' },
  '/categories/organic-foods':    { 'Nuts & Seeds': 'বাদাম ও বীজ', 'Honey & Sweeteners': 'মধু', 'Spices & Herbs': 'মশলা', 'Healthy Snacks': 'স্বাস্থ্যকর স্ন্যাকস', 'Tea & Beverages': 'চা ও পানীয়' },
  '/categories/handicrafts':      { 'Wall Art': 'দেওয়াল শিল্প', 'Showpieces': 'শোপিস', 'Lamps & Lighting': 'প্রদীপ', 'Rugs & Carpets': 'কার্পেট', 'Traditional Crafts': 'ঐতিহ্যবাহী শিল্প' },
  '/categories/electronics':      { 'Mobiles': 'মোবাইল', 'Laptops': 'ল্যাপটপ', 'Accessories': 'আনুষাঙ্গিক', 'Home Appliances': 'হোম অ্যাপ্লায়েন্স', 'Gadgets': 'গ্যাজেট' },
  '/categories/daily-needs':      { 'Grocery': 'মুদি', 'Personal Care': 'ব্যক্তিগত যত্ন', 'Household': 'গৃহস্থালি', 'Stationery': 'স্টেশনারি', 'Pet Care': 'পোষা প্রাণীর যত্ন' },
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { cart, toggleCart } = useCartStore();
  const { logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubnav, setActiveSubnav] = useState<string | null>(null);

  const itemCount = cart?.itemCount ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const activeCategory = NAV_CATEGORIES[activeCategoryIndex] ?? NAV_CATEGORIES[0];

  const getCatName = (cat: NavCategory) =>
    lang === 'bn' ? t.nav[cat.nameKey] : cat.displayName;

  const getSubLabel = (sub: string) => {
    if (lang === 'bn') {
      if (activeCategory!.slug === '/books') {
        return (t.booksSubnav as Record<string, string>)[sub] ?? sub;
      }
      return BN_SUBNAV[activeCategory!.slug]?.[sub] ?? sub;
    }
    return sub;
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full shadow-sm border-b border-gray-200 bg-white">

        {/* ── Tier 1: Utility bar ── */}
        <div className="bg-[#1a1a1a] py-1.5 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-[11px] text-gray-300 font-medium">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                <MapPin className="w-3 h-3 text-primary" />
                {t.header.deliverTo} <span className="font-bold text-white ml-0.5">{t.header.selectAddress}</span>
              </span>
              <div className="h-3 w-px bg-gray-600" />
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-primary" />
                <span>{t.header.callHours}</span>
              </div>
              <div className="h-3 w-px bg-gray-600" />
              {/* Language toggle */}
              <div className="flex items-center bg-gray-800 rounded-full px-1 py-0.5 border border-gray-700">
                <button
                  onClick={() => setLang('en')}
                  className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors',
                    lang === 'en' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white')}
                >
                  ENG
                </button>
                <button
                  onClick={() => setLang('bn')}
                  className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors',
                    lang === 'bn' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white')}
                >
                  বাংলা
                </button>
              </div>
            </div>
            <div className="flex items-center gap-5 uppercase tracking-wide">
              <a href="#" className="hover:text-primary transition-colors flex items-center gap-1">
                <Download className="w-3 h-3" /> {t.header.downloadApp}
              </a>
              <a href="#" className="hover:text-primary transition-colors flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> {t.header.support}
              </a>
              <a href="#" className="hover:text-primary transition-colors">{t.header.trackOrder}</a>
              <a href="#" className="hover:text-primary transition-colors font-bold text-white">{t.header.sellOnUnkora}</a>
            </div>
          </div>
        </div>

        {/* ── Tier 2: Main bar ── */}
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 relative z-40 bg-white">
          <div className="flex items-center justify-between gap-4 md:gap-6 lg:gap-8">

            {/* Mobile toggle + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-gray-800 hover:text-secondary transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link href="/" className="text-2xl md:text-3xl font-black tracking-tight flex items-center">
                <span className="text-gray-900">UNKORA</span>
                <span className="text-secondary">.SHOP</span>
              </Link>
            </div>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-grow max-w-3xl relative">
              <div className="flex w-full rounded-lg overflow-hidden border-2 border-gray-200 focus-within:border-primary focus-within:shadow-md transition-all duration-300">
                <select className="bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 border-r border-gray-200 cursor-pointer hover:bg-gray-200 focus:outline-none">
                  <option value="">{lang === 'bn' ? 'সব' : 'All'}</option>
                  {NAV_CATEGORIES.map(c => (
                    <option key={c.slug} value={c.slug}>{getCatName(c)}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t.header.searchPlaceholder}
                  className="w-full px-4 py-2.5 outline-none text-[15px] placeholder:text-gray-400 text-black border-none"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/80 text-white px-8 transition-colors flex items-center justify-center font-bold"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Icons */}
            <div className="flex items-center gap-5 md:gap-6 lg:gap-8 flex-shrink-0 text-gray-800">
              {/* Account */}
              <div className="flex items-center gap-2 cursor-pointer group hover:text-secondary transition-colors">
                <div className="p-2">
                  <User className="w-[26px] h-[26px]" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[10px] text-gray-500 font-bold uppercase leading-tight">
                    {isAuthenticated ? `${lang === 'bn' ? 'হ্যালো,' : 'Hello,'} ${user?.firstName ?? user?.name ?? ''}` : t.header.helloSignIn}
                  </p>
                  {isAuthenticated ? (
                    <Link href="/account" className="text-sm font-bold leading-tight flex items-center hover:text-secondary transition-colors">
                      {t.header.accountOrders} <ChevronDown className="w-3 h-3 ml-0.5" />
                    </Link>
                  ) : (
                    <Link href="/login" className="text-sm font-bold leading-tight flex items-center hover:text-secondary transition-colors">
                      {t.header.accountsLists} <ChevronDown className="w-3 h-3 ml-0.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Admin link */}
              {isAuthenticated && user?.role !== 'CUSTOMER' && (
                <Link href="/admin" className="hidden lg:inline text-xs font-bold text-primary border border-primary/30 rounded px-2 py-1 hover:bg-primary hover:text-white transition-colors">
                  {t.header.admin}
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative group cursor-pointer p-2 hover:text-secondary transition-colors flex items-center gap-2"
                aria-label="Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-[28px] h-[28px]" />
                  <span className="absolute -top-1.5 -right-2 bg-secondary text-white text-[11px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                </div>
                <div className="hidden xl:block text-left pt-2">
                  <p className="text-sm font-bold leading-tight">{t.header.cart}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-3 md:hidden bg-primary/20 p-2 rounded-lg">
            <form onSubmit={handleSearch} className="flex rounded-lg overflow-hidden border-2 border-white bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-300">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.header.searchPlaceholderMobile}
                className="w-full px-4 py-2.5 outline-none text-sm placeholder:text-gray-400 text-black"
              />
              <button type="submit" className="bg-primary text-white px-5 hover:bg-primary/80 transition-colors flex items-center justify-center">
                <Search className="w-[18px] h-[18px]" />
              </button>
            </form>
          </div>
        </div>

        {/* ── Tier 3: Category nav (desktop) ── */}
        <div className="bg-white hidden lg:block border-b border-gray-200">
          <div className="max-w-7xl mx-auto pl-4 flex items-center relative">
            <button className="bg-gray-900 text-white flex items-center gap-2 px-5 py-3 font-bold text-sm cursor-pointer hover:bg-gray-800 transition-colors mr-6 shrink-0">
              <Menu className="w-[18px] h-[18px]" /> {t.header.allDepartments}
            </button>

            <nav className="flex items-center justify-start h-[48px] text-[14px] font-bold text-gray-700 flex-1 overflow-x-auto hide-scrollbar">
              {NAV_CATEGORIES.map((cat, idx) => (
                <Link
                  key={cat.slug}
                  href={cat.slug}
                  onMouseEnter={() => setActiveCategoryIndex(idx)}
                  className={cn(
                    'px-5 h-full flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap relative',
                    activeCategoryIndex === idx ? 'text-primary' : 'hover:text-primary',
                  )}
                >
                  <cat.icon className={cn('w-4 h-4 hidden xl:block', activeCategoryIndex === idx ? 'text-primary' : 'opacity-70')} />
                  {getCatName(cat)}
                  {activeCategoryIndex === idx && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" />
                  )}
                </Link>
              ))}
            </nav>

            <Link href="#" className="shrink-0 px-4 h-[48px] flex items-center text-sm font-bold text-secondary hover:text-amber-600 transition-colors ml-auto">
              {t.header.dealOfDay} <span className="text-red-600 text-lg ml-1">🔥</span>
            </Link>
          </div>
        </div>

        {/* ── Tier 4: Subnav ── */}
        <div className="bg-gray-50 hidden lg:block border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-6 h-[44px] overflow-x-auto hide-scrollbar">
              {activeCategory!.subnav.map(sub => {
                const dropdown = SUBNAV_DROPDOWNS[sub];
                const isOpen = activeSubnav === sub;
                return (
                  <div
                    key={sub}
                    className="relative h-full flex items-center"
                    onMouseEnter={() => setActiveSubnav(sub)}
                    onMouseLeave={() => setActiveSubnav(null)}
                  >
                    <Link
                      href={getSubnavHref(activeCategory!.slug, sub)}
                      className={`text-[13px] font-bold flex items-center gap-1 whitespace-nowrap transition-colors ${isOpen ? 'text-secondary' : 'text-gray-800 hover:text-secondary'}`}
                    >
                      {getSubLabel(sub)}
                      {dropdown && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180 text-secondary' : 'text-gray-600'}`} />}
                    </Link>
                    {dropdown && isOpen && (
                      <div className="absolute top-full left-0 bg-white shadow-xl rounded-lg py-2 min-w-[200px] z-50 border border-gray-100">
                        <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />
                        {dropdown.map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-primary transition-colors"
                          >
                            {lang === 'bn' ? item.labelBn : item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 lg:hidden opacity-100 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-50 lg:hidden shadow-2xl flex flex-col overflow-y-auto transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Drawer header */}
        <div className="p-5 bg-gray-900 text-white flex items-center justify-between sticky top-0">
          <div className="text-2xl font-black tracking-tight flex items-center">
            <span>UNKORA</span><span className="text-primary">.SHOP</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white transition-colors border border-gray-700 rounded-md"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User area */}
        <div className="p-5 bg-primary text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center shadow-sm border border-white/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-lg">{isAuthenticated ? (user?.firstName ?? user?.name) : t.header.helloSignIn}</p>
            <Link href={isAuthenticated ? '/account' : '/login'} onClick={() => setSidebarOpen(false)} className="text-[13px] font-medium opacity-80 underline decoration-white/60">
              {isAuthenticated ? t.header.viewAccount : t.header.yourAccount}
            </Link>
          </div>
        </div>

        {/* Language toggle (mobile) */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <span className="text-sm text-gray-500 font-medium">{lang === 'bn' ? 'ভাষা:' : 'Language:'}</span>
          <button
            onClick={() => setLang('bn')}
            className={cn('px-3 py-1 rounded-full text-xs font-bold transition-colors', lang === 'bn' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600')}
          >বাংলা</button>
          <button
            onClick={() => setLang('en')}
            className={cn('px-3 py-1 rounded-full text-xs font-bold transition-colors', lang === 'en' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600')}
          >English</button>
        </div>

        {/* Category list */}
        <div className="flex flex-col py-4">
          <p className="px-5 pt-2 pb-3 text-lg font-black text-gray-900 tracking-tight">{t.header.ourDepartments}</p>
          {NAV_CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={cat.slug}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'py-3.5 px-5 hover:bg-orange-50 font-semibold text-gray-700 flex items-center gap-3 border-b border-gray-100 transition-colors',
                pathname.startsWith(cat.slug) ? 'text-primary bg-accent' : '',
              )}
            >
              <span className="text-primary"><cat.icon className="w-4 h-4" /></span>
              {getCatName(cat)}
            </Link>
          ))}
          <Link href="#" onClick={() => setSidebarOpen(false)} className="py-3.5 px-5 hover:bg-orange-50 font-bold text-secondary flex items-center justify-between mt-2">
            <span>{t.header.dealOfDay} 🔥</span>
          </Link>
        </div>

        {/* Help */}
        <div className="border-t">
          <p className="px-5 pt-4 pb-2 text-lg font-black text-gray-900 tracking-tight">{t.header.helpSettings}</p>
          <Link href="/account/orders" onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary block">{t.header.yourOrders}</Link>
          <Link href="#" className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {t.header.deliverTo}
          </Link>
          <Link href="#" className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> {t.header.customerService}
          </Link>
          {isAuthenticated && (
            <button
              onClick={() => { void logout.mutate(); setSidebarOpen(false); }}
              className="py-2.5 px-5 text-[15px] font-medium text-red-500 hover:text-red-700 flex items-center gap-2 w-full text-left"
            >
              <X className="w-4 h-4" /> {t.header.signOut}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
