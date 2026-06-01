'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Book, Baby, Briefcase, Leaf, Palette, Zap, ShoppingBag, Moon,
  Menu, X, Search, User, ShoppingCart, ChevronDown,
  MapPin, Phone, HelpCircle,
  Package, Heart, CreditCard, Settings, LogOut, Gift, Truck, CalendarClock, Store,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useGuestCart } from '@/store/guest-cart.store';
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
  { nameKey: 'books',            displayName: 'Books',             icon: Book,        slug: 'books',            subnav: ['Authors', 'Subjects', 'Publishers', 'Academic Books', 'E-Books', 'Islamic Books'] },
  { nameKey: 'babyProducts',     displayName: 'Baby Products',     icon: Baby,        slug: 'baby-products',    subnav: ['Diapering & Care', 'Feeding & Nursing', 'Baby Gear', 'Toys & Games', 'Baby Clothing'] },
  { nameKey: 'leatherProducts',  displayName: 'Leather Products',  icon: Briefcase,   slug: 'leather-products', subnav: ['Wallets & Cards', 'Bags & Backpacks', 'Belts & Accessories', "Men's Footwear", "Women's Footwear"] },
  { nameKey: 'organicFoods',     displayName: 'Organic Foods',     icon: Leaf,        slug: 'organic-foods',    subnav: ['Nuts & Seeds', 'Honey & Sweeteners', 'Spices & Herbs', 'Healthy Snacks', 'Tea & Beverages'] },
  { nameKey: 'islamicLifestyle', displayName: 'Islamic Lifestyle', icon: Moon,        slug: 'islamic-lifestyle', subnav: ['Prayer Essentials', 'Islamic Books (Lifestyle)', 'Quran Accessories', 'Islamic Clothing', 'Perfumes & Oud', 'Tasbih & Decor'] },
  { nameKey: 'handicrafts',      displayName: 'Handicrafts',       icon: Palette,     slug: 'handicrafts',      subnav: ['Wall Art', 'Showpieces', 'Lamps & Lighting', 'Rugs & Carpets', 'Traditional Crafts'] },
  { nameKey: 'electronics',      displayName: 'Electronics',       icon: Zap,         slug: 'electronics',      subnav: ['Mobiles', 'Laptops', 'Accessories', 'Home Appliances', 'Gadgets'] },
  { nameKey: 'dailyNeeds',       displayName: 'Daily Needs',       icon: ShoppingBag, slug: 'daily-needs',      subnav: ['Grocery', 'Personal Care', 'Household', 'Stationery', 'Pet Care'] },
];

function getSubnavHref(catSlug: string, sub: string): string {
  return `/products?categorySlug=${encodeURIComponent(catSlug)}`;
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
  'Prayer Essentials': [
    { label: 'Prayer Mats',      labelBn: 'জায়নামাজ',             href: '/islamic-lifestyle?tag=prayer-mat' },
    { label: 'Prayer Caps',      labelBn: 'টুপি',                  href: '/islamic-lifestyle?tag=prayer-cap' },
    { label: 'Prayer Beads',     labelBn: 'তাসবিহ',               href: '/islamic-lifestyle?tag=tasbih' },
    { label: 'Miswak',           labelBn: 'মিসওয়াক',              href: '/islamic-lifestyle?tag=miswak' },
  ],
  'Islamic Books (Lifestyle)': [
    { label: 'Quran',            labelBn: 'কুরআন',                href: '/islamic-lifestyle?tag=quran' },
    { label: 'Hadith',           labelBn: 'হাদিস',                href: '/islamic-lifestyle?tag=hadith' },
    { label: 'Islamic Fiction',  labelBn: 'ইসলামি উপন্যাস',        href: '/islamic-lifestyle?tag=islamic-fiction' },
    { label: 'All Islamic Books →', labelBn: 'সব ইসলামিক বই →',   href: '/islamic-lifestyle' },
  ],
  'Quran Accessories': [
    { label: 'Quran Stands',     labelBn: 'কুরআন স্ট্যান্ড',       href: '/islamic-lifestyle?tag=quran-stand' },
    { label: 'Quran Covers',     labelBn: 'কুরআন কভার',            href: '/islamic-lifestyle?tag=quran-cover' },
    { label: 'Reading Lamps',    labelBn: 'পড়ার বাতি',             href: '/islamic-lifestyle?tag=reading-lamp' },
  ],
  'Islamic Clothing': [
    { label: 'Panjabi',          labelBn: 'পাঞ্জাবি',              href: '/islamic-lifestyle?tag=panjabi' },
    { label: 'Hijab',            labelBn: 'হিজাব',                 href: '/islamic-lifestyle?tag=hijab' },
    { label: 'Abaya',            labelBn: 'আবায়া',                 href: '/islamic-lifestyle?tag=abaya' },
    { label: 'All Clothing →',   labelBn: 'সব পোশাক →',            href: '/islamic-lifestyle?tag=clothing' },
  ],
  'Perfumes & Oud': [
    { label: 'Attar',            labelBn: 'আতর',                  href: '/islamic-lifestyle?tag=attar' },
    { label: 'Oud',              labelBn: 'আউড',                  href: '/islamic-lifestyle?tag=oud' },
    { label: 'Room Fragrance',   labelBn: 'রুম ফ্রেগ্রেন্স',       href: '/islamic-lifestyle?tag=fragrance' },
  ],
  'Tasbih & Decor': [
    { label: 'Tasbih Beads',     labelBn: 'তাসবিহ দানা',           href: '/islamic-lifestyle?tag=tasbih' },
    { label: 'Calligraphy Art',  labelBn: 'ক্যালিগ্রাফি শিল্প',    href: '/islamic-lifestyle?tag=calligraphy' },
    { label: 'Islamic Wall Art', labelBn: 'ইসলামিক ওয়াল আর্ট',    href: '/islamic-lifestyle?tag=wall-art' },
    { label: 'All Decor →',      labelBn: 'সব ডেকোর →',           href: '/islamic-lifestyle?tag=decor' },
  ],
};

const BN_SUBNAV: Record<string, Record<string, string>> = {
  'baby-products':    { 'Diapering & Care': 'ডায়াপার ও যত্ন', 'Feeding & Nursing': 'ফিডিং', 'Baby Gear': 'বেবি গিয়ার', 'Toys & Games': 'খেলনা', 'Baby Clothing': 'শিশু পোশাক' },
  'leather-products': { 'Wallets & Cards': 'পার্স ও কার্ড', 'Bags & Backpacks': 'ব্যাগ', 'Belts & Accessories': 'বেল্ট', "Men's Footwear": 'পুরুষ জুতা', "Women's Footwear": 'নারী জুতা' },
  'organic-foods':    { 'Nuts & Seeds': 'বাদাম ও বীজ', 'Honey & Sweeteners': 'মধু', 'Spices & Herbs': 'মশলা', 'Healthy Snacks': 'স্বাস্থ্যকর স্ন্যাকস', 'Tea & Beverages': 'চা ও পানীয়' },
  'handicrafts':      { 'Wall Art': 'দেওয়াল শিল্প', 'Showpieces': 'শোপিস', 'Lamps & Lighting': 'প্রদীপ', 'Rugs & Carpets': 'কার্পেট', 'Traditional Crafts': 'ঐতিহ্যবাহী শিল্প' },
  'electronics':      { 'Mobiles': 'মোবাইল', 'Laptops': 'ল্যাপটপ', 'Accessories': 'আনুষাঙ্গিক', 'Home Appliances': 'হোম অ্যাপ্লায়েন্স', 'Gadgets': 'গ্যাজেট' },
  'daily-needs':        { 'Grocery': 'মুদি', 'Personal Care': 'ব্যক্তিগত যত্ন', 'Household': 'গৃহস্থালি', 'Stationery': 'স্টেশনারি', 'Pet Care': 'পোষা প্রাণীর যত্ন' },
  'islamic-lifestyle':  { 'Prayer Essentials': 'নামাজের সরঞ্জাম', 'Islamic Books (Lifestyle)': 'ইসলামিক বই', 'Quran Accessories': 'কুরআন সামগ্রী', 'Islamic Clothing': 'ইসলামিক পোশাক', 'Perfumes & Oud': 'আতর ও আউড', 'Tasbih & Decor': 'তাসবিহ ও ডেকোর' },
};

const MEGA_CATEGORIES = [
  {
    emoji: '📚', name: 'Books', nameBn: 'বই',
    href: '/products?categorySlug=books',
    subs: [
      { label: 'Novel / Fiction', labelBn: 'উপন্যাস',      href: '/products?categorySlug=books' },
      { label: 'Islamic Books',   labelBn: 'ইসলামিক বই',   href: '/products?categorySlug=books' },
      { label: 'Self-Help',       labelBn: 'আত্মউন্নয়ন',   href: '/products?categorySlug=books' },
      { label: 'Academic',        labelBn: 'একাডেমিক',      href: '/products?categorySlug=books' },
      { label: 'All Books →',     labelBn: 'সব বই →',      href: '/products?categorySlug=books' },
    ],
  },
  {
    emoji: '👶', name: 'Baby Products', nameBn: 'শিশু পণ্য',
    href: '/products?categorySlug=baby-products',
    subs: [
      { label: 'Diapers',      labelBn: 'ডায়াপার',        href: '/products?categorySlug=baby-products' },
      { label: 'Baby Food',    labelBn: 'শিশু খাদ্য',      href: '/products?categorySlug=baby-products' },
      { label: 'Toys',         labelBn: 'খেলনা',           href: '/products?categorySlug=baby-products' },
      { label: 'Clothing',     labelBn: 'শিশু পোশাক',      href: '/products?categorySlug=baby-products' },
      { label: 'All Baby →',   labelBn: 'সব শিশু পণ্য →', href: '/products?categorySlug=baby-products' },
    ],
  },
  {
    emoji: '👜', name: 'Leather', nameBn: 'চামড়া পণ্য',
    href: '/products?categorySlug=leather-products',
    subs: [
      { label: 'Wallets',        labelBn: 'মানিব্যাগ',    href: '/products?categorySlug=leather-products' },
      { label: 'Bags',           labelBn: 'ব্যাগ',         href: '/products?categorySlug=leather-products' },
      { label: 'Belts',          labelBn: 'বেল্ট',         href: '/products?categorySlug=leather-products' },
      { label: 'Shoes',          labelBn: 'জুতা',          href: '/products?categorySlug=leather-products' },
      { label: 'All Leather →',  labelBn: 'সব চামড়া →',  href: '/products?categorySlug=leather-products' },
    ],
  },
  {
    emoji: '🌿', name: 'Organic', nameBn: 'অর্গানিক',
    href: '/products?categorySlug=organic-foods',
    subs: [
      { label: 'Honey',          labelBn: 'মধু',            href: '/products?categorySlug=organic-foods' },
      { label: 'Nuts & Seeds',   labelBn: 'বাদাম ও বীজ',   href: '/products?categorySlug=organic-foods' },
      { label: 'Spices',         labelBn: 'মশলা',           href: '/products?categorySlug=organic-foods' },
      { label: 'Tea',            labelBn: 'চা',             href: '/products?categorySlug=organic-foods' },
      { label: 'All Organic →',  labelBn: 'সব অর্গানিক →', href: '/products?categorySlug=organic-foods' },
    ],
  },
  {
    emoji: '🕌', name: 'Islamic Lifestyle', nameBn: 'ইসলামিক লাইফস্টাইল',
    href: '/islamic-lifestyle',
    subs: [
      { label: 'Prayer Essentials', labelBn: 'নামাজের সরঞ্জাম',   href: '/islamic-lifestyle' },
      { label: 'Quran Accessories', labelBn: 'কুরআন সামগ্রী',      href: '/islamic-lifestyle' },
      { label: 'Islamic Clothing',  labelBn: 'ইসলামিক পোশাক',      href: '/islamic-lifestyle' },
      { label: 'Perfumes & Oud',    labelBn: 'আতর ও আউড',          href: '/islamic-lifestyle' },
      { label: 'All Islamic →',     labelBn: 'সব ইসলামিক পণ্য →', href: '/islamic-lifestyle' },
    ],
  },
  {
    emoji: '🎨', name: 'Handicrafts', nameBn: 'হস্তশিল্প',
    href: '/products?categorySlug=handicrafts',
    subs: [
      { label: 'Wall Art',       labelBn: 'দেওয়াল শিল্প',  href: '/products?categorySlug=handicrafts' },
      { label: 'Showpieces',     labelBn: 'শোপিস',          href: '/products?categorySlug=handicrafts' },
      { label: 'Traditional',    labelBn: 'ঐতিহ্যবাহী',    href: '/products?categorySlug=handicrafts' },
      { label: 'Pottery',        labelBn: 'মাটির পণ্য',     href: '/products?categorySlug=handicrafts' },
      { label: 'All Crafts →',   labelBn: 'সব হস্তশিল্প →', href: '/products?categorySlug=handicrafts' },
    ],
  },
  {
    emoji: '⚡', name: 'Electronics', nameBn: 'ইলেকট্রনিক্স',
    href: '/products?categorySlug=electronics',
    subs: [
      { label: 'Mobiles',         labelBn: 'মোবাইল',            href: '/products?categorySlug=electronics' },
      { label: 'Laptops',         labelBn: 'ল্যাপটপ',           href: '/products?categorySlug=electronics' },
      { label: 'Accessories',     labelBn: 'আনুষাঙ্গিক',        href: '/products?categorySlug=electronics' },
      { label: 'Gadgets',         labelBn: 'গ্যাজেট',           href: '/products?categorySlug=electronics' },
      { label: 'All Electronics →', labelBn: 'সব ইলেকট্রনিক্স →', href: '/products?categorySlug=electronics' },
    ],
  },
  {
    emoji: '🛒', name: 'Daily Needs', nameBn: 'দৈনন্দিন',
    href: '/products?categorySlug=daily-needs',
    subs: [
      { label: 'Grocery',        labelBn: 'মুদি পণ্য',          href: '/products?categorySlug=daily-needs' },
      { label: 'Personal Care',  labelBn: 'ব্যক্তিগত যত্ন',     href: '/products?categorySlug=daily-needs' },
      { label: 'Household',      labelBn: 'গৃহস্থালি',           href: '/products?categorySlug=daily-needs' },
      { label: 'Stationery',     labelBn: 'স্টেশনারি',           href: '/products?categorySlug=daily-needs' },
      { label: 'All Daily →',    labelBn: 'সব দৈনন্দিন →',      href: '/products?categorySlug=daily-needs' },
    ],
  },
];

// ── Rich right-panel content for each mega-menu category ──────────────────────
const MEGA_CONTENT = [
  // 0 — Books (Rokomari + Amazon inspired)
  {
    recommended: [
      { label: 'Novel & Fiction',   labelBn: 'উপন্যাস',         emoji: '📖', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
      { label: 'Islamic Books',     labelBn: 'ইসলামিক বই',      emoji: '🕌', color: 'bg-amber-50 border-amber-200 text-amber-700' },
      { label: 'Academic / BCS',    labelBn: 'একাডেমিক / বিসিএস', emoji: '🎓', color: 'bg-blue-50 border-blue-200 text-blue-700' },
      { label: 'Self-Help',         labelBn: 'আত্মউন্নয়ন',      emoji: '💡', color: 'bg-purple-50 border-purple-200 text-purple-700' },
      { label: "Children's",        labelBn: 'শিশুদের বই',       emoji: '🧸', color: 'bg-pink-50 border-pink-200 text-pink-700' },
      { label: 'Comics & Graphic',  labelBn: 'কমিক্স',          emoji: '🖼️', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    ],
    authors: [
      { label: 'হুমায়ূন আহমেদ',          href: '/products?categorySlug=books' },
      { label: 'রবীন্দ্রনাথ ঠাকুর',        href: '/products?categorySlug=books' },
      { label: 'মানিক বন্দ্যোপাধ্যায়',     href: '/products?categorySlug=books' },
      { label: 'শরৎচন্দ্র চট্টোপাধ্যায়',  href: '/products?categorySlug=books' },
      { label: 'সমরেশ মজুমদার',            href: '/products?categorySlug=books' },
      { label: 'James Clear',              href: '/products?categorySlug=books' },
      { label: 'আরিফ আজাদ',               href: '/products?categorySlug=books' },
    ],
    columns: [
      { heading: 'Bengali Literature', headingBn: 'বাংলা সাহিত্য', links: [
        { label: 'Novel / Fiction',    labelBn: 'উপন্যাস',           href: '/products?categorySlug=books' },
        { label: 'Short Stories',      labelBn: 'ছোটগল্প',           href: '/products?categorySlug=books' },
        { label: 'Poetry',             labelBn: 'কবিতা',             href: '/products?categorySlug=books' },
        { label: 'Drama & Essays',     labelBn: 'নাটক ও প্রবন্ধ',    href: '/products?categorySlug=books' },
        { label: 'Rhymes & Teen Lit',  labelBn: 'ছড়া ও কিশোর সাহিত্য', href: '/products?categorySlug=books' },
        { label: 'Translated Lit',     labelBn: 'অনুবাদ সাহিত্য',   href: '/products?categorySlug=books' },
      ]},
      { heading: 'Islamic & Religious', headingBn: 'ইসলামিক ও ধর্মীয়', links: [
        { label: 'Quran & Tafsir',   labelBn: 'কুরআন ও তাফসির',  href: '/products?categorySlug=books' },
        { label: 'Hadith',           labelBn: 'হাদিস',            href: '/products?categorySlug=books' },
        { label: 'Sirat & Biography',labelBn: 'সীরাত ও জীবনী',   href: '/products?categorySlug=books' },
        { label: 'Islamic Fiction',  labelBn: 'ইসলামি উপন্যাস',  href: '/products?categorySlug=books' },
        { label: 'Fiqh & Masail',    labelBn: 'ফিকহ ও মাসআলা',  href: '/products?categorySlug=books' },
      ]},
      { heading: 'Academic', headingBn: 'একাডেমিক', links: [
        { label: 'Primary School',    labelBn: 'প্রাথমিক শিক্ষা',  href: '/products?categorySlug=books' },
        { label: 'SSC Prep',          labelBn: 'এসএসসি প্রস্তুতি', href: '/products?categorySlug=books' },
        { label: 'HSC Prep',          labelBn: 'এইচএসসি প্রস্তুতি', href: '/products?categorySlug=books' },
        { label: 'University Entry',  labelBn: 'বিশ্ববিদ্যালয় ভর্তি', href: '/products?categorySlug=books' },
        { label: 'BCS Prep',          labelBn: 'বিসিএস প্রস্তুতি', href: '/products?categorySlug=books' },
        { label: 'Medical',           labelBn: 'মেডিকেল',          href: '/products?categorySlug=books' },
      ]},
      { heading: 'More Categories', headingBn: 'আরো বিভাগ', links: [
        { label: 'Self-Help',         labelBn: 'আত্মউন্নয়ন',        href: '/products?categorySlug=books' },
        { label: 'Science & Tech',    labelBn: 'বিজ্ঞান ও প্রযুক্তি', href: '/products?categorySlug=books' },
        { label: 'History',           labelBn: 'ইতিহাস ও ঐতিহ্য',   href: '/products?categorySlug=books' },
        { label: 'Biography',         labelBn: 'জীবনী',              href: '/products?categorySlug=books' },
        { label: 'Health',            labelBn: 'স্বাস্থ্য ও চিকিৎসা', href: '/products?categorySlug=books' },
        { label: 'Best Sellers 🔥',   labelBn: 'বেস্ট সেলার 🔥',     href: '/products?categorySlug=books' },
      ]},
    ],
  },
  // 1 — Baby Products
  {
    columns: [
      { heading: 'Diapering & Care', headingBn: 'ডায়াপার ও যত্ন', links: [
        { label: 'Diapers',    labelBn: 'ডায়াপার',    href: '/products?categorySlug=baby-products' },
        { label: 'Baby Wipes', labelBn: 'বেবি ওয়াইপস', href: '/products?categorySlug=baby-products' },
        { label: 'Baby Wash',  labelBn: 'বেবি ওয়াশ',  href: '/products?categorySlug=baby-products' },
        { label: 'Rash Cream', labelBn: 'র‍্যাশ ক্রিম', href: '/products?categorySlug=baby-products' },
      ]},
      { heading: 'Feeding & Nursing', headingBn: 'ফিডিং', links: [
        { label: 'Baby Bottles', labelBn: 'ফিডিং বোতল',   href: '/products?categorySlug=baby-products' },
        { label: 'Breast Pumps', labelBn: 'ব্রেস্ট পাম্প', href: '/products?categorySlug=baby-products' },
        { label: 'Baby Food',    labelBn: 'বেবি ফুড',      href: '/products?categorySlug=baby-products' },
        { label: 'High Chairs',  labelBn: 'হাই চেয়ার',     href: '/products?categorySlug=baby-products' },
      ]},
      { heading: 'Gear & Clothing', headingBn: 'গিয়ার ও পোশাক', links: [
        { label: 'Strollers',     labelBn: 'স্ট্রোলার',  href: '/products?categorySlug=baby-products' },
        { label: 'Car Seats',     labelBn: 'কার সিট',    href: '/products?categorySlug=baby-products' },
        { label: 'Toys',          labelBn: 'খেলনা',      href: '/products?categorySlug=baby-products' },
        { label: 'Baby Clothing', labelBn: 'শিশু পোশাক', href: '/products?categorySlug=baby-products' },
        { label: 'All Baby →',    labelBn: 'সব পণ্য →',  href: '/products?categorySlug=baby-products' },
      ]},
    ],
  },
  // 2 — Leather
  {
    columns: [
      { heading: 'Wallets & Bags', headingBn: 'পার্স ও ব্যাগ', links: [
        { label: 'Bifold Wallets', labelBn: 'বাইফোল্ড পার্স', href: '/products?categorySlug=leather-products' },
        { label: 'Card Holders',   labelBn: 'কার্ড হোল্ডার',  href: '/products?categorySlug=leather-products' },
        { label: 'Office Bags',    labelBn: 'অফিস ব্যাগ',     href: '/products?categorySlug=leather-products' },
        { label: 'Backpacks',      labelBn: 'ব্যাকপ্যাক',     href: '/products?categorySlug=leather-products' },
        { label: 'Ladies Bags',    labelBn: 'লেডিস ব্যাগ',    href: '/products?categorySlug=leather-products' },
      ]},
      { heading: 'Belts & Footwear', headingBn: 'বেল্ট ও জুতা', links: [
        { label: 'Formal Belts',  labelBn: 'ফর্মাল বেল্ট', href: '/products?categorySlug=leather-products' },
        { label: 'Formal Shoes',  labelBn: 'ফর্মাল জুতা',  href: '/products?categorySlug=leather-products' },
        { label: 'Ladies Heels',  labelBn: 'হিলস',          href: '/products?categorySlug=leather-products' },
        { label: 'Sandals',       labelBn: 'স্যান্ডেল',     href: '/products?categorySlug=leather-products' },
        { label: 'All Leather →', labelBn: 'সব চামড়া →',  href: '/products?categorySlug=leather-products' },
      ]},
    ],
  },
  // 3 — Organic Foods
  {
    columns: [
      { heading: 'Honey & Sweeteners', headingBn: 'মধু ও মিষ্টি', links: [
        { label: 'Wild Honey',    labelBn: 'বন মধু',       href: '/products?categorySlug=organic-foods' },
        { label: 'Mustard Honey', labelBn: 'সরিষার মধু',   href: '/products?categorySlug=organic-foods' },
        { label: 'Date Molasses', labelBn: 'খেজুরের গুড়', href: '/products?categorySlug=organic-foods' },
      ]},
      { heading: 'Nuts, Seeds & Spices', headingBn: 'বাদাম ও মশলা', links: [
        { label: 'Almonds',      labelBn: 'কাঠবাদাম', href: '/products?categorySlug=organic-foods' },
        { label: 'Black Seed',   labelBn: 'কালিজিরা', href: '/products?categorySlug=organic-foods' },
        { label: 'Turmeric',     labelBn: 'হলুদ',     href: '/products?categorySlug=organic-foods' },
        { label: 'Dried Fruits', labelBn: 'শুকনো ফল', href: '/products?categorySlug=organic-foods' },
      ]},
      { heading: 'Tea & Snacks', headingBn: 'চা ও স্ন্যাকস', links: [
        { label: 'Green Tea',    labelBn: 'গ্রিন টি',    href: '/products?categorySlug=organic-foods' },
        { label: 'Herbal Tea',   labelBn: 'হার্বাল টি',  href: '/products?categorySlug=organic-foods' },
        { label: 'Granola Bars', labelBn: 'গ্রানোলা বার', href: '/products?categorySlug=organic-foods' },
        { label: 'All Organic →',labelBn: 'সব অর্গানিক →', href: '/products?categorySlug=organic-foods' },
      ]},
    ],
  },
  // 4 — Islamic Lifestyle
  {
    columns: [
      { heading: 'Prayer & Worship', headingBn: 'নামাজ ও ইবাদত', links: [
        { label: 'Prayer Mats',       labelBn: 'জায়নামাজ',          href: '/islamic-lifestyle' },
        { label: 'Prayer Caps',       labelBn: 'টুপি',               href: '/islamic-lifestyle' },
        { label: 'Tasbih Beads',      labelBn: 'তাসবিহ',             href: '/islamic-lifestyle' },
        { label: 'Miswak',            labelBn: 'মিসওয়াক',            href: '/islamic-lifestyle' },
        { label: 'Quran Stands',      labelBn: 'কুরআন স্ট্যান্ড',    href: '/islamic-lifestyle' },
      ]},
      { heading: 'Islamic Clothing', headingBn: 'ইসলামিক পোশাক', links: [
        { label: 'Panjabi / Jubbah',  labelBn: 'পাঞ্জাবি / জুব্বা',  href: '/islamic-lifestyle' },
        { label: 'Hijab',             labelBn: 'হিজাব',               href: '/islamic-lifestyle' },
        { label: 'Abaya',             labelBn: 'আবায়া',               href: '/islamic-lifestyle' },
        { label: 'Islamic Kids Wear', labelBn: 'শিশু ইসলামিক পোশাক', href: '/islamic-lifestyle' },
      ]},
      { heading: 'Perfumes & Décor', headingBn: 'আতর ও ডেকোর', links: [
        { label: 'Attar / Oud',       labelBn: 'আতর / আউড',           href: '/islamic-lifestyle' },
        { label: 'Islamic Wall Art',  labelBn: 'ইসলামিক ওয়াল আর্ট',  href: '/islamic-lifestyle' },
        { label: 'Calligraphy',       labelBn: 'ক্যালিগ্রাফি',         href: '/islamic-lifestyle' },
        { label: 'All Islamic →',     labelBn: 'সব পণ্য দেখুন →',     href: '/islamic-lifestyle' },
      ]},
    ],
  },
  // 5 — Handicrafts
  {
    columns: [
      { heading: 'Wall Art & Decor', headingBn: 'দেওয়াল শিল্প', links: [
        { label: 'Canvas Prints', labelBn: 'ক্যানভাস',     href: '/products?categorySlug=handicrafts' },
        { label: 'Calligraphy',   labelBn: 'ক্যালিগ্রাফি', href: '/products?categorySlug=handicrafts' },
        { label: 'Paintings',     labelBn: 'চিত্রকর্ম',    href: '/products?categorySlug=handicrafts' },
        { label: 'Clay Items',    labelBn: 'মাটির জিনিস',  href: '/products?categorySlug=handicrafts' },
      ]},
      { heading: 'Traditional Crafts', headingBn: 'ঐতিহ্যবাহী', links: [
        { label: 'Nakshi Kantha', labelBn: 'নকশি কাঁথা',     href: '/products?categorySlug=handicrafts' },
        { label: 'Muslin',        labelBn: 'মসলিন',           href: '/products?categorySlug=handicrafts' },
        { label: 'Jamdani',       labelBn: 'জামদানি',         href: '/products?categorySlug=handicrafts' },
        { label: 'Jute Products', labelBn: 'পাটের পণ্য',     href: '/products?categorySlug=handicrafts' },
        { label: 'All Crafts →',  labelBn: 'সব হস্তশিল্প →', href: '/products?categorySlug=handicrafts' },
      ]},
    ],
  },
  // 6 — Electronics
  {
    columns: [
      { heading: 'Mobiles & Laptops', headingBn: 'মোবাইল ও ল্যাপটপ', links: [
        { label: 'Samsung',        labelBn: 'স্যামসাং',     href: '/products?categorySlug=electronics' },
        { label: 'iPhone',         labelBn: 'আইফোন',        href: '/products?categorySlug=electronics' },
        { label: 'Gaming Laptops', labelBn: 'গেমিং ল্যাপটপ', href: '/products?categorySlug=electronics' },
        { label: 'MacBook',        labelBn: 'ম্যাকবুক',     href: '/products?categorySlug=electronics' },
      ]},
      { heading: 'Accessories', headingBn: 'আনুষাঙ্গিক', links: [
        { label: 'Earbuds & TWS', labelBn: 'ইয়ারবাডস',    href: '/products?categorySlug=electronics' },
        { label: 'Smartwatches',  labelBn: 'স্মার্টওয়াচ',  href: '/products?categorySlug=electronics' },
        { label: 'Power Banks',   labelBn: 'পাওয়ার ব্যাংক', href: '/products?categorySlug=electronics' },
        { label: 'Chargers',      labelBn: 'চার্জার',       href: '/products?categorySlug=electronics' },
      ]},
      { heading: 'Gadgets & Home', headingBn: 'গ্যাজেট', links: [
        { label: 'Smart Cameras',    labelBn: 'ক্যামেরা',            href: '/products?categorySlug=electronics' },
        { label: 'Air Purifiers',    labelBn: 'এয়ার পিউরিফায়ার',    href: '/products?categorySlug=electronics' },
        { label: 'Rice Cookers',     labelBn: 'রাইস কুকার',          href: '/products?categorySlug=electronics' },
        { label: 'All Electronics →',labelBn: 'সব ইলেকট্রনিক্স →',  href: '/products?categorySlug=electronics' },
      ]},
    ],
  },
  // 7 — Daily Needs
  {
    columns: [
      { heading: 'Grocery', headingBn: 'মুদি পণ্য', links: [
        { label: 'Rice & Flour', labelBn: 'চাল ও আটা',  href: '/products?categorySlug=daily-needs' },
        { label: 'Cooking Oil',  labelBn: 'রান্নার তেল', href: '/products?categorySlug=daily-needs' },
        { label: 'Pulses',       labelBn: 'ডাল',         href: '/products?categorySlug=daily-needs' },
      ]},
      { heading: 'Personal Care & Household', headingBn: 'ব্যক্তিগত যত্ন', links: [
        { label: 'Skin Care',     labelBn: 'স্কিন কেয়ার', href: '/products?categorySlug=daily-needs' },
        { label: 'Hair Care',     labelBn: 'হেয়ার কেয়ার', href: '/products?categorySlug=daily-needs' },
        { label: 'Kitchen Tools', labelBn: 'কিচেন টুলস',  href: '/products?categorySlug=daily-needs' },
        { label: 'Cleaning',      labelBn: 'ক্লিনিং',     href: '/products?categorySlug=daily-needs' },
      ]},
      { heading: 'Stationery & Pet', headingBn: 'স্টেশনারি', links: [
        { label: 'Notebooks',    labelBn: 'নোটবুক',             href: '/products?categorySlug=daily-needs' },
        { label: 'Pens',         labelBn: 'কলম',                href: '/products?categorySlug=daily-needs' },
        { label: 'Pet Food',     labelBn: 'পোষা প্রাণীর খাবার', href: '/products?categorySlug=daily-needs' },
        { label: 'All Daily →',  labelBn: 'সব পণ্য →',          href: '/products?categorySlug=daily-needs' },
      ]},
    ],
  },
] as const;

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { cart, toggleCart } = useCartStore();
  const guestCart = useGuestCart();
  const { logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubnav, setActiveSubnav] = useState<string | null>(null);
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaHoverCat, setMegaHoverCat] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
    };
    if (megaOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [megaOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    if (accountOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [accountOpen]);

  const itemCount = isAuthenticated
    ? (cart?.itemCount ?? 0)
    : guestCart.items.reduce((sum, i) => sum + i.quantity, 0);

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
              {/* ── Preorder orbiting comet button — LEFT side ── */}
              <Link href="/products?preorder=1" className="po-hdr-outer -my-1.5 normal-case">
                {/* Circular badge — comet orbits this */}
                <span className="po-hdr-badge">
                  <CalendarClock className="po-hdr-cal w-3.5 h-3.5 text-emerald-400" />
                  {/* Spin arm AFTER icon so comet renders on top */}
                  <span className="po-hdr-spin-arm">
                    <span className="po-hdr-comet" />
                  </span>
                </span>
                {/* Text pill */}
                <span className="po-hdr-pill">
                  <span className="text-white font-black text-[10px] tracking-wide whitespace-nowrap">Pre-Order</span>
                  <span className="text-white/30 text-[10px]">/</span>
                  <span className="po-hdr-txt">প্রি-অর্ডার</span>
                </span>
              </Link>

              <div className="h-3 w-px bg-gray-600" />
              <Link href={isAuthenticated ? '/account/addresses' : '/login'} className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                <MapPin className="w-3 h-3 text-primary" />
                {t.header.deliverTo} <span className="font-bold text-white ml-0.5">{t.header.selectAddress}</span>
              </Link>
              <div className="h-3 w-px bg-gray-600" />
              <a href="tel:+8801911369686" className="flex items-center gap-1 hover:text-white transition-colors">
                <Phone className="w-3 h-3 text-primary" />
                <span>+880 1911-369686</span>
              </a>
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
              <Link href="/support" className="hover:text-primary transition-colors flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> {t.header.support}
              </Link>
              <Link href="/track-order" className="hover:text-primary transition-colors">{t.header.trackOrder}</Link>
              <Link href="/publish" className="sell-border-wrapper ml-2 normal-case hover:scale-110 transition-transform duration-200 group">
                {/* Floating sparkles */}
                <span className="sell-spark sell-spark-1" />
                <span className="sell-spark sell-spark-2" />
                <span className="sell-spark sell-spark-3" />
                <span className="sell-spark sell-spark-4" />
                <div className="sell-cta-inner">
                  {/* Ping dot */}
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
                  </span>
                  <span className="text-white font-black text-[10px] tracking-wide whitespace-nowrap">Sell Your Book</span>
                  <span className="text-white/30 text-[10px]">/</span>
                  <span className="sell-bn-text whitespace-nowrap">বই বিক্রি করুন</span>
                  {/* Hover shine sweep */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-full" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Tier 2: Main bar ── */}
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 relative z-50 bg-white">
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
              <div
                ref={accountRef}
                className="relative flex items-center gap-2 cursor-pointer group transition-colors"
                onMouseEnter={() => setAccountOpen(true)}
                onMouseLeave={() => setAccountOpen(false)}
              >
                <div className={`p-2 transition-colors ${accountOpen ? 'text-secondary' : 'hover:text-secondary'}`}>
                  <User className="w-[26px] h-[26px]" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[10px] text-gray-500 font-bold uppercase leading-tight">
                    {isAuthenticated
                      ? `${lang === 'bn' ? 'হ্যালো,' : 'Hello,'} ${
                          user?.firstName
                            || user?.name
                            || (user?.role === 'ADMIN'
                                ? (lang === 'bn' ? 'অ্যাডমিন' : 'Admin')
                                : user?.role === 'SELLER'
                                ? (lang === 'bn' ? 'সেলার' : 'Seller')
                                : (lang === 'bn' ? 'গ্রাহক' : 'Customer'))
                        }`
                      : t.header.helloSignIn}
                  </p>
                  <span className={`text-sm font-bold leading-tight flex items-center transition-colors ${accountOpen ? 'text-secondary' : 'text-gray-800'}`}>
                    {isAuthenticated ? t.header.accountOrders : t.header.accountsLists}
                    <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${accountOpen ? 'rotate-180 text-secondary' : ''}`} />
                  </span>
                </div>

                {/* Account Dropdown */}
                {accountOpen && (
                  <div className="absolute top-full right-0 z-[60] bg-white shadow-2xl rounded-xl border border-gray-100 overflow-hidden" style={{ width: '240px', marginTop: '0px' }}>
                    {/* Top accent */}
                    <div className="h-0.5 w-full bg-gradient-to-r from-primary to-secondary" />

                    {/* Guest: Sign in / Register */}
                    {!isAuthenticated && (
                      <div className="px-4 pt-4 pb-3">
                        <Link
                          href="/login"
                          onClick={() => setAccountOpen(false)}
                          className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 rounded-full text-sm transition-colors"
                        >
                          {lang === 'bn' ? 'সাইন ইন' : 'Sign in'}
                        </Link>
                        <div className="text-center mt-2">
                          <span className="text-xs text-gray-500">{lang === 'bn' ? 'নতুন? ' : 'New? '}</span>
                          <Link
                            href="/register"
                            onClick={() => setAccountOpen(false)}
                            className="text-xs text-primary font-bold hover:underline"
                          >
                            {lang === 'bn' ? 'রেজিস্টার করুন' : 'Register'}
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Authenticated: greeting */}
                    {isAuthenticated && (
                      <div className="px-4 pt-3 pb-2 flex items-center gap-3 bg-gray-50">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">
                            {user?.firstName || user?.name ||
                              (user?.role === 'ADMIN' ? (lang === 'bn' ? 'অ্যাডমিন' : 'Admin')
                              : user?.role === 'SELLER' ? (lang === 'bn' ? 'সেলার' : 'Seller')
                              : (lang === 'bn' ? 'গ্রাহক' : 'Customer'))}
                          </p>
                          <Link href="/account" onClick={() => setAccountOpen(false)} className="text-[11px] text-primary hover:underline font-medium">
                            {lang === 'bn' ? 'প্রোফাইল দেখুন' : 'View profile'}
                          </Link>
                        </div>
                      </div>
                    )}

                    <div className="h-px bg-gray-100 mx-3 my-1" />

                    {/* Primary menu items */}
                    <div className="py-1">
                      {[
                        { icon: Package,       label: 'My Orders',       labelBn: 'আমার অর্ডার',     href: '/account/orders' },
                        { icon: CalendarClock, label: 'My Pre-orders',   labelBn: 'প্রি-অর্ডার',      href: '/account/preorders' },
                        { icon: Heart,         label: 'My Wishlist',      labelBn: 'উইশলিস্ট',        href: '/account/wishlist' },
                        { icon: Truck,         label: 'Track Order',      labelBn: 'অর্ডার ট্র্যাক',  href: '/track-order' },
                        { icon: CreditCard,    label: 'Payment',          labelBn: 'পেমেন্ট',          href: '/account/orders' },
                        { icon: Gift,          label: 'My Coupons',       labelBn: 'কুপন',             href: '/account' },
                        { icon: Store,         label: 'Seller Panel',     labelBn: 'সেলার প্যানেল',    href: '/seller/dashboard' },
                      ].map(item => (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                        >
                          <item.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {lang === 'bn' ? item.labelBn : item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="h-px bg-gray-100 mx-3 my-1" />

                    {/* Secondary links */}
                    <div className="py-1 pb-2">
                      {[
                        { label: 'Settings',              labelBn: 'সেটিংস',             href: '/account', authOnly: true },
                        { label: 'Seller Login',          labelBn: 'সেলার লগইন',          href: '/seller/login' },
                        { label: 'Become a Seller',      labelBn: 'সেলার হিসেবে যোগ দিন', href: '/seller/apply' },
                        { label: 'Return & Refund Policy',labelBn: 'রিটার্ন ও রিফান্ড',   href: '/refund-policy' },
                        { label: 'Help Center',           labelBn: 'সাহায্য কেন্দ্র',     href: '/help' },
                        { label: 'Contact Us',            labelBn: 'যোগাযোগ করুন',        href: '/support' },
                      ].filter(item => {
                        if ('authOnly' in item && item.authOnly && !isAuthenticated) return false;
                        if ('adminOnly' in item && item.adminOnly && user?.role === 'CUSTOMER') return false;
                        return true;
                      }).map(item => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setAccountOpen(false)}
                          className="block px-4 py-2 text-xs text-gray-500 hover:text-primary hover:bg-gray-50 transition-colors"
                        >
                          {lang === 'bn' ? item.labelBn : item.label}
                        </Link>
                      ))}
                      {isAuthenticated && (
                        <button
                          onClick={() => { void logout.mutate(); setAccountOpen(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          {lang === 'bn' ? 'সাইন আউট' : 'Sign out'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
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
        <div className="bg-white hidden lg:block border-b border-gray-200 relative z-30" ref={megaRef}>
          <div className="max-w-7xl mx-auto pl-4 flex items-center relative">

            {/* All Departments button */}
            <div className="relative h-[48px] flex items-center mr-6 shrink-0">
              <button
                onClick={() => setMegaOpen(o => !o)}
                className={cn(
                  'h-full flex items-center gap-2 px-5 font-bold text-sm cursor-pointer transition-colors',
                  megaOpen ? 'bg-primary text-white' : 'bg-gray-900 text-white hover:bg-gray-800',
                )}
              >
                <Menu className="w-[18px] h-[18px]" /> {t.header.allDepartments}
                <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', megaOpen && 'rotate-180')} />
              </button>

              {/* ── Mega Menu Dropdown ── */}
              {megaOpen && (
                <div className="absolute top-full left-0 z-50 shadow-2xl rounded-b-2xl overflow-hidden border border-gray-100 flex flex-col bg-white" style={{ width: '960px' }}>
                  {/* Top accent */}
                  <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary flex-shrink-0" />

                  <div className="flex" style={{ minHeight: '380px' }}>
                    {/* ── Left sidebar ── */}
                    <div className="w-48 bg-gray-50 border-r border-gray-100 py-1.5 flex-shrink-0 overflow-y-auto">
                      {MEGA_CATEGORIES.map((cat, i) => (
                        <div
                          key={cat.href}
                          onMouseEnter={() => setMegaHoverCat(i)}
                          className={cn(
                            'relative flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors text-[13px]',
                            megaHoverCat === i
                              ? 'bg-white text-primary font-bold border-r-2 border-primary'
                              : 'text-gray-700 font-medium hover:bg-white hover:text-primary',
                          )}
                        >
                          <span className="text-base leading-none flex-shrink-0">{cat.emoji}</span>
                          <span className="leading-tight">{lang === 'bn' ? cat.nameBn : cat.name}</span>
                          <ChevronDown className="w-3 h-3 ml-auto -rotate-90 opacity-40 flex-shrink-0" />
                        </div>
                      ))}
                    </div>

                    {/* ── Right content panel ── */}
                    <div className="flex-1 p-5 overflow-y-auto">

                      {/* ── BOOKS (special — Rokomari + Amazon style) ── */}
                      {megaHoverCat === 0 && (() => {
                        const content = MEGA_CONTENT[0];
                        return (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-[15px] font-black text-gray-900 flex items-center gap-2">
                                📚 {lang === 'bn' ? 'বই' : 'Books'}
                                <span className="text-[10px] font-bold bg-secondary/15 text-secondary px-2 py-0.5 rounded-full uppercase tracking-wide">Featured</span>
                              </h3>
                              <Link href="/products?categorySlug=books" onClick={() => setMegaOpen(false)} className="text-xs text-primary hover:underline font-semibold">
                                {lang === 'bn' ? 'সব বই দেখুন →' : 'Browse all books →'}
                              </Link>
                            </div>

                            {/* Genre tiles */}
                            <div className="mb-4">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                {lang === 'bn' ? 'জনপ্রিয় বিভাগ' : 'Browse by Genre'}
                              </p>
                              <div className="grid grid-cols-6 gap-2">
                                {content.recommended.map(rec => (
                                  <Link
                                    key={rec.label}
                                    href="/products?categorySlug=books"
                                    onClick={() => setMegaOpen(false)}
                                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border ${rec.color} hover:shadow-md transition-all text-center group`}
                                  >
                                    <span className="text-2xl leading-none group-hover:scale-110 transition-transform">{rec.emoji}</span>
                                    <span className="text-[10px] font-bold leading-tight">{lang === 'bn' ? rec.labelBn : rec.label}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>

                            {/* Popular Authors (Rokomari style) */}
                            <div className="mb-4">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                {lang === 'bn' ? 'জনপ্রিয় লেখক' : 'Popular Authors'}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {content.authors.map(a => (
                                  <Link
                                    key={a.label}
                                    href={a.href}
                                    onClick={() => setMegaOpen(false)}
                                    className="text-[11px] font-medium text-gray-700 bg-gray-100 hover:bg-primary hover:text-white px-3 py-1.5 rounded-full transition-colors border border-gray-200 hover:border-primary"
                                  >
                                    {a.label}
                                  </Link>
                                ))}
                                <Link href="/products?categorySlug=books" onClick={() => setMegaOpen(false)} className="text-[11px] font-bold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors border border-primary/20">
                                  {lang === 'bn' ? 'সব লেখক →' : 'All Authors →'}
                                </Link>
                              </div>
                            </div>

                            {/* Sub columns — 4-col Rokomari style */}
                            <div className="border-t border-gray-100 pt-3 grid grid-cols-4 gap-x-4">
                              {content.columns.map(col => (
                                <div key={col.heading}>
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 pb-1 border-b border-gray-100">
                                    {lang === 'bn' ? col.headingBn : col.heading}
                                  </p>
                                  <ul className="space-y-0.5">
                                    {col.links.map(link => (
                                      <li key={link.label}>
                                        <Link href={link.href} onClick={() => setMegaOpen(false)}
                                          className="text-[11px] text-gray-600 hover:text-primary transition-colors block py-1">
                                          {lang === 'bn' ? link.labelBn : link.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>

                            {/* Sell Your Book CTA */}
                            <div className="mt-3 bg-gradient-to-r from-primary/10 to-green-50 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📝</span>
                                <div>
                                  <p className="text-[11px] font-black text-primary">
                                    {lang === 'bn' ? 'আপনার বই বিক্রি করুন' : 'Sell Your Book on UNKORA'}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    {lang === 'bn' ? '১০% রয়্যালটি উপার্জন করুন' : 'Earn 10% royalty on every sale'}
                                  </p>
                                </div>
                              </div>
                              <Link
                                href="/publish"
                                onClick={() => setMegaOpen(false)}
                                className="text-[11px] font-bold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
                              >
                                {lang === 'bn' ? 'শুরু করুন →' : 'Get Started →'}
                              </Link>
                            </div>
                          </>
                        );
                      })()}

                      {/* ── Other categories ── */}
                      {megaHoverCat !== 0 && (() => {
                        const cat = MEGA_CATEGORIES[megaHoverCat]!;
                        const raw = MEGA_CONTENT[megaHoverCat as 1 | 2 | 3 | 4 | 5 | 6 | 7];
                        const content = raw as unknown as { columns: { heading: string; headingBn: string; links: { label: string; labelBn: string; href: string }[] }[] };
                        if (!content?.columns) return null;
                        return (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-[15px] font-black text-gray-900 flex items-center gap-2">
                                {cat.emoji} {lang === 'bn' ? cat.nameBn : cat.name}
                              </h3>
                              <Link href={cat.href} onClick={() => setMegaOpen(false)} className="text-xs text-primary hover:underline font-semibold">
                                {lang === 'bn' ? 'সব দেখুন →' : 'Browse all →'}
                              </Link>
                            </div>
                            <div className={`grid gap-x-8 ${content.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              {content.columns.map(col => (
                                <div key={col.heading}>
                                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 pb-1 border-b border-gray-100">
                                    {lang === 'bn' ? col.headingBn : col.heading}
                                  </p>
                                  <ul className="space-y-0.5">
                                    {col.links.map(link => (
                                      <li key={link.label}>
                                        <Link href={link.href} onClick={() => setMegaOpen(false)}
                                          className="text-[13px] text-gray-600 hover:text-primary transition-colors block py-1.5">
                                          {lang === 'bn' ? link.labelBn : link.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}

                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 border-t border-gray-100 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
                    <p className="text-[11px] text-gray-400">
                      {lang === 'bn' ? '৮টি বিভাগে হাজারো পণ্য' : '1000s of products across 8 departments'}
                    </p>
                    <Link href="/products" onClick={() => setMegaOpen(false)}
                      className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-full transition-colors hover:bg-primary/10">
                      {lang === 'bn' ? 'সব পণ্য দেখুন →' : 'Browse all products →'}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <nav className="flex items-center justify-start h-[48px] text-[12px] font-bold text-gray-700 flex-1 overflow-x-auto hide-scrollbar">
              {NAV_CATEGORIES.map((cat, idx) => (
                <Link
                  key={cat.slug}
                  href={cat.slug === 'islamic-lifestyle' ? '/islamic-lifestyle' : `/products?categorySlug=${cat.slug}`}
                  onMouseEnter={() => setActiveCategoryIndex(idx)}
                  className={cn(
                    'px-2 h-full flex items-center justify-center gap-1 transition-colors whitespace-nowrap relative',
                    activeCategoryIndex === idx ? 'text-primary' : 'hover:text-primary',
                  )}
                >
                  <cat.icon className={cn('w-3.5 h-3.5 hidden', activeCategoryIndex === idx ? 'text-primary' : 'opacity-70')} />
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
        <div className="hidden">
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
            <p className="font-bold text-lg">
              {isAuthenticated
                ? (user?.firstName || user?.name ||
                    (user?.role === 'ADMIN' ? (lang === 'bn' ? 'অ্যাডমিন' : 'Admin')
                    : user?.role === 'SELLER' ? (lang === 'bn' ? 'সেলার' : 'Seller')
                    : (lang === 'bn' ? 'গ্রাহক' : 'Customer')))
                : t.header.helloSignIn}
            </p>
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
              href={`/products?categorySlug=${cat.slug}`}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'py-3.5 px-5 hover:bg-orange-50 font-semibold text-gray-700 flex items-center gap-3 border-b border-gray-100 transition-colors',
                pathname === '/products' && searchParams.get('categorySlug') === cat.slug ? 'text-primary bg-accent' : '',
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
          <Link href="/account/preorders" onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2">
            <CalendarClock className="w-4 h-4" /> {lang === 'bn' ? 'প্রি-অর্ডার' : 'My Pre-orders'}
          </Link>
          <Link href="/seller/dashboard" onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-primary hover:text-primary/80 flex items-center gap-2 font-semibold">
            <Store className="w-4 h-4" /> {lang === 'bn' ? 'সেলার প্যানেল' : 'Seller Panel'}
          </Link>
          <Link href={isAuthenticated ? '/account/addresses' : '/login'} onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2">
            <MapPin className="w-4 h-4" /> {t.header.deliverTo}
          </Link>
          <Link href="/support" onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2">
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
