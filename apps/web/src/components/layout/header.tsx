'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Book, Baby, Briefcase, Leaf, Palette, Zap, ShoppingBag, Moon, Sprout,
  Menu, X, Search, User, ShoppingCart, ChevronDown,
  MapPin, Phone, HelpCircle,
  Package, Heart, CreditCard, Settings, LogOut, Gift, Truck, CalendarClock, Store,
  Dumbbell, Shirt, Home, Car, Wheat, Gamepad2, Luggage,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { categoriesApi } from '@/lib/api/products';
import { useCartStore } from '@/store/cart.store';
import { useGuestCart } from '@/store/guest-cart.store';
import { useGuestWishlist } from '@/store/guest-wishlist.store';
import { wishlistApi } from '@/lib/api/wishlist';
import { useAuth } from '@/lib/hooks/use-auth';
import { useLanguage } from '@/lib/i18n/language-context';
import api from '@/lib/api';
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
  { nameKey: 'electronics',        displayName: 'Electronics',         icon: Zap,       slug: 'electronics',        subnav: ['Mobiles', 'Laptops', 'Accessories', 'Home Appliances', 'Gadgets'] },
  { nameKey: 'dailyNeeds',         displayName: 'Daily Needs',         icon: ShoppingBag, slug: 'daily-needs',      subnav: ['Grocery', 'Personal Care', 'Household', 'Stationery', 'Pet Care'] },
  { nameKey: 'healthSports',       displayName: 'Health & Sports',     icon: Dumbbell,  slug: 'health-sports',      subnav: ['Fitness Equipment', 'Sports', 'Supplements', 'Sportswear', 'Health Monitors', 'Yoga & Wellness'] },
  { nameKey: 'fashionLifestyle',   displayName: 'Fashion & Lifestyle', icon: Shirt,     slug: 'fashion-lifestyle',  subnav: ["Men's Fashion", "Women's Fashion", 'Footwear', 'Accessories', 'Beauty & Grooming', 'Kids Fashion'] },
  { nameKey: 'homeFurniture',  displayName: 'Home & Furniture', icon: Home,     slug: 'home-furniture', subnav: ['Furniture', 'Home Decor', 'Bedding & Curtains', 'Kitchen & Dining', 'Lighting', 'Cleaning & Tools'] },
  { nameKey: 'automotive',     displayName: 'Automotive',       icon: Car,      slug: 'automotive',     subnav: ['Car Accessories', 'Bike & Motorcycle', 'Helmets', 'Tools & Equipment', 'Car Care', 'Navigation & Electronics'] },
  { nameKey: 'agriculture',    displayName: 'Agriculture',      icon: Wheat,    slug: 'agriculture',    subnav: ['Seeds & Plants', 'Fertilizers', 'Farming Tools', 'Irrigation', 'Organic Farming', 'Livestock'] },
  { nameKey: 'toysGaming',     displayName: 'Toys & Gaming',    icon: Gamepad2, slug: 'toys-gaming',    subnav: ['Action Figures', 'Board Games', 'Video Games', 'Consoles & Accessories', 'Outdoor Toys', 'Educational Toys'] },
  { nameKey: 'travelBags',     displayName: 'Travel & Bags',    icon: Luggage,  slug: 'travel-bags',    subnav: ['Luggage & Trolleys', 'Travel Accessories', 'Backpacks', 'Laptop Bags', 'Ladies Bags', 'Travel Pillows'] },
  { nameKey: 'ecoFriendly',   displayName: 'Eco Friendly',     icon: Sprout,   slug: 'eco-friendly',   subnav: ['Organic Foods', 'Natural Skincare', 'Bamboo Products', 'Eco Stationery', 'Herbal Products', 'Sustainable Fashion'] },
];

const SLUG_TO_NAV: Record<string, Partial<NavCategory>> = {
  'books':            { nameKey: 'books',            icon: Book,        subnav: ['Authors', 'Subjects', 'Publishers', 'Academic Books', 'E-Books', 'Islamic Books'] },
  'baby-products':    { nameKey: 'babyProducts',     icon: Baby,        subnav: ['Diapering & Care', 'Feeding & Nursing', 'Baby Gear', 'Toys & Games', 'Baby Clothing'] },
  'leather-products': { nameKey: 'leatherProducts',  icon: Briefcase,   subnav: ['Wallets & Cards', 'Bags & Backpacks', 'Belts & Accessories'] },
  'organic-foods':    { nameKey: 'organicFoods',     icon: Leaf,        subnav: ['Nuts & Seeds', 'Honey & Sweeteners', 'Spices & Herbs', 'Healthy Snacks'] },
  'islamic-lifestyle':{ nameKey: 'islamicLifestyle', icon: Moon,        subnav: ['Prayer Essentials', 'Islamic Books (Lifestyle)', 'Quran Accessories', 'Islamic Clothing'] },
  'handicrafts':      { nameKey: 'handicrafts',      icon: Palette,     subnav: ['Wall Art', 'Showpieces', 'Lamps & Lighting', 'Rugs & Carpets'] },
  'electronics':        { nameKey: 'electronics',       icon: Zap,       subnav: ['Mobiles', 'Laptops', 'Accessories', 'Home Appliances'] },
  'daily-needs':        { nameKey: 'dailyNeeds',        icon: ShoppingBag, subnav: ['Grocery', 'Personal Care', 'Household', 'Stationery'] },
  'health-sports':      { nameKey: 'healthSports',      icon: Dumbbell,  subnav: ['Fitness Equipment', 'Sports', 'Supplements', 'Sportswear', 'Health Monitors', 'Yoga & Wellness'] },
  'fashion-lifestyle':  { nameKey: 'fashionLifestyle',  icon: Shirt,     subnav: ["Men's Fashion", "Women's Fashion", 'Footwear', 'Accessories', 'Beauty & Grooming', 'Kids Fashion'] },
  'home-furniture': { nameKey: 'homeFurniture',  icon: Home,     subnav: ['Furniture', 'Home Decor', 'Bedding & Curtains', 'Kitchen & Dining', 'Lighting', 'Cleaning & Tools'] },
  'automotive':     { nameKey: 'automotive',     icon: Car,      subnav: ['Car Accessories', 'Bike & Motorcycle', 'Helmets', 'Tools & Equipment', 'Car Care', 'Navigation & Electronics'] },
  'agriculture':    { nameKey: 'agriculture',    icon: Wheat,    subnav: ['Seeds & Plants', 'Fertilizers', 'Farming Tools', 'Irrigation', 'Organic Farming', 'Livestock'] },
  'toys-gaming':    { nameKey: 'toysGaming',     icon: Gamepad2, subnav: ['Action Figures', 'Board Games', 'Video Games', 'Consoles & Accessories', 'Outdoor Toys', 'Educational Toys'] },
  'travel-bags':    { nameKey: 'travelBags',     icon: Luggage,  subnav: ['Luggage & Trolleys', 'Travel Accessories', 'Backpacks', 'Laptop Bags', 'Ladies Bags', 'Travel Pillows'] },
  'eco-friendly':   { nameKey: 'ecoFriendly',   icon: Sprout,   subnav: ['Organic Foods', 'Natural Skincare', 'Bamboo Products', 'Eco Stationery', 'Herbal Products', 'Sustainable Fashion'] },
};

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
  'Fitness Equipment': [
    { label: 'Dumbbells & Barbells', labelBn: 'ডাম্বেল ও বারবেল',     href: '/products?categorySlug=health-sports&sub=dumbbells' },
    { label: 'Resistance Bands',     labelBn: 'রেজিস্ট্যান্স ব্যান্ড', href: '/products?categorySlug=health-sports&sub=bands' },
    { label: 'Yoga Mats',            labelBn: 'যোগব্যায়াম ম্যাট',      href: '/products?categorySlug=health-sports&sub=yoga-mats' },
    { label: 'Treadmills',           labelBn: 'ট্রেডমিল',               href: '/products?categorySlug=health-sports&sub=treadmill' },
    { label: 'Pull-up Bars',         labelBn: 'পুলআপ বার',              href: '/products?categorySlug=health-sports&sub=pull-up' },
    { label: 'All Equipment →',      labelBn: 'সব সরঞ্জাম →',          href: '/products?categorySlug=health-sports' },
  ],
  'Sports': [
    { label: 'Cricket',      labelBn: 'ক্রিকেট',      href: '/products?categorySlug=health-sports&sub=cricket' },
    { label: 'Football',     labelBn: 'ফুটবল',        href: '/products?categorySlug=health-sports&sub=football' },
    { label: 'Badminton',    labelBn: 'ব্যাডমিন্টন',  href: '/products?categorySlug=health-sports&sub=badminton' },
    { label: 'Table Tennis', labelBn: 'টেবিল টেনিস',  href: '/products?categorySlug=health-sports&sub=table-tennis' },
    { label: 'Swimming',     labelBn: 'সাঁতার',        href: '/products?categorySlug=health-sports&sub=swimming' },
    { label: 'All Sports →', labelBn: 'সব স্পোর্টস →', href: '/products?categorySlug=health-sports' },
  ],
  'Supplements': [
    { label: 'Protein Powder',  labelBn: 'প্রোটিন পাউডার', href: '/products?categorySlug=health-sports&sub=protein' },
    { label: 'Vitamins',        labelBn: 'ভিটামিন',         href: '/products?categorySlug=health-sports&sub=vitamins' },
    { label: 'Weight Gainers',  labelBn: 'ওজন বৃদ্ধির সাপ্লিমেন্ট', href: '/products?categorySlug=health-sports&sub=mass-gainer' },
    { label: 'Pre-Workout',     labelBn: 'প্রি-ওয়ার্কআউট',  href: '/products?categorySlug=health-sports&sub=pre-workout' },
    { label: 'All Supplements →', labelBn: 'সব সাপ্লিমেন্ট →', href: '/products?categorySlug=health-sports' },
  ],
  "Men's Fashion": [
    { label: 'Panjabi & Kurta', labelBn: 'পাঞ্জাবি ও কুর্তা', href: '/products?categorySlug=fashion-lifestyle&sub=panjabi' },
    { label: 'Formal Shirts',   labelBn: 'ফর্মাল শার্ট',        href: '/products?categorySlug=fashion-lifestyle&sub=shirts' },
    { label: 'T-Shirts & Polo', labelBn: 'টি-শার্ট ও পোলো',    href: '/products?categorySlug=fashion-lifestyle&sub=tshirts' },
    { label: 'Jeans & Pants',   labelBn: 'জিন্স ও প্যান্ট',    href: '/products?categorySlug=fashion-lifestyle&sub=jeans' },
    { label: 'Suits & Blazers', labelBn: 'স্যুট ও ব্লেজার',    href: '/products?categorySlug=fashion-lifestyle&sub=suits' },
    { label: 'All Men\'s →',    labelBn: 'সব পুরুষ পোশাক →',   href: '/products?categorySlug=fashion-lifestyle' },
  ],
  "Women's Fashion": [
    { label: 'Saree',          labelBn: 'শাড়ি',         href: '/products?categorySlug=fashion-lifestyle&sub=saree' },
    { label: 'Salwar Kameez',  labelBn: 'সালোয়ার কামিজ', href: '/products?categorySlug=fashion-lifestyle&sub=salwar' },
    { label: 'Kurti & Tops',   labelBn: 'কুর্তি ও টপস',  href: '/products?categorySlug=fashion-lifestyle&sub=kurti' },
    { label: 'Hijab & Abaya',  labelBn: 'হিজাব ও আবায়া', href: '/products?categorySlug=fashion-lifestyle&sub=hijab' },
    { label: 'Western Wear',   labelBn: 'ওয়েস্টার্ন পোশাক', href: '/products?categorySlug=fashion-lifestyle&sub=western' },
    { label: "All Women's →",  labelBn: 'সব নারী পোশাক →', href: '/products?categorySlug=fashion-lifestyle' },
  ],
  'Footwear': [
    { label: 'Men\'s Shoes',    labelBn: 'পুরুষের জুতা',   href: '/products?categorySlug=fashion-lifestyle&sub=mens-shoes' },
    { label: 'Women\'s Shoes',  labelBn: 'নারীর জুতা',     href: '/products?categorySlug=fashion-lifestyle&sub=womens-shoes' },
    { label: 'Sandals & Slippers', labelBn: 'স্যান্ডেল ও স্লিপার', href: '/products?categorySlug=fashion-lifestyle&sub=sandals' },
    { label: 'Sports Shoes',    labelBn: 'স্পোর্টস জুতা',  href: '/products?categorySlug=fashion-lifestyle&sub=sports-shoes' },
    { label: 'All Footwear →',  labelBn: 'সব জুতা →',      href: '/products?categorySlug=fashion-lifestyle' },
  ],
  'Beauty & Grooming': [
    { label: 'Skincare',        labelBn: 'স্কিন কেয়ার',  href: '/products?categorySlug=fashion-lifestyle&sub=skincare' },
    { label: 'Makeup',          labelBn: 'মেকআপ',         href: '/products?categorySlug=fashion-lifestyle&sub=makeup' },
    { label: 'Haircare',        labelBn: 'হেয়ার কেয়ার',  href: '/products?categorySlug=fashion-lifestyle&sub=haircare' },
    { label: 'Fragrances',      labelBn: 'পারফিউম',       href: '/products?categorySlug=fashion-lifestyle&sub=perfume' },
    { label: 'Men\'s Grooming', labelBn: 'পুরুষ গ্রুমিং', href: '/products?categorySlug=fashion-lifestyle&sub=mens-grooming' },
    { label: 'All Beauty →',    labelBn: 'সব বিউটি →',    href: '/products?categorySlug=fashion-lifestyle' },
  ],
  'Furniture': [
    { label: 'Sofa & Sectionals',    labelBn: 'সোফা',                 href: '/products?categorySlug=home-furniture&sub=sofa' },
    { label: 'Beds & Mattresses',    labelBn: 'বিছানা ও ম্যাট্রেস',   href: '/products?categorySlug=home-furniture&sub=beds' },
    { label: 'Dining Table & Chairs',labelBn: 'ডাইনিং টেবিল',          href: '/products?categorySlug=home-furniture&sub=dining' },
    { label: 'Wardrobes & Almirahs', labelBn: 'আলমারি',               href: '/products?categorySlug=home-furniture&sub=wardrobe' },
    { label: 'Office Furniture',     labelBn: 'অফিস ফার্নিচার',        href: '/products?categorySlug=home-furniture&sub=office' },
    { label: 'All Furniture →',      labelBn: 'সব আসবাবপত্র →',       href: '/products?categorySlug=home-furniture' },
  ],
  'Home Decor': [
    { label: 'Wall Art & Clocks',   labelBn: 'ওয়াল আর্ট ও ঘড়ি',    href: '/products?categorySlug=home-furniture&sub=wall-art' },
    { label: 'Vases & Showpieces',  labelBn: 'ভাস ও শোপিস',           href: '/products?categorySlug=home-furniture&sub=decor' },
    { label: 'Curtains & Blinds',   labelBn: 'পর্দা',                  href: '/products?categorySlug=home-furniture&sub=curtains' },
    { label: 'Rugs & Carpets',      labelBn: 'রাগ ও কার্পেট',         href: '/products?categorySlug=home-furniture&sub=rugs' },
  ],
  'Car Accessories': [
    { label: 'Car Covers',          labelBn: 'কার কভার',              href: '/products?categorySlug=automotive&sub=car-cover' },
    { label: 'Seat Covers',         labelBn: 'সিট কভার',              href: '/products?categorySlug=automotive&sub=seat-cover' },
    { label: 'Car Perfume',         labelBn: 'কার পারফিউম',           href: '/products?categorySlug=automotive&sub=perfume' },
    { label: 'Dash Cams',           labelBn: 'ড্যাশ ক্যাম',           href: '/products?categorySlug=automotive&sub=dashcam' },
    { label: 'All Car Accessories →',labelBn: 'সব গাড়ির সামগ্রী →',   href: '/products?categorySlug=automotive' },
  ],
  'Bike & Motorcycle': [
    { label: 'Bike Accessories',    labelBn: 'বাইক আনুষাঙ্গিক',       href: '/products?categorySlug=automotive&sub=bike-accessories' },
    { label: 'Spare Parts',         labelBn: 'স্পেয়ার পার্টস',        href: '/products?categorySlug=automotive&sub=spare-parts' },
    { label: 'Engine Oil',          labelBn: 'ইঞ্জিন অয়েল',           href: '/products?categorySlug=automotive&sub=engine-oil' },
    { label: 'All Motorcycle →',    labelBn: 'সব মোটরসাইকেল →',      href: '/products?categorySlug=automotive' },
  ],
  'Seeds & Plants': [
    { label: 'Vegetable Seeds',     labelBn: 'সবজির বীজ',             href: '/products?categorySlug=agriculture&sub=veg-seeds' },
    { label: 'Flower Plants',       labelBn: 'ফুলের গাছ',             href: '/products?categorySlug=agriculture&sub=flower-plants' },
    { label: 'Fruit Plants',        labelBn: 'ফলের গাছ',              href: '/products?categorySlug=agriculture&sub=fruit-plants' },
    { label: 'Herb Seeds',          labelBn: 'ভেষজ বীজ',             href: '/products?categorySlug=agriculture&sub=herb-seeds' },
  ],
  'Farming Tools': [
    { label: 'Hand Tools',          labelBn: 'হ্যান্ড টুলস',           href: '/products?categorySlug=agriculture&sub=hand-tools' },
    { label: 'Sprayers',            labelBn: 'স্প্রেয়ার',              href: '/products?categorySlug=agriculture&sub=sprayer' },
    { label: 'Irrigation Pipes',    labelBn: 'সেচ পাইপ',              href: '/products?categorySlug=agriculture&sub=irrigation' },
    { label: 'All Tools →',         labelBn: 'সব সরঞ্জাম →',          href: '/products?categorySlug=agriculture' },
  ],
  'Video Games': [
    { label: 'PlayStation Games',   labelBn: 'প্লেস্টেশন গেম',        href: '/products?categorySlug=toys-gaming&sub=ps-games' },
    { label: 'Xbox Games',          labelBn: 'এক্সবক্স গেম',          href: '/products?categorySlug=toys-gaming&sub=xbox-games' },
    { label: 'PC Games',            labelBn: 'পিসি গেম',              href: '/products?categorySlug=toys-gaming&sub=pc-games' },
    { label: 'Mobile Games (Gift)', labelBn: 'মোবাইল গেম',            href: '/products?categorySlug=toys-gaming&sub=mobile-games' },
  ],
  'Consoles & Accessories': [
    { label: 'PlayStation 5',       labelBn: 'প্লেস্টেশন ৫',          href: '/products?categorySlug=toys-gaming&sub=ps5' },
    { label: 'Xbox Series',         labelBn: 'এক্সবক্স সিরিজ',        href: '/products?categorySlug=toys-gaming&sub=xbox' },
    { label: 'Controllers',         labelBn: 'কন্ট্রোলার',             href: '/products?categorySlug=toys-gaming&sub=controllers' },
    { label: 'All Consoles →',      labelBn: 'সব কনসোল →',            href: '/products?categorySlug=toys-gaming' },
  ],
  'Luggage & Trolleys': [
    { label: 'Cabin Trolleys',      labelBn: 'ক্যাবিন ট্রলি',          href: '/products?categorySlug=travel-bags&sub=cabin' },
    { label: 'Check-in Luggage',    labelBn: 'চেক-ইন লাগেজ',          href: '/products?categorySlug=travel-bags&sub=checkin' },
    { label: 'Duffle Bags',         labelBn: 'ডাফেল ব্যাগ',            href: '/products?categorySlug=travel-bags&sub=duffle' },
    { label: 'All Luggage →',       labelBn: 'সব লাগেজ →',            href: '/products?categorySlug=travel-bags' },
  ],
  'Travel Accessories': [
    { label: 'Travel Pillows',      labelBn: 'ট্রাভেল বালিশ',          href: '/products?categorySlug=travel-bags&sub=pillow' },
    { label: 'Passport Holders',    labelBn: 'পাসপোর্ট হোল্ডার',       href: '/products?categorySlug=travel-bags&sub=passport' },
    { label: 'Travel Adapters',     labelBn: 'ট্রাভেল অ্যাডাপ্টার',    href: '/products?categorySlug=travel-bags&sub=adapter' },
    { label: 'Packing Cubes',       labelBn: 'প্যাকিং কিউব',           href: '/products?categorySlug=travel-bags&sub=packing' },
  ],
};

const BN_SUBNAV: Record<string, Record<string, string>> = {
  'baby-products':    { 'Diapering & Care': 'ডায়াপার ও যত্ন', 'Feeding & Nursing': 'ফিডিং', 'Baby Gear': 'বেবি গিয়ার', 'Toys & Games': 'খেলনা', 'Baby Clothing': 'শিশু পোশাক' },
  'leather-products': { 'Wallets & Cards': 'পার্স ও কার্ড', 'Bags & Backpacks': 'ব্যাগ', 'Belts & Accessories': 'বেল্ট', "Men's Footwear": 'পুরুষ জুতা', "Women's Footwear": 'নারী জুতা' },
  'organic-foods':    { 'Nuts & Seeds': 'বাদাম ও বীজ', 'Honey & Sweeteners': 'মধু', 'Spices & Herbs': 'মশলা', 'Healthy Snacks': 'স্বাস্থ্যকর স্ন্যাকস', 'Tea & Beverages': 'চা ও পানীয়' },
  'handicrafts':      { 'Wall Art': 'দেওয়াল শিল্প', 'Showpieces': 'শোপিস', 'Lamps & Lighting': 'প্রদীপ', 'Rugs & Carpets': 'কার্পেট', 'Traditional Crafts': 'ঐতিহ্যবাহী শিল্প' },
  'electronics':      { 'Mobiles': 'মোবাইল', 'Laptops': 'ল্যাপটপ', 'Accessories': 'আনুষাঙ্গিক', 'Home Appliances': 'হোম অ্যাপ্লায়েন্স', 'Gadgets': 'গ্যাজেট' },
  'daily-needs':        { 'Grocery': 'মুদি', 'Personal Care': 'ব্যক্তিগত যত্ন', 'Household': 'গৃহস্থালি', 'Stationery': 'স্টেশনারি', 'Pet Care': 'পোষা প্রাণীর যত্ন' },
  'islamic-lifestyle':   { 'Prayer Essentials': 'নামাজের সরঞ্জাম', 'Islamic Books (Lifestyle)': 'ইসলামিক বই', 'Quran Accessories': 'কুরআন সামগ্রী', 'Islamic Clothing': 'ইসলামিক পোশাক', 'Perfumes & Oud': 'আতর ও আউড', 'Tasbih & Decor': 'তাসবিহ ও ডেকোর' },
  'health-sports':       { 'Fitness Equipment': 'ফিটনেস সরঞ্জাম', 'Sports': 'স্পোর্টস', 'Supplements': 'সাপ্লিমেন্ট', 'Sportswear': 'স্পোর্টসওয়্যার', 'Health Monitors': 'স্বাস্থ্য মনিটর', 'Yoga & Wellness': 'যোগব্যায়াম ও ওয়েলনেস' },
  'fashion-lifestyle':   { "Men's Fashion": 'পুরুষ ফ্যাশন', "Women's Fashion": 'নারী ফ্যাশন', 'Footwear': 'জুতা', 'Accessories': 'আনুষাঙ্গিক', 'Beauty & Grooming': 'বিউটি ও গ্রুমিং', 'Kids Fashion': 'শিশু ফ্যাশন' },
  'home-furniture':  { 'Furniture': 'আসবাবপত্র', 'Home Decor': 'হোম ডেকোর', 'Bedding & Curtains': 'বেডিং ও পর্দা', 'Kitchen & Dining': 'কিচেন', 'Lighting': 'আলো', 'Cleaning & Tools': 'পরিষ্কার সরঞ্জাম' },
  'automotive':      { 'Car Accessories': 'গাড়ির সামগ্রী', 'Bike & Motorcycle': 'বাইক ও মোটরসাইকেল', 'Helmets': 'হেলমেট', 'Tools & Equipment': 'সরঞ্জাম', 'Car Care': 'গাড়ির যত্ন', 'Navigation & Electronics': 'নেভিগেশন' },
  'agriculture':     { 'Seeds & Plants': 'বীজ ও গাছপালা', 'Fertilizers': 'সার', 'Farming Tools': 'কৃষি সরঞ্জাম', 'Irrigation': 'সেচ', 'Organic Farming': 'জৈব চাষ', 'Livestock': 'গবাদি পশু' },
  'toys-gaming':     { 'Action Figures': 'অ্যাকশন ফিগার', 'Board Games': 'বোর্ড গেমস', 'Video Games': 'ভিডিও গেমস', 'Consoles & Accessories': 'কনসোল', 'Outdoor Toys': 'আউটডোর খেলনা', 'Educational Toys': 'শিক্ষামূলক খেলনা' },
  'travel-bags':     { 'Luggage & Trolleys': 'লাগেজ ও ট্রলি', 'Travel Accessories': 'ট্রাভেল সামগ্রী', 'Backpacks': 'ব্যাকপ্যাক', 'Laptop Bags': 'ল্যাপটপ ব্যাগ', 'Ladies Bags': 'লেডিস ব্যাগ', 'Travel Pillows': 'ট্রাভেল বালিশ' },
  'eco-friendly':    { 'Organic Foods': 'অর্গানিক খাবার', 'Natural Skincare': 'প্রাকৃতিক স্কিনকেয়ার', 'Bamboo Products': 'বাঁশের পণ্য', 'Eco Stationery': 'ইকো স্টেশনারি', 'Herbal Products': 'ভেষজ পণ্য', 'Sustainable Fashion': 'টেকসই পোশাক' },
};

const MEGA_CATEGORIES = [
  {
    emoji: '📚', name: 'Books', nameBn: 'বই',
    href: '/products?categorySlug=books',
    subs: [
      { label: 'Novel / Fiction',       labelBn: 'উপন্যাস',              href: '/products?categorySlug=books&genre=Novel' },
      { label: 'Islamic Books',         labelBn: 'ইসলামিক বই',           href: '/products?categorySlug=books&genre=Islamic' },
      { label: 'Academic / BCS',        labelBn: 'একাডেমিক / বিসিএস',    href: '/products?categorySlug=books&genre=Academic' },
      { label: 'Self-Help',             labelBn: 'আত্মউন্নয়ন',           href: '/products?categorySlug=books&genre=Self-Help' },
      { label: 'History & Liberation',  labelBn: 'ইতিহাস ও মুক্তিযুদ্ধ', href: '/products?categorySlug=books&genre=History' },
      { label: "Children's & Teen",     labelBn: 'শিশু-কিশোর',           href: '/products?categorySlug=books&genre=Children' },
      { label: 'Mystery & Thriller',    labelBn: 'রহস্য ও থ্রিলার',      href: '/products?categorySlug=books&genre=Thriller' },
      { label: 'Science & Technology',  labelBn: 'বিজ্ঞান ও প্রযুক্তি',  href: '/products?categorySlug=books&genre=Science' },
      { label: 'Health & Medicine',     labelBn: 'স্বাস্থ্য ও চিকিৎসা',  href: '/products?categorySlug=books&genre=Health' },
      { label: 'Comics & Manga',        labelBn: 'কমিকস ও ম্যাঙ্গা',     href: '/products?categorySlug=books&genre=Comics' },
      { label: 'English Books',         labelBn: 'ইংরেজি বই',            href: '/products?categorySlug=books&genre=English' },
      { label: 'All Books →',           labelBn: 'সব বই →',              href: '/products?categorySlug=books' },
    ],
  },
  {
    emoji: '👶', name: 'Baby Products', nameBn: 'শিশু পণ্য',
    href: '/products?categorySlug=baby-products',
    subs: [
      { label: 'Diapers & Care',   labelBn: 'ডায়াপার ও যত্ন',   href: '/products?categorySlug=baby-products&sub=diapers' },
      { label: 'Feeding & Nursing',labelBn: 'ফিডিং',              href: '/products?categorySlug=baby-products&sub=feeding' },
      { label: 'Gear & Strollers', labelBn: 'গিয়ার ও স্ট্রোলার', href: '/products?categorySlug=baby-products&sub=gear' },
      { label: 'Toys & Learning',  labelBn: 'খেলনা ও শিক্ষা',    href: '/products?categorySlug=baby-products&sub=toys' },
      { label: 'Baby Clothing',    labelBn: 'শিশু পোশাক',         href: '/products?categorySlug=baby-products&sub=clothing' },
      { label: 'All Baby →',       labelBn: 'সব শিশু পণ্য →',     href: '/products?categorySlug=baby-products' },
    ],
  },
  {
    emoji: '👜', name: 'Leather', nameBn: 'চামড়া পণ্য',
    href: '/products?categorySlug=leather-products',
    subs: [
      { label: 'Wallets & Cardholders', labelBn: 'পার্স ও কার্ড হোল্ডার', href: '/products?categorySlug=leather-products&sub=wallets' },
      { label: 'Bags & Backpacks',      labelBn: 'ব্যাগ ও ব্যাকপ্যাক',    href: '/products?categorySlug=leather-products&sub=bags' },
      { label: 'Belts & Accessories',   labelBn: 'বেল্ট ও আনুষাঙ্গিক',    href: '/products?categorySlug=leather-products&sub=belts' },
      { label: "Men's Footwear",        labelBn: 'পুরুষ জুতা',             href: '/products?categorySlug=leather-products&sub=mens-shoes' },
      { label: "Women's Footwear",      labelBn: 'মহিলা জুতা',             href: '/products?categorySlug=leather-products&sub=womens-shoes' },
      { label: 'All Leather →',         labelBn: 'সব চামড়া →',            href: '/products?categorySlug=leather-products' },
    ],
  },
  {
    emoji: '🌿', name: 'Organic', nameBn: 'অর্গানিক',
    href: '/products?categorySlug=organic-foods',
    subs: [
      { label: 'Honey & Sweeteners', labelBn: 'মধু ও গুড়',      href: '/products?categorySlug=organic-foods&sub=honey' },
      { label: 'Nuts & Seeds',       labelBn: 'বাদাম ও বীজ',     href: '/products?categorySlug=organic-foods&sub=nuts' },
      { label: 'Spices & Herbs',     labelBn: 'মশলা ও ভেষজ',     href: '/products?categorySlug=organic-foods&sub=spices' },
      { label: 'Tea & Beverages',    labelBn: 'চা ও পানীয়',      href: '/products?categorySlug=organic-foods&sub=tea' },
      { label: 'Dried Fruits',       labelBn: 'শুকনো ফল',        href: '/products?categorySlug=organic-foods&sub=dried-fruits' },
      { label: 'All Organic →',      labelBn: 'সব অর্গানিক →',   href: '/products?categorySlug=organic-foods' },
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
      { label: 'Wall Art & Paintings',  labelBn: 'দেওয়াল শিল্প',       href: '/products?categorySlug=handicrafts&sub=wall-art' },
      { label: 'Showpieces',            labelBn: 'শোপিস',               href: '/products?categorySlug=handicrafts&sub=showpieces' },
      { label: 'Nakshi Kantha',         labelBn: 'নকশি কাঁথা',          href: '/products?categorySlug=handicrafts&sub=nakshi-kantha' },
      { label: 'Jute & Clay Products',  labelBn: 'পাট ও মাটির পণ্য',   href: '/products?categorySlug=handicrafts&sub=jute-clay' },
      { label: 'Traditional Weaves',    labelBn: 'ঐতিহ্যবাহী বুনন',     href: '/products?categorySlug=handicrafts&sub=weaves' },
      { label: 'All Crafts →',          labelBn: 'সব হস্তশিল্প →',      href: '/products?categorySlug=handicrafts' },
    ],
  },
  {
    emoji: '⚡', name: 'Electronics', nameBn: 'ইলেকট্রনিক্স',
    href: '/products?categorySlug=electronics',
    subs: [
      { label: 'Mobiles & Tablets', labelBn: 'মোবাইল ও ট্যাবলেট',    href: '/products?categorySlug=electronics&sub=mobiles' },
      { label: 'Laptops & PCs',     labelBn: 'ল্যাপটপ ও কম্পিউটার',  href: '/products?categorySlug=electronics&sub=laptops' },
      { label: 'Audio & Earbuds',   labelBn: 'অডিও ও ইয়ারবাডস',      href: '/products?categorySlug=electronics&sub=audio' },
      { label: 'Smart Gadgets',     labelBn: 'স্মার্ট গ্যাজেট',        href: '/products?categorySlug=electronics&sub=gadgets' },
      { label: 'Home Appliances',   labelBn: 'হোম অ্যাপ্লায়েন্স',     href: '/products?categorySlug=electronics&sub=appliances' },
      { label: 'All Electronics →', labelBn: 'সব ইলেকট্রনিক্স →',     href: '/products?categorySlug=electronics' },
    ],
  },
  {
    emoji: '🛒', name: 'Daily Needs', nameBn: 'দৈনন্দিন',
    href: '/products?categorySlug=daily-needs',
    subs: [
      { label: 'Grocery & Staples',  labelBn: 'মুদি ও খাদ্যপণ্য',     href: '/products?categorySlug=daily-needs&sub=grocery' },
      { label: 'Personal Care',      labelBn: 'ব্যক্তিগত যত্ন',         href: '/products?categorySlug=daily-needs&sub=personal-care' },
      { label: 'Household Cleaning', labelBn: 'গৃহস্থালি ও ক্লিনিং',   href: '/products?categorySlug=daily-needs&sub=household' },
      { label: 'Stationery',         labelBn: 'স্টেশনারি',               href: '/products?categorySlug=daily-needs&sub=stationery' },
      { label: 'Pet Care',           labelBn: 'পোষা প্রাণীর যত্ন',       href: '/products?categorySlug=daily-needs&sub=pet-care' },
      { label: 'All Daily →',        labelBn: 'সব দৈনন্দিন →',           href: '/products?categorySlug=daily-needs' },
    ],
  },
  {
    emoji: '🏋️', name: 'Health & Sports', nameBn: 'স্বাস্থ্য ও স্পোর্টস',
    href: '/products?categorySlug=health-sports',
    subs: [
      { label: 'Fitness Equipment', labelBn: 'ফিটনেস সরঞ্জাম',  href: '/products?categorySlug=health-sports&sub=equipment' },
      { label: 'Cricket & Football', labelBn: 'ক্রিকেট ও ফুটবল', href: '/products?categorySlug=health-sports&sub=cricket' },
      { label: 'Supplements',       labelBn: 'সাপ্লিমেন্ট',       href: '/products?categorySlug=health-sports&sub=supplements' },
      { label: 'Sportswear',        labelBn: 'স্পোর্টসওয়্যার',    href: '/products?categorySlug=health-sports&sub=sportswear' },
      { label: 'Yoga & Wellness',   labelBn: 'যোগব্যায়াম',        href: '/products?categorySlug=health-sports&sub=yoga' },
      { label: 'Health Monitors',   labelBn: 'স্বাস্থ্য মনিটর',   href: '/products?categorySlug=health-sports&sub=monitors' },
      { label: 'All Health & Sports →', labelBn: 'সব পণ্য →',    href: '/products?categorySlug=health-sports' },
    ],
  },
  {
    emoji: '👗', name: 'Fashion & Lifestyle', nameBn: 'ফ্যাশন ও লাইফস্টাইল',
    href: '/products?categorySlug=fashion-lifestyle',
    subs: [
      { label: "Men's Fashion",    labelBn: 'পুরুষ ফ্যাশন',      href: '/products?categorySlug=fashion-lifestyle&sub=mens' },
      { label: "Women's Fashion",  labelBn: 'নারী ফ্যাশন',       href: '/products?categorySlug=fashion-lifestyle&sub=womens' },
      { label: 'Footwear',         labelBn: 'জুতা',              href: '/products?categorySlug=fashion-lifestyle&sub=footwear' },
      { label: 'Accessories',      labelBn: 'আনুষাঙ্গিক',        href: '/products?categorySlug=fashion-lifestyle&sub=accessories' },
      { label: 'Beauty & Grooming',labelBn: 'বিউটি ও গ্রুমিং',   href: '/products?categorySlug=fashion-lifestyle&sub=beauty' },
      { label: 'Kids Fashion',     labelBn: 'শিশু ফ্যাশন',       href: '/products?categorySlug=fashion-lifestyle&sub=kids' },
      { label: 'All Fashion →',    labelBn: 'সব ফ্যাশন →',      href: '/products?categorySlug=fashion-lifestyle' },
    ],
  },
  {
    emoji: '🏠', name: 'Home & Furniture', nameBn: 'হোম ও ফার্নিচার',
    href: '/products?categorySlug=home-furniture',
    subs: [
      { label: 'Sofas & Sectionals',    labelBn: 'সোফা',               href: '/products?categorySlug=home-furniture&sub=sofa' },
      { label: 'Beds & Mattresses',     labelBn: 'বিছানা',              href: '/products?categorySlug=home-furniture&sub=beds' },
      { label: 'Dining Sets',           labelBn: 'ডাইনিং সেট',          href: '/products?categorySlug=home-furniture&sub=dining' },
      { label: 'Wardrobes',             labelBn: 'আলমারি',              href: '/products?categorySlug=home-furniture&sub=wardrobe' },
      { label: 'Home Decor',            labelBn: 'হোম ডেকোর',           href: '/products?categorySlug=home-furniture&sub=decor' },
      { label: 'Lighting',              labelBn: 'আলো',                 href: '/products?categorySlug=home-furniture&sub=lighting' },
      { label: 'All Home & Furniture →',labelBn: 'সব পণ্য →',           href: '/products?categorySlug=home-furniture' },
    ],
  },
  {
    emoji: '🚗', name: 'Automotive', nameBn: 'অটোমোটিভ',
    href: '/products?categorySlug=automotive',
    subs: [
      { label: 'Car Accessories',       labelBn: 'গাড়ির সামগ্রী',       href: '/products?categorySlug=automotive&sub=car' },
      { label: 'Bike & Motorcycle',     labelBn: 'বাইক ও মোটরসাইকেল',  href: '/products?categorySlug=automotive&sub=bike' },
      { label: 'Helmets',               labelBn: 'হেলমেট',              href: '/products?categorySlug=automotive&sub=helmet' },
      { label: 'Tools & Equipment',     labelBn: 'সরঞ্জাম',             href: '/products?categorySlug=automotive&sub=tools' },
      { label: 'Car Care',              labelBn: 'গাড়ির যত্ন',          href: '/products?categorySlug=automotive&sub=care' },
      { label: 'All Automotive →',      labelBn: 'সব পণ্য →',           href: '/products?categorySlug=automotive' },
    ],
  },
  {
    emoji: '🌾', name: 'Agriculture', nameBn: 'কৃষি',
    href: '/products?categorySlug=agriculture',
    subs: [
      { label: 'Seeds & Plants',        labelBn: 'বীজ ও গাছপালা',       href: '/products?categorySlug=agriculture&sub=seeds' },
      { label: 'Fertilizers',           labelBn: 'সার',                 href: '/products?categorySlug=agriculture&sub=fertilizer' },
      { label: 'Farming Tools',         labelBn: 'কৃষি সরঞ্জাম',        href: '/products?categorySlug=agriculture&sub=tools' },
      { label: 'Irrigation',            labelBn: 'সেচ',                 href: '/products?categorySlug=agriculture&sub=irrigation' },
      { label: 'Organic Farming',       labelBn: 'জৈব চাষ',             href: '/products?categorySlug=agriculture&sub=organic' },
      { label: 'Livestock',             labelBn: 'গবাদি পশু',           href: '/products?categorySlug=agriculture&sub=livestock' },
      { label: 'All Agriculture →',     labelBn: 'সব পণ্য →',           href: '/products?categorySlug=agriculture' },
    ],
  },
  {
    emoji: '🎮', name: 'Toys & Gaming', nameBn: 'খেলনা ও গেমিং',
    href: '/products?categorySlug=toys-gaming',
    subs: [
      { label: 'Action Figures',        labelBn: 'অ্যাকশন ফিগার',       href: '/products?categorySlug=toys-gaming&sub=action' },
      { label: 'Board Games',           labelBn: 'বোর্ড গেমস',          href: '/products?categorySlug=toys-gaming&sub=board' },
      { label: 'Video Games',           labelBn: 'ভিডিও গেমস',          href: '/products?categorySlug=toys-gaming&sub=video' },
      { label: 'Consoles',              labelBn: 'কনসোল',               href: '/products?categorySlug=toys-gaming&sub=console' },
      { label: 'Outdoor Toys',          labelBn: 'আউটডোর খেলনা',        href: '/products?categorySlug=toys-gaming&sub=outdoor' },
      { label: 'Educational Toys',      labelBn: 'শিক্ষামূলক খেলনা',    href: '/products?categorySlug=toys-gaming&sub=educational' },
      { label: 'All Toys & Gaming →',   labelBn: 'সব পণ্য →',           href: '/products?categorySlug=toys-gaming' },
    ],
  },
  {
    emoji: '🧳', name: 'Travel & Bags', nameBn: 'ট্রাভেল ও ব্যাগ',
    href: '/products?categorySlug=travel-bags',
    subs: [
      { label: 'Luggage & Trolleys',    labelBn: 'লাগেজ ও ট্রলি',       href: '/products?categorySlug=travel-bags&sub=luggage' },
      { label: 'Travel Accessories',    labelBn: 'ট্রাভেল সামগ্রী',     href: '/products?categorySlug=travel-bags&sub=accessories' },
      { label: 'Backpacks',             labelBn: 'ব্যাকপ্যাক',           href: '/products?categorySlug=travel-bags&sub=backpack' },
      { label: 'Laptop Bags',           labelBn: 'ল্যাপটপ ব্যাগ',        href: '/products?categorySlug=travel-bags&sub=laptop-bag' },
      { label: 'Ladies Bags',           labelBn: 'লেডিস ব্যাগ',         href: '/products?categorySlug=travel-bags&sub=ladies-bag' },
      { label: 'All Travel & Bags →',   labelBn: 'সব পণ্য →',           href: '/products?categorySlug=travel-bags' },
    ],
  },
  {
    emoji: '🌱', name: 'Eco Friendly', nameBn: 'পরিবেশবান্ধব পণ্য',
    href: '/products?categorySlug=eco-friendly',
    subs: [
      { label: 'Organic Foods',         labelBn: 'অর্গানিক খাবার',          href: '/products?categorySlug=eco-friendly&sub=organic-foods' },
      { label: 'Natural Skincare',      labelBn: 'প্রাকৃতিক স্কিনকেয়ার',    href: '/products?categorySlug=eco-friendly&sub=natural-skincare' },
      { label: 'Recycled Products',     labelBn: 'পুনর্ব্যবহৃত পণ্য',       href: '/products?categorySlug=eco-friendly&sub=recycled' },
      { label: 'Bamboo Products',       labelBn: 'বাঁশের পণ্য',              href: '/products?categorySlug=eco-friendly&sub=bamboo' },
      { label: 'Eco Stationery',        labelBn: 'ইকো স্টেশনারি',            href: '/products?categorySlug=eco-friendly&sub=stationery' },
      { label: 'Herbal Products',       labelBn: 'ভেষজ পণ্য',               href: '/products?categorySlug=eco-friendly&sub=herbal' },
      { label: 'Sustainable Fashion',   labelBn: 'টেকসই পোশাক',             href: '/products?categorySlug=eco-friendly&sub=sustainable-fashion' },
      { label: 'Green Home',            labelBn: 'গ্রিন হোম',               href: '/products?categorySlug=eco-friendly&sub=green-home' },
      { label: 'Jute & Natural Fiber',  labelBn: 'পাট ও প্রাকৃতিক তন্তু',   href: '/products?categorySlug=eco-friendly&sub=jute' },
      { label: 'All Eco Friendly →',    labelBn: 'সব পরিবেশবান্ধব →',      href: '/products?categorySlug=eco-friendly' },
    ],
  },
];

// ── Rich right-panel content for each mega-menu category ──────────────────────
const MEGA_CONTENT = [
  // 0 — Books (comprehensive — Rokomari+ level)
  {
    recommended: [
      { label: 'Novel & Fiction',      labelBn: 'উপন্যাস',              emoji: '📖', color: 'bg-emerald-50 border-emerald-200 text-emerald-700',  href: '/products?categorySlug=books&genre=Novel' },
      { label: 'Islamic Books',        labelBn: 'ইসলামিক বই',           emoji: '🕌', color: 'bg-amber-50 border-amber-200 text-amber-700',         href: '/products?categorySlug=books&genre=Islamic' },
      { label: 'Academic / BCS',       labelBn: 'একাডেমিক / বিসিএস',    emoji: '🎓', color: 'bg-blue-50 border-blue-200 text-blue-700',            href: '/products?categorySlug=books&genre=Academic' },
      { label: 'Self-Help',            labelBn: 'আত্মউন্নয়ন',           emoji: '💡', color: 'bg-purple-50 border-purple-200 text-purple-700',       href: '/products?categorySlug=books&genre=Self-Help' },
      { label: "Children's & Teen",    labelBn: 'শিশু-কিশোর',           emoji: '🧸', color: 'bg-pink-50 border-pink-200 text-pink-700',            href: '/products?categorySlug=books&genre=Children' },
      { label: 'History & Liberation', labelBn: 'ইতিহাস ও মুক্তিযুদ্ধ', emoji: '📜', color: 'bg-red-50 border-red-200 text-red-700',               href: '/products?categorySlug=books&genre=History' },
      { label: 'Mystery & Thriller',   labelBn: 'রহস্য ও থ্রিলার',      emoji: '🔍', color: 'bg-slate-50 border-slate-200 text-slate-700',         href: '/products?categorySlug=books&genre=Thriller' },
      { label: 'Science & Tech',       labelBn: 'বিজ্ঞান ও প্রযুক্তি',  emoji: '🔬', color: 'bg-cyan-50 border-cyan-200 text-cyan-700',            href: '/products?categorySlug=books&genre=Science' },
      { label: 'Health & Medicine',    labelBn: 'স্বাস্থ্য ও চিকিৎসা',  emoji: '💊', color: 'bg-teal-50 border-teal-200 text-teal-700',            href: '/products?categorySlug=books&genre=Health' },
      { label: 'Comics & Manga',       labelBn: 'কমিক্স ও ম্যাঙ্গা',    emoji: '🎭', color: 'bg-orange-50 border-orange-200 text-orange-700',      href: '/products?categorySlug=books&genre=Comics' },
      { label: 'English Books',        labelBn: 'ইংরেজি বই',            emoji: '📕', color: 'bg-indigo-50 border-indigo-200 text-indigo-700',      href: '/products?categorySlug=books&genre=English' },
      { label: 'Best Sellers 🔥',      labelBn: 'বেস্ট সেলার 🔥',        emoji: '🔥', color: 'bg-rose-50 border-rose-200 text-rose-700',            href: '/products?categorySlug=books&sort=bestseller' },
    ],
    authors: [
      { label: 'হুমায়ূন আহমেদ',          href: '/products?categorySlug=books&author=humayun' },
      { label: 'আরিফ আজাদ',              href: '/products?categorySlug=books&author=arif-azad' },
      { label: 'রবীন্দ্রনাথ ঠাকুর',       href: '/products?categorySlug=books&author=rabindranath' },
      { label: 'শরৎচন্দ্র চট্টোপাধ্যায়', href: '/products?categorySlug=books&author=sharat' },
      { label: 'মুহম্মদ জাফর ইকবাল',      href: '/products?categorySlug=books&author=zafar-iqbal' },
      { label: 'সমরেশ মজুমদার',           href: '/products?categorySlug=books&author=samaresh' },
      { label: 'ইমদাদুল হক মিলন',         href: '/products?categorySlug=books&author=milon' },
      { label: 'আনিসুল হক',               href: '/products?categorySlug=books&author=anisul-haq' },
      { label: 'মানিক বন্দ্যোপাধ্যায়',    href: '/products?categorySlug=books&author=manik' },
      { label: 'James Clear',             href: '/products?categorySlug=books&author=james-clear' },
      { label: 'Robin Sharma',            href: '/products?categorySlug=books&author=robin-sharma' },
      { label: 'সব লেখক →',               href: '/products?categorySlug=books' },
    ],
    columns: [
      { heading: 'Bengali Literature', headingBn: 'বাংলা সাহিত্য', links: [
        { label: 'Novel / Fiction',        labelBn: 'উপন্যাস',               href: '/products?categorySlug=books&genre=Novel' },
        { label: 'Short Stories',          labelBn: 'ছোটগল্প',               href: '/products?categorySlug=books&genre=Short-Story' },
        { label: 'Poetry',                 labelBn: 'কবিতা',                  href: '/products?categorySlug=books&genre=Poetry' },
        { label: 'Drama & Essays',         labelBn: 'নাটক ও প্রবন্ধ',        href: '/products?categorySlug=books&genre=Drama' },
        { label: 'Travel & Adventure',     labelBn: 'ভ্রমণ ও অ্যাডভেঞ্চার',  href: '/products?categorySlug=books&genre=Travel' },
        { label: 'Mystery & Thriller',     labelBn: 'রহস্য ও থ্রিলার',        href: '/products?categorySlug=books&genre=Thriller' },
        { label: 'Romance',                labelBn: 'রোমান্টিক উপন্যাস',      href: '/products?categorySlug=books&genre=Romance' },
        { label: 'Science Fiction',        labelBn: 'বিজ্ঞান কল্পকাহিনী',    href: '/products?categorySlug=books&genre=Sci-Fi' },
        { label: 'Humor & Satire',         labelBn: 'রম্যরচনা ও হাসির বই',   href: '/products?categorySlug=books&genre=Humor' },
        { label: 'Autobiography & Memoir', labelBn: 'আত্মজীবনী ও স্মৃতিকথা', href: '/products?categorySlug=books&genre=Memoir' },
        { label: 'Translated Literature',  labelBn: 'অনুবাদ সাহিত্য',        href: '/products?categorySlug=books&genre=Translated' },
        { label: 'Rhymes & Folk',          labelBn: 'ছড়া ও লোকসাহিত্য',     href: '/products?categorySlug=books&genre=Rhymes' },
      ]},
      { heading: 'Islamic & Religious', headingBn: 'ইসলামিক ও ধর্মীয়', links: [
        { label: 'Holy Quran',             labelBn: 'কুরআন শরীফ',            href: '/products?categorySlug=books&genre=Quran' },
        { label: 'Tafsir',                 labelBn: 'তাফসীর',                  href: '/products?categorySlug=books&genre=Tafsir' },
        { label: 'Hadith',                 labelBn: 'হাদীস শরীফ',             href: '/products?categorySlug=books&genre=Hadith' },
        { label: 'Fiqh & Masail',          labelBn: 'ফিকহ ও মাসআলা',         href: '/products?categorySlug=books&genre=Fiqh' },
        { label: 'Sirat & Biography',      labelBn: 'সীরাত ও জীবনী',         href: '/products?categorySlug=books&genre=Sirat' },
        { label: 'Islamic History',        labelBn: 'ইসলামী ইতিহাস',          href: '/products?categorySlug=books&genre=Islamic-History' },
        { label: 'Islamic Novel',          labelBn: 'ইসলামী উপন্যাস',         href: '/products?categorySlug=books&genre=Islamic-Novel' },
        { label: 'Self-Purification',      labelBn: 'আত্মশুদ্ধি ও তাযকিয়া', href: '/products?categorySlug=books&genre=Tazkiyah' },
        { label: 'Dawah',                  labelBn: 'দাওয়াহ',                  href: '/products?categorySlug=books&genre=Dawah' },
        { label: 'Islamic Law',            labelBn: 'ইসলামী আইন',             href: '/products?categorySlug=books&genre=Islamic-Law' },
        { label: "Children's Islamic",     labelBn: 'শিশুদের ইসলামিক বই',    href: '/products?categorySlug=books&genre=Islamic-Children' },
        { label: 'Islamic Parenting',      labelBn: 'ইসলামী পারিবারিক বই',   href: '/products?categorySlug=books&genre=Islamic-Family' },
      ]},
      { heading: 'Academic & Competitive', headingBn: 'একাডেমিক ও প্রতিযোগিতামূলক', links: [
        { label: 'Primary School (1–5)',   labelBn: 'প্রাথমিক শিক্ষা (১–৫)',  href: '/products?categorySlug=books&genre=Primary' },
        { label: 'JSC / JDC',             labelBn: 'জেএসসি / জেডিসি',        href: '/products?categorySlug=books&genre=JSC' },
        { label: 'SSC Prep',              labelBn: 'এসএসসি প্রস্তুতি',        href: '/products?categorySlug=books&genre=SSC' },
        { label: 'HSC Prep',              labelBn: 'এইচএসসি প্রস্তুতি',       href: '/products?categorySlug=books&genre=HSC' },
        { label: 'University Admission',  labelBn: 'বিশ্ববিদ্যালয় ভর্তি',    href: '/products?categorySlug=books&genre=Uni-Admission' },
        { label: 'BCS Prep',              labelBn: 'বিসিএস প্রস্তুতি',        href: '/products?categorySlug=books&genre=BCS' },
        { label: 'Medical Admission',     labelBn: 'মেডিকেল ভর্তি',           href: '/products?categorySlug=books&genre=Medical-Admission' },
        { label: 'Engineering Admission', labelBn: 'প্রকৌশল ভর্তি',           href: '/products?categorySlug=books&genre=Engineering' },
        { label: 'Bank Job Prep',         labelBn: 'ব্যাংক জব প্রস্তুতি',    href: '/products?categorySlug=books&genre=Bank-Job' },
        { label: 'Govt Job Prep',         labelBn: 'সরকারি চাকরি প্রস্তুতি', href: '/products?categorySlug=books&genre=Govt-Job' },
        { label: 'IELTS / TOEFL',         labelBn: 'আইইএলটিএস / টোফেল',      href: '/products?categorySlug=books&genre=IELTS' },
        { label: 'English Language',      labelBn: 'ইংরেজি ভাষা শিক্ষা',    href: '/products?categorySlug=books&genre=English-Language' },
      ]},
      { heading: 'More Categories', headingBn: 'আরো বিভাগ', links: [
        { label: 'Self-Help & Motivation',     labelBn: 'আত্মউন্নয়ন ও মোটিভেশন',    href: '/products?categorySlug=books&genre=Self-Help' },
        { label: 'Business & Entrepreneurship',labelBn: 'ব্যবসা ও উদ্যোক্তা',       href: '/products?categorySlug=books&genre=Business' },
        { label: 'Psychology',                 labelBn: 'মনোবিজ্ঞান',                href: '/products?categorySlug=books&genre=Psychology' },
        { label: 'History & Liberation War',   labelBn: 'ইতিহাস ও মুক্তিযুদ্ধ',     href: '/products?categorySlug=books&genre=History' },
        { label: 'Science & Technology',       labelBn: 'বিজ্ঞান ও প্রযুক্তি',      href: '/products?categorySlug=books&genre=Science' },
        { label: 'Health & Medicine',          labelBn: 'স্বাস্থ্য ও চিকিৎসা',      href: '/products?categorySlug=books&genre=Health' },
        { label: "Children's & Young Adult",   labelBn: 'শিশু-কিশোর সাহিত্য',        href: '/products?categorySlug=books&genre=Children' },
        { label: 'Comics & Manga',             labelBn: 'কমিক্স ও ম্যাঙ্গা',        href: '/products?categorySlug=books&genre=Comics' },
        { label: 'English Fiction',            labelBn: 'ইংরেজি ফিকশন',             href: '/products?categorySlug=books&genre=English-Fiction' },
        { label: 'English Non-Fiction',        labelBn: 'ইংরেজি নন-ফিকশন',         href: '/products?categorySlug=books&genre=English-Non-Fiction' },
        { label: 'Dictionary & Reference',     labelBn: 'অভিধান ও রেফারেন্স',       href: '/products?categorySlug=books&genre=Reference' },
        { label: 'Art, Music & Culture',       labelBn: 'শিল্প, সঙ্গীত ও সংস্কৃতি', href: '/products?categorySlug=books&genre=Art' },
      ]},
    ],
  },
  // 1 — Baby Products
  {
    columns: [
      { heading: 'Diapering & Care', headingBn: 'ডায়াপার ও যত্ন', links: [
        { label: 'Diapers',          labelBn: 'ডায়াপার',         href: '/products?categorySlug=baby-products&sub=diapers' },
        { label: 'Baby Wipes',       labelBn: 'বেবি ওয়াইপস',     href: '/products?categorySlug=baby-products&sub=wipes' },
        { label: 'Baby Wash',        labelBn: 'বেবি ওয়াশ',       href: '/products?categorySlug=baby-products&sub=baby-wash' },
        { label: 'Rash Cream',       labelBn: 'র‍্যাশ ক্রিম',      href: '/products?categorySlug=baby-products&sub=rash-cream' },
        { label: 'Baby Oils',        labelBn: 'বেবি অয়েল',        href: '/products?categorySlug=baby-products&sub=baby-oil' },
      ]},
      { heading: 'Feeding & Nursing', headingBn: 'ফিডিং ও নার্সিং', links: [
        { label: 'Baby Bottles',     labelBn: 'ফিডিং বোতল',        href: '/products?categorySlug=baby-products&sub=bottles' },
        { label: 'Breast Pumps',     labelBn: 'ব্রেস্ট পাম্প',      href: '/products?categorySlug=baby-products&sub=breast-pump' },
        { label: 'Baby Food',        labelBn: 'বেবি ফুড',           href: '/products?categorySlug=baby-products&sub=baby-food' },
        { label: 'High Chairs',      labelBn: 'হাই চেয়ার',          href: '/products?categorySlug=baby-products&sub=high-chair' },
        { label: 'Bottle Sterilizer',labelBn: 'স্টেরিলাইজার',        href: '/products?categorySlug=baby-products&sub=sterilizer' },
      ]},
      { heading: 'Gear & Clothing', headingBn: 'গিয়ার ও পোশাক', links: [
        { label: 'Strollers',        labelBn: 'স্ট্রোলার',           href: '/products?categorySlug=baby-products&sub=stroller' },
        { label: 'Car Seats',        labelBn: 'কার সিট',             href: '/products?categorySlug=baby-products&sub=car-seat' },
        { label: 'Baby Carriers',    labelBn: 'বেবি ক্যারিয়ার',      href: '/products?categorySlug=baby-products&sub=carrier' },
        { label: 'Educational Toys', labelBn: 'শিক্ষামূলক খেলনা',    href: '/products?categorySlug=baby-products&sub=edu-toys' },
        { label: 'All Baby →',       labelBn: 'সব পণ্য →',           href: '/products?categorySlug=baby-products' },
      ]},
    ],
  },
  // 2 — Leather
  {
    columns: [
      { heading: 'Wallets & Accessories', headingBn: 'পার্স ও আনুষাঙ্গিক', links: [
        { label: 'Bifold Wallets',   labelBn: 'বাইফোল্ড পার্স',     href: '/products?categorySlug=leather-products&sub=bifold' },
        { label: 'Card Holders',     labelBn: 'কার্ড হোল্ডার',       href: '/products?categorySlug=leather-products&sub=card-holder' },
        { label: 'Coin Purses',      labelBn: 'কয়েন পার্স',          href: '/products?categorySlug=leather-products&sub=coin-purse' },
        { label: 'Keychains',        labelBn: 'কী চেইন',             href: '/products?categorySlug=leather-products&sub=keychain' },
        { label: 'Belts',            labelBn: 'বেল্ট',               href: '/products?categorySlug=leather-products&sub=belts' },
      ]},
      { heading: 'Bags', headingBn: 'ব্যাগ', links: [
        { label: 'Office Bags',      labelBn: 'অফিস ব্যাগ',          href: '/products?categorySlug=leather-products&sub=office-bag' },
        { label: 'Backpacks',        labelBn: 'ব্যাকপ্যাক',           href: '/products?categorySlug=leather-products&sub=backpack' },
        { label: 'Ladies Bags',      labelBn: 'লেডিস ব্যাগ',         href: '/products?categorySlug=leather-products&sub=ladies-bag' },
        { label: 'Clutches',         labelBn: 'ক্লাচ ব্যাগ',          href: '/products?categorySlug=leather-products&sub=clutch' },
        { label: 'Sling Bags',       labelBn: 'স্লিং ব্যাগ',          href: '/products?categorySlug=leather-products&sub=sling' },
      ]},
      { heading: 'Footwear', headingBn: 'জুতা', links: [
        { label: 'Formal Shoes',     labelBn: 'ফর্মাল জুতা',          href: '/products?categorySlug=leather-products&sub=formal-shoes' },
        { label: 'Loafers',          labelBn: 'লোফার',               href: '/products?categorySlug=leather-products&sub=loafers' },
        { label: 'Ladies Heels',     labelBn: 'হিলস',                 href: '/products?categorySlug=leather-products&sub=heels' },
        { label: 'Sandals',          labelBn: 'স্যান্ডেল',             href: '/products?categorySlug=leather-products&sub=sandals' },
        { label: 'All Leather →',    labelBn: 'সব চামড়া →',           href: '/products?categorySlug=leather-products' },
      ]},
    ],
  },
  // 3 — Organic Foods
  {
    columns: [
      { heading: 'Honey & Sweeteners', headingBn: 'মধু ও মিষ্টি', links: [
        { label: 'Wild Forest Honey', labelBn: 'বন মধু',              href: '/products?categorySlug=organic-foods&sub=wild-honey' },
        { label: 'Mustard Honey',     labelBn: 'সরিষার মধু',           href: '/products?categorySlug=organic-foods&sub=mustard-honey' },
        { label: 'Date Molasses',     labelBn: 'খেজুরের গুড়',          href: '/products?categorySlug=organic-foods&sub=date-molasses' },
        { label: 'Jaggery',           labelBn: 'আখের গুড়',             href: '/products?categorySlug=organic-foods&sub=jaggery' },
        { label: 'Stevia',            labelBn: 'স্টেভিয়া',              href: '/products?categorySlug=organic-foods&sub=stevia' },
      ]},
      { heading: 'Nuts, Seeds & Spices', headingBn: 'বাদাম ও মশলা', links: [
        { label: 'Almonds',           labelBn: 'কাঠবাদাম',             href: '/products?categorySlug=organic-foods&sub=almonds' },
        { label: 'Cashews',           labelBn: 'কাজুবাদাম',            href: '/products?categorySlug=organic-foods&sub=cashews' },
        { label: 'Black Seed (Kalonji)',labelBn: 'কালিজিরা',            href: '/products?categorySlug=organic-foods&sub=black-seed' },
        { label: 'Turmeric',          labelBn: 'হলুদ',                 href: '/products?categorySlug=organic-foods&sub=turmeric' },
        { label: 'Dried Fruits',      labelBn: 'শুকনো ফল',             href: '/products?categorySlug=organic-foods&sub=dried-fruits' },
      ]},
      { heading: 'Tea & Healthy Snacks', headingBn: 'চা ও স্ন্যাকস', links: [
        { label: 'Green Tea',         labelBn: 'গ্রিন টি',              href: '/products?categorySlug=organic-foods&sub=green-tea' },
        { label: 'Herbal Tea',        labelBn: 'হার্বাল টি',             href: '/products?categorySlug=organic-foods&sub=herbal-tea' },
        { label: 'Pumpkin Seeds',     labelBn: 'কুমড়ার বীজ',           href: '/products?categorySlug=organic-foods&sub=pumpkin-seeds' },
        { label: 'Granola & Oats',    labelBn: 'গ্রানোলা ও ওটস',       href: '/products?categorySlug=organic-foods&sub=granola' },
        { label: 'All Organic →',     labelBn: 'সব অর্গানিক →',         href: '/products?categorySlug=organic-foods' },
      ]},
    ],
  },
  // 4 — Islamic Lifestyle
  {
    columns: [
      { heading: 'Prayer & Worship', headingBn: 'নামাজ ও ইবাদত', links: [
        { label: 'Prayer Mats',        labelBn: 'জায়নামাজ',           href: '/islamic-lifestyle?sub=prayer-mat' },
        { label: 'Prayer Caps',        labelBn: 'টুপি',                href: '/islamic-lifestyle?sub=prayer-cap' },
        { label: 'Tasbih Beads',       labelBn: 'তাসবিহ',              href: '/islamic-lifestyle?sub=tasbih' },
        { label: 'Miswak',             labelBn: 'মিসওয়াক',             href: '/islamic-lifestyle?sub=miswak' },
        { label: 'Quran Stands',       labelBn: 'কুরআন স্ট্যান্ড',     href: '/islamic-lifestyle?sub=quran-stand' },
        { label: 'Quran & Books',      labelBn: 'কুরআন ও বই',          href: '/products?categorySlug=books&genre=Islamic' },
      ]},
      { heading: 'Islamic Clothing', headingBn: 'ইসলামিক পোশাক', links: [
        { label: 'Panjabi / Jubbah',   labelBn: 'পাঞ্জাবি / জুব্বা',   href: '/islamic-lifestyle?sub=panjabi' },
        { label: 'Hijab',              labelBn: 'হিজাব',                href: '/islamic-lifestyle?sub=hijab' },
        { label: 'Abaya',              labelBn: 'আবায়া',                href: '/islamic-lifestyle?sub=abaya' },
        { label: 'Islamic Kids Wear',  labelBn: 'শিশু ইসলামিক পোশাক',  href: '/islamic-lifestyle?sub=kids-wear' },
        { label: 'Niqab & Accessories',labelBn: 'নিকাব ও আনুষাঙ্গিক',  href: '/islamic-lifestyle?sub=niqab' },
      ]},
      { heading: 'Perfumes & Décor', headingBn: 'আতর ও ডেকোর', links: [
        { label: 'Attar / Oud',        labelBn: 'আতর / আউড',            href: '/islamic-lifestyle?sub=attar' },
        { label: 'Bakhoor Incense',    labelBn: 'বাখুর আগরবাতি',        href: '/islamic-lifestyle?sub=bakhoor' },
        { label: 'Islamic Wall Art',   labelBn: 'ইসলামিক ওয়াল আর্ট',   href: '/islamic-lifestyle?sub=wall-art' },
        { label: 'Calligraphy',        labelBn: 'ক্যালিগ্রাফি',          href: '/islamic-lifestyle?sub=calligraphy' },
        { label: 'All Islamic →',      labelBn: 'সব পণ্য দেখুন →',      href: '/islamic-lifestyle' },
      ]},
    ],
  },
  // 5 — Handicrafts
  {
    columns: [
      { heading: 'Wall Art & Décor', headingBn: 'দেওয়াল শিল্প ও ডেকোর', links: [
        { label: 'Canvas Prints',      labelBn: 'ক্যানভাস প্রিন্ট',     href: '/products?categorySlug=handicrafts&sub=canvas' },
        { label: 'Calligraphy',        labelBn: 'ক্যালিগ্রাফি',          href: '/products?categorySlug=handicrafts&sub=calligraphy' },
        { label: 'Oil Paintings',      labelBn: 'তেল চিত্রকর্ম',         href: '/products?categorySlug=handicrafts&sub=paintings' },
        { label: 'Clay & Terracotta',  labelBn: 'মাটির পণ্য',            href: '/products?categorySlug=handicrafts&sub=clay' },
        { label: 'Showpieces',         labelBn: 'শোপিস',                  href: '/products?categorySlug=handicrafts&sub=showpieces' },
      ]},
      { heading: 'Traditional Crafts', headingBn: 'ঐতিহ্যবাহী শিল্প', links: [
        { label: 'Nakshi Kantha',      labelBn: 'নকশি কাঁথা',            href: '/products?categorySlug=handicrafts&sub=nakshi-kantha' },
        { label: 'Muslin & Jamdani',   labelBn: 'মসলিন ও জামদানি',       href: '/products?categorySlug=handicrafts&sub=muslin' },
        { label: 'Jute Products',      labelBn: 'পাটের পণ্য',             href: '/products?categorySlug=handicrafts&sub=jute' },
        { label: 'Bamboo & Cane',      labelBn: 'বাঁশ ও বেতের পণ্য',     href: '/products?categorySlug=handicrafts&sub=bamboo' },
        { label: 'Kantha & Embroidery',labelBn: 'কাঁথা ও সূচিকর্ম',      href: '/products?categorySlug=handicrafts&sub=embroidery' },
      ]},
      { heading: 'Handmade Gifts', headingBn: 'হাতে তৈরি উপহার', links: [
        { label: 'Gift Baskets',       labelBn: 'গিফট বাস্কেট',           href: '/products?categorySlug=handicrafts&sub=gift-basket' },
        { label: 'Pottery',            labelBn: 'মাটির বাসন',              href: '/products?categorySlug=handicrafts&sub=pottery' },
        { label: 'Wooden Crafts',      labelBn: 'কাঠের হস্তশিল্প',        href: '/products?categorySlug=handicrafts&sub=wooden' },
        { label: 'Brass & Metal Art',  labelBn: 'পিতল ও ধাতু শিল্প',     href: '/products?categorySlug=handicrafts&sub=brass' },
        { label: 'All Crafts →',       labelBn: 'সব হস্তশিল্প →',         href: '/products?categorySlug=handicrafts' },
      ]},
    ],
  },
  // 6 — Electronics
  {
    columns: [
      { heading: 'Mobiles & Tablets', headingBn: 'মোবাইল ও ট্যাবলেট', links: [
        { label: 'Samsung Phones',     labelBn: 'স্যামসাং ফোন',          href: '/products?categorySlug=electronics&sub=mobiles&search=samsung' },
        { label: 'iPhone',             labelBn: 'আইফোন',                  href: '/products?categorySlug=electronics&sub=mobiles&search=iphone' },
        { label: 'Budget Phones',      labelBn: 'বাজেট ফোন',              href: '/products?categorySlug=electronics&sub=mobiles' },
        { label: 'Tablets & iPads',    labelBn: 'ট্যাবলেট',                href: '/products?categorySlug=electronics&sub=tablets' },
        { label: 'Phone Accessories',  labelBn: 'ফোনের আনুষাঙ্গিক',       href: '/products?categorySlug=electronics&sub=phone-accessories' },
      ]},
      { heading: 'Laptops & Computing', headingBn: 'ল্যাপটপ ও কম্পিউটার', links: [
        { label: 'Gaming Laptops',     labelBn: 'গেমিং ল্যাপটপ',          href: '/products?categorySlug=electronics&sub=gaming-laptop' },
        { label: 'Office / Ultrabooks',labelBn: 'অফিস ল্যাপটপ',           href: '/products?categorySlug=electronics&sub=office-laptop' },
        { label: 'MacBook',            labelBn: 'ম্যাকবুক',                href: '/products?categorySlug=electronics&sub=macbook' },
        { label: 'Monitors',           labelBn: 'মনিটর',                   href: '/products?categorySlug=electronics&sub=monitors' },
        { label: 'Keyboards & Mouse',  labelBn: 'কীবোর্ড ও মাউস',         href: '/products?categorySlug=electronics&sub=peripherals' },
      ]},
      { heading: 'Audio, Gadgets & Home', headingBn: 'অডিও ও গ্যাজেট', links: [
        { label: 'Earbuds & TWS',      labelBn: 'ইয়ারবাডস',               href: '/products?categorySlug=electronics&sub=earbuds' },
        { label: 'Smartwatches',       labelBn: 'স্মার্টওয়াচ',             href: '/products?categorySlug=electronics&sub=smartwatch' },
        { label: 'Power Banks',        labelBn: 'পাওয়ার ব্যাংক',           href: '/products?categorySlug=electronics&sub=power-bank' },
        { label: 'Smart Cameras',      labelBn: 'স্মার্ট ক্যামেরা',         href: '/products?categorySlug=electronics&sub=cameras' },
        { label: 'All Electronics →',  labelBn: 'সব ইলেকট্রনিক্স →',      href: '/products?categorySlug=electronics' },
      ]},
    ],
  },
  // 7 — Daily Needs
  {
    columns: [
      { heading: 'Grocery & Kitchen', headingBn: 'মুদি ও রান্নাঘর', links: [
        { label: 'Rice & Flour',       labelBn: 'চাল ও আটা',              href: '/products?categorySlug=daily-needs&sub=rice-flour' },
        { label: 'Cooking Oil',        labelBn: 'রান্নার তেল',              href: '/products?categorySlug=daily-needs&sub=cooking-oil' },
        { label: 'Pulses & Lentils',   labelBn: 'ডাল ও শস্য',              href: '/products?categorySlug=daily-needs&sub=pulses' },
        { label: 'Spices & Condiments',labelBn: 'মশলা ও মসলা',             href: '/products?categorySlug=daily-needs&sub=spices' },
        { label: 'Kitchen Tools',      labelBn: 'কিচেন সরঞ্জাম',           href: '/products?categorySlug=daily-needs&sub=kitchen-tools' },
      ]},
      { heading: 'Personal Care', headingBn: 'ব্যক্তিগত যত্ন', links: [
        { label: 'Skin Care',          labelBn: 'স্কিন কেয়ার',              href: '/products?categorySlug=daily-needs&sub=skin-care' },
        { label: 'Hair Care',          labelBn: 'হেয়ার কেয়ার',             href: '/products?categorySlug=daily-needs&sub=hair-care' },
        { label: 'Oral Care',          labelBn: 'মুখের যত্ন',               href: '/products?categorySlug=daily-needs&sub=oral-care' },
        { label: 'Soaps & Body Wash',  labelBn: 'সাবান ও বডি ওয়াশ',       href: '/products?categorySlug=daily-needs&sub=soaps' },
        { label: 'Deodorant',          labelBn: 'ডিওডোরেন্ট',               href: '/products?categorySlug=daily-needs&sub=deodorant' },
      ]},
      { heading: 'Household & Stationery', headingBn: 'গৃহস্থালি ও স্টেশনারি', links: [
        { label: 'Cleaning Supplies',  labelBn: 'পরিষ্কার সামগ্রী',         href: '/products?categorySlug=daily-needs&sub=cleaning' },
        { label: 'Notebooks & Pens',   labelBn: 'নোটবুক ও কলম',            href: '/products?categorySlug=daily-needs&sub=stationery' },
        { label: 'Pet Food & Care',    labelBn: 'পোষা প্রাণীর যত্ন',        href: '/products?categorySlug=daily-needs&sub=pet-care' },
        { label: 'Air Fresheners',     labelBn: 'এয়ার ফ্রেশনার',            href: '/products?categorySlug=daily-needs&sub=air-freshener' },
        { label: 'All Daily →',        labelBn: 'সব পণ্য →',                href: '/products?categorySlug=daily-needs' },
      ]},
    ],
  },
  // 8 — Health & Sports
  {
    columns: [
      { heading: 'Fitness Equipment', headingBn: 'ফিটনেস সরঞ্জাম', links: [
        { label: 'Dumbbells & Barbells',  labelBn: 'ডাম্বেল ও বারবেল',     href: '/products?categorySlug=health-sports&sub=dumbbells' },
        { label: 'Resistance Bands',      labelBn: 'রেজিস্ট্যান্স ব্যান্ড', href: '/products?categorySlug=health-sports&sub=bands' },
        { label: 'Treadmills',            labelBn: 'ট্রেডমিল',               href: '/products?categorySlug=health-sports&sub=treadmill' },
        { label: 'Exercise Cycles',       labelBn: 'এক্সারসাইজ সাইকেল',     href: '/products?categorySlug=health-sports&sub=cycle' },
        { label: 'Pull-up Bars',          labelBn: 'পুলআপ বার',              href: '/products?categorySlug=health-sports&sub=pull-up' },
        { label: 'Gym Gloves',            labelBn: 'জিম গ্লাভস',             href: '/products?categorySlug=health-sports&sub=gloves' },
        { label: 'Punching Bags',         labelBn: 'পাঞ্চিং ব্যাগ',          href: '/products?categorySlug=health-sports&sub=boxing' },
        { label: 'All Equipment →',       labelBn: 'সব ফিটনেস →',           href: '/products?categorySlug=health-sports' },
      ]},
      { heading: 'Sports & Outdoor', headingBn: 'স্পোর্টস ও আউটডোর', links: [
        { label: 'Cricket',        labelBn: 'ক্রিকেট',      href: '/products?categorySlug=health-sports&sub=cricket' },
        { label: 'Football',       labelBn: 'ফুটবল',        href: '/products?categorySlug=health-sports&sub=football' },
        { label: 'Badminton',      labelBn: 'ব্যাডমিন্টন',  href: '/products?categorySlug=health-sports&sub=badminton' },
        { label: 'Table Tennis',   labelBn: 'টেবিল টেনিস',  href: '/products?categorySlug=health-sports&sub=table-tennis' },
        { label: 'Swimming',       labelBn: 'সাঁতার',        href: '/products?categorySlug=health-sports&sub=swimming' },
        { label: 'Cycling',        labelBn: 'সাইক্লিং',     href: '/products?categorySlug=health-sports&sub=cycling' },
        { label: 'Trekking & Camping', labelBn: 'ট্রেকিং',  href: '/products?categorySlug=health-sports&sub=trekking' },
        { label: 'All Sports →',   labelBn: 'সব স্পোর্টস →', href: '/products?categorySlug=health-sports' },
      ]},
      { heading: 'Health & Wellness', headingBn: 'স্বাস্থ্য ও সুস্থতা', links: [
        { label: 'Protein Powder',    labelBn: 'প্রোটিন পাউডার',    href: '/products?categorySlug=health-sports&sub=protein' },
        { label: 'Vitamins & Minerals', labelBn: 'ভিটামিন ও খনিজ', href: '/products?categorySlug=health-sports&sub=vitamins' },
        { label: 'Mass Gainers',      labelBn: 'মাস গেইনার',         href: '/products?categorySlug=health-sports&sub=mass-gainer' },
        { label: 'Yoga Mats & Blocks',labelBn: 'যোগব্যায়াম ম্যাট',  href: '/products?categorySlug=health-sports&sub=yoga' },
        { label: 'BP Monitors',       labelBn: 'বিপি মনিটর',         href: '/products?categorySlug=health-sports&sub=bp-monitor' },
        { label: 'Glucose Meters',    labelBn: 'গ্লুকোজ মিটার',      href: '/products?categorySlug=health-sports&sub=glucose' },
        { label: 'Thermometers',      labelBn: 'থার্মোমিটার',         href: '/products?categorySlug=health-sports&sub=thermometer' },
        { label: 'All Health →',      labelBn: 'সব পণ্য →',          href: '/products?categorySlug=health-sports' },
      ]},
    ],
  },
  // 9 — Fashion & Lifestyle
  {
    columns: [
      { heading: "Men's Fashion", headingBn: 'পুরুষ ফ্যাশন', links: [
        { label: 'Panjabi & Kurta',   labelBn: 'পাঞ্জাবি ও কুর্তা',   href: '/products?categorySlug=fashion-lifestyle&sub=panjabi' },
        { label: 'Formal Shirts',     labelBn: 'ফর্মাল শার্ট',          href: '/products?categorySlug=fashion-lifestyle&sub=shirts' },
        { label: 'T-Shirts & Polo',   labelBn: 'টি-শার্ট ও পোলো',      href: '/products?categorySlug=fashion-lifestyle&sub=tshirts' },
        { label: 'Jeans & Pants',     labelBn: 'জিন্স ও প্যান্ট',      href: '/products?categorySlug=fashion-lifestyle&sub=jeans' },
        { label: 'Suits & Blazers',   labelBn: 'স্যুট ও ব্লেজার',      href: '/products?categorySlug=fashion-lifestyle&sub=suits' },
        { label: 'Activewear',        labelBn: 'অ্যাক্টিভওয়্যার',      href: '/products?categorySlug=fashion-lifestyle&sub=activewear' },
        { label: "Men's Accessories", labelBn: 'পুরুষ আনুষাঙ্গিক',     href: '/products?categorySlug=fashion-lifestyle&sub=mens-acc' },
        { label: "All Men's →",       labelBn: 'সব পুরুষ পোশাক →',     href: '/products?categorySlug=fashion-lifestyle' },
      ]},
      { heading: "Women's Fashion", headingBn: 'নারী ফ্যাশন', links: [
        { label: 'Saree',             labelBn: 'শাড়ি',                 href: '/products?categorySlug=fashion-lifestyle&sub=saree' },
        { label: 'Salwar Kameez',     labelBn: 'সালোয়ার কামিজ',        href: '/products?categorySlug=fashion-lifestyle&sub=salwar' },
        { label: 'Kurti & Tops',      labelBn: 'কুর্তি ও টপস',         href: '/products?categorySlug=fashion-lifestyle&sub=kurti' },
        { label: 'Hijab & Abaya',     labelBn: 'হিজাব ও আবায়া',        href: '/products?categorySlug=fashion-lifestyle&sub=hijab' },
        { label: 'Western Wear',      labelBn: 'ওয়েস্টার্ন পোশাক',     href: '/products?categorySlug=fashion-lifestyle&sub=western' },
        { label: 'Ethnic Wear',       labelBn: 'ঐতিহ্যবাহী পোশাক',     href: '/products?categorySlug=fashion-lifestyle&sub=ethnic' },
        { label: "Women's Accessories", labelBn: 'নারী আনুষাঙ্গিক',    href: '/products?categorySlug=fashion-lifestyle&sub=womens-acc' },
        { label: "All Women's →",     labelBn: 'সব নারী পোশাক →',      href: '/products?categorySlug=fashion-lifestyle' },
      ]},
      { heading: 'Footwear & Beauty', headingBn: 'জুতা ও বিউটি', links: [
        { label: "Men's Shoes",       labelBn: 'পুরুষের জুতা',          href: '/products?categorySlug=fashion-lifestyle&sub=mens-shoes' },
        { label: "Women's Shoes",     labelBn: 'নারীর জুতা',            href: '/products?categorySlug=fashion-lifestyle&sub=womens-shoes' },
        { label: 'Sandals & Slippers',labelBn: 'স্যান্ডেল ও স্লিপার',   href: '/products?categorySlug=fashion-lifestyle&sub=sandals' },
        { label: 'Skincare',          labelBn: 'স্কিন কেয়ার',           href: '/products?categorySlug=fashion-lifestyle&sub=skincare' },
        { label: 'Makeup & Cosmetics',labelBn: 'মেকআপ ও কসমেটিক্স',    href: '/products?categorySlug=fashion-lifestyle&sub=makeup' },
        { label: 'Fragrances',        labelBn: 'পারফিউম ও আতর',         href: '/products?categorySlug=fashion-lifestyle&sub=perfume' },
        { label: 'Kids Fashion',      labelBn: 'শিশু ফ্যাশন',           href: '/products?categorySlug=fashion-lifestyle&sub=kids' },
        { label: 'All Fashion →',     labelBn: 'সব পণ্য →',             href: '/products?categorySlug=fashion-lifestyle' },
      ]},
    ],
  },
  // 10 — Home & Furniture
  {
    columns: [
      { heading: 'Furniture', headingBn: 'আসবাবপত্র', links: [
        { label: 'Sofa & Sectionals',     labelBn: 'সোফা',               href: '/products?categorySlug=home-furniture&sub=sofa' },
        { label: 'Beds & Mattresses',     labelBn: 'বিছানা',              href: '/products?categorySlug=home-furniture&sub=beds' },
        { label: 'Dining Table & Chairs', labelBn: 'ডাইনিং সেট',          href: '/products?categorySlug=home-furniture&sub=dining' },
        { label: 'Wardrobes & Almirahs',  labelBn: 'আলমারি',              href: '/products?categorySlug=home-furniture&sub=wardrobe' },
        { label: 'Bookshelves',           labelBn: 'বুকশেলফ',             href: '/products?categorySlug=home-furniture&sub=bookshelf' },
        { label: 'TV Units',              labelBn: 'টিভি ইউনিট',           href: '/products?categorySlug=home-furniture&sub=tv-unit' },
        { label: 'Office Chairs',         labelBn: 'অফিস চেয়ার',          href: '/products?categorySlug=home-furniture&sub=office-chair' },
        { label: 'All Furniture →',       labelBn: 'সব আসবাবপত্র →',      href: '/products?categorySlug=home-furniture' },
      ]},
      { heading: 'Home Decor & Bedding', headingBn: 'হোম ডেকোর ও বেডিং', links: [
        { label: 'Wall Art & Clocks',     labelBn: 'ওয়াল আর্ট ও ঘড়ি',    href: '/products?categorySlug=home-furniture&sub=wall-art' },
        { label: 'Curtains & Blinds',     labelBn: 'পর্দা',               href: '/products?categorySlug=home-furniture&sub=curtains' },
        { label: 'Bedsheets & Pillows',   labelBn: 'বেডশিট ও বালিশ',      href: '/products?categorySlug=home-furniture&sub=bedsheet' },
        { label: 'Rugs & Carpets',        labelBn: 'রাগ ও কার্পেট',       href: '/products?categorySlug=home-furniture&sub=rugs' },
        { label: 'Vases & Showpieces',    labelBn: 'ভাস ও শোপিস',         href: '/products?categorySlug=home-furniture&sub=vases' },
        { label: 'Photo Frames',          labelBn: 'ফটো ফ্রেম',            href: '/products?categorySlug=home-furniture&sub=frames' },
        { label: 'Mirrors',               labelBn: 'আয়না',                href: '/products?categorySlug=home-furniture&sub=mirrors' },
        { label: 'All Decor →',           labelBn: 'সব ডেকোর →',          href: '/products?categorySlug=home-furniture' },
      ]},
      { heading: 'Kitchen & Lighting', headingBn: 'কিচেন ও আলো', links: [
        { label: 'Cookware Sets',         labelBn: 'কুকওয়্যার সেট',       href: '/products?categorySlug=home-furniture&sub=cookware' },
        { label: 'Kitchen Storage',       labelBn: 'কিচেন স্টোরেজ',        href: '/products?categorySlug=home-furniture&sub=kitchen-storage' },
        { label: 'Dinner Sets',           labelBn: 'ডিনার সেট',            href: '/products?categorySlug=home-furniture&sub=dinner-set' },
        { label: 'Ceiling Lights',        labelBn: 'সিলিং লাইট',           href: '/products?categorySlug=home-furniture&sub=ceiling-light' },
        { label: 'Table Lamps',           labelBn: 'টেবিল ল্যাম্প',         href: '/products?categorySlug=home-furniture&sub=table-lamp' },
        { label: 'LED Strip Lights',      labelBn: 'এলইডি স্ট্রিপ',        href: '/products?categorySlug=home-furniture&sub=led-strip' },
        { label: 'Cleaning Supplies',     labelBn: 'পরিষ্কার সামগ্রী',     href: '/products?categorySlug=home-furniture&sub=cleaning' },
        { label: 'All Kitchen →',         labelBn: 'সব কিচেন →',           href: '/products?categorySlug=home-furniture' },
      ]},
    ],
  },
  // 11 — Automotive
  {
    columns: [
      { heading: 'Car Accessories', headingBn: 'গাড়ির সামগ্রী', links: [
        { label: 'Seat Covers',           labelBn: 'সিট কভার',             href: '/products?categorySlug=automotive&sub=seat-cover' },
        { label: 'Car Perfume',           labelBn: 'কার পারফিউম',          href: '/products?categorySlug=automotive&sub=perfume' },
        { label: 'Dash Cams',             labelBn: 'ড্যাশ ক্যাম',          href: '/products?categorySlug=automotive&sub=dashcam' },
        { label: 'Car Covers',            labelBn: 'কার কভার',             href: '/products?categorySlug=automotive&sub=car-cover' },
        { label: 'Car Chargers',          labelBn: 'কার চার্জার',           href: '/products?categorySlug=automotive&sub=charger' },
        { label: 'Floor Mats',            labelBn: 'ফ্লোর ম্যাট',           href: '/products?categorySlug=automotive&sub=floor-mat' },
        { label: 'GPS & Navigation',      labelBn: 'জিপিএস ও নেভিগেশন',   href: '/products?categorySlug=automotive&sub=gps' },
        { label: 'All Car Accessories →', labelBn: 'সব সামগ্রী →',         href: '/products?categorySlug=automotive' },
      ]},
      { heading: 'Bike & Motorcycle', headingBn: 'বাইক ও মোটরসাইকেল', links: [
        { label: 'Helmets',               labelBn: 'হেলমেট',               href: '/products?categorySlug=automotive&sub=helmet' },
        { label: 'Bike Accessories',      labelBn: 'বাইক আনুষাঙ্গিক',      href: '/products?categorySlug=automotive&sub=bike-acc' },
        { label: 'Spare Parts',           labelBn: 'স্পেয়ার পার্টস',       href: '/products?categorySlug=automotive&sub=spare-parts' },
        { label: 'Engine Oil',            labelBn: 'ইঞ্জিন অয়েল',          href: '/products?categorySlug=automotive&sub=engine-oil' },
        { label: 'Riding Gloves',         labelBn: 'রাইডিং গ্লাভস',        href: '/products?categorySlug=automotive&sub=gloves' },
        { label: 'Bike Locks',            labelBn: 'বাইক লক',              href: '/products?categorySlug=automotive&sub=lock' },
        { label: 'Chain Lubricants',      labelBn: 'চেইন লুব্রিক্যান্ট',   href: '/products?categorySlug=automotive&sub=lube' },
        { label: 'All Motorcycle →',      labelBn: 'সব মোটরসাইকেল →',     href: '/products?categorySlug=automotive' },
      ]},
      { heading: 'Tools & Car Care', headingBn: 'সরঞ্জাম ও গাড়ির যত্ন', links: [
        { label: 'Car Wash Shampoo',      labelBn: 'কার ওয়াশ শ্যাম্পু',   href: '/products?categorySlug=automotive&sub=wash' },
        { label: 'Tire Inflators',        labelBn: 'টায়ার ইনফ্লেটর',       href: '/products?categorySlug=automotive&sub=inflator' },
        { label: 'Jump Starters',         labelBn: 'জাম্প স্টার্টার',       href: '/products?categorySlug=automotive&sub=jump-starter' },
        { label: 'Hand Tools',            labelBn: 'হ্যান্ড টুলস',          href: '/products?categorySlug=automotive&sub=hand-tools' },
        { label: 'Power Tools',           labelBn: 'পাওয়ার টুলস',          href: '/products?categorySlug=automotive&sub=power-tools' },
        { label: 'Polish & Wax',          labelBn: 'পলিশ ও ওয়াক্স',        href: '/products?categorySlug=automotive&sub=polish' },
        { label: 'Tyre & Rims',           labelBn: 'টায়ার ও রিম',          href: '/products?categorySlug=automotive&sub=tyre' },
        { label: 'All Tools →',           labelBn: 'সব সরঞ্জাম →',         href: '/products?categorySlug=automotive' },
      ]},
    ],
  },
  // 12 — Agriculture
  {
    columns: [
      { heading: 'Seeds & Plants', headingBn: 'বীজ ও গাছপালা', links: [
        { label: 'Vegetable Seeds',       labelBn: 'সবজির বীজ',            href: '/products?categorySlug=agriculture&sub=veg-seeds' },
        { label: 'Flower Plants',         labelBn: 'ফুলের গাছ',            href: '/products?categorySlug=agriculture&sub=flower' },
        { label: 'Fruit Plants',          labelBn: 'ফলের গাছ',             href: '/products?categorySlug=agriculture&sub=fruit' },
        { label: 'Herb & Spice Seeds',    labelBn: 'মশলা ও ভেষজ বীজ',     href: '/products?categorySlug=agriculture&sub=herbs' },
        { label: 'Paddy Seeds',           labelBn: 'ধানের বীজ',            href: '/products?categorySlug=agriculture&sub=paddy' },
        { label: 'Fertilizers',           labelBn: 'সার',                  href: '/products?categorySlug=agriculture&sub=fertilizer' },
        { label: 'Pesticides',            labelBn: 'কীটনাশক',             href: '/products?categorySlug=agriculture&sub=pesticide' },
        { label: 'All Seeds →',           labelBn: 'সব বীজ →',             href: '/products?categorySlug=agriculture' },
      ]},
      { heading: 'Farming Tools', headingBn: 'কৃষি সরঞ্জাম', links: [
        { label: 'Sprayers',              labelBn: 'স্প্রেয়ার',             href: '/products?categorySlug=agriculture&sub=sprayer' },
        { label: 'Irrigation Pipes',      labelBn: 'সেচ পাইপ',             href: '/products?categorySlug=agriculture&sub=irrigation' },
        { label: 'Water Pumps',           labelBn: 'ওয়াটার পাম্প',         href: '/products?categorySlug=agriculture&sub=pump' },
        { label: 'Hand Tools',            labelBn: 'হাতিয়ার',             href: '/products?categorySlug=agriculture&sub=hand-tools' },
        { label: 'Greenhouse Supplies',   labelBn: 'গ্রিনহাউস সামগ্রী',   href: '/products?categorySlug=agriculture&sub=greenhouse' },
        { label: 'Soil & Compost',        labelBn: 'মাটি ও কম্পোস্ট',     href: '/products?categorySlug=agriculture&sub=soil' },
        { label: 'Bird & Pest Control',   labelBn: 'পেস্ট কন্ট্রোল',      href: '/products?categorySlug=agriculture&sub=pest-control' },
        { label: 'All Tools →',           labelBn: 'সব সরঞ্জাম →',         href: '/products?categorySlug=agriculture' },
      ]},
      { heading: 'Livestock & Organic', headingBn: 'গবাদি পশু ও জৈব', links: [
        { label: 'Poultry Feed',          labelBn: 'পোল্ট্রি ফিড',         href: '/products?categorySlug=agriculture&sub=poultry' },
        { label: 'Fish Feed',             labelBn: 'মাছের খাবার',          href: '/products?categorySlug=agriculture&sub=fish-feed' },
        { label: 'Cattle Feed',           labelBn: 'গরু-ছাগলের খাবার',    href: '/products?categorySlug=agriculture&sub=cattle' },
        { label: 'Organic Fertilizer',    labelBn: 'জৈব সার',              href: '/products?categorySlug=agriculture&sub=organic-fert' },
        { label: 'Veterinary Supplies',   labelBn: 'পশু চিকিৎসা সামগ্রী', href: '/products?categorySlug=agriculture&sub=vet' },
        { label: 'Beekeeping',            labelBn: 'মধু চাষ',              href: '/products?categorySlug=agriculture&sub=beekeeping' },
        { label: 'Aquaculture',           labelBn: 'মৎস্য চাষ',           href: '/products?categorySlug=agriculture&sub=aquaculture' },
        { label: 'All Livestock →',       labelBn: 'সব গবাদি পশু →',      href: '/products?categorySlug=agriculture' },
      ]},
    ],
  },
  // 13 — Toys & Gaming
  {
    columns: [
      { heading: "Children's Toys", headingBn: 'শিশুদের খেলনা', links: [
        { label: 'Action Figures',        labelBn: 'অ্যাকশন ফিগার',       href: '/products?categorySlug=toys-gaming&sub=action' },
        { label: 'Dolls & Stuffed Toys',  labelBn: 'পুতুল ও নরম খেলনা',   href: '/products?categorySlug=toys-gaming&sub=dolls' },
        { label: 'Board Games',           labelBn: 'বোর্ড গেমস',          href: '/products?categorySlug=toys-gaming&sub=board' },
        { label: 'Educational Toys',      labelBn: 'শিক্ষামূলক খেলনা',    href: '/products?categorySlug=toys-gaming&sub=educational' },
        { label: 'Remote Control Toys',   labelBn: 'রিমোট কন্ট্রোল',      href: '/products?categorySlug=toys-gaming&sub=rc-toys' },
        { label: 'Outdoor Toys',          labelBn: 'আউটডোর খেলনা',        href: '/products?categorySlug=toys-gaming&sub=outdoor' },
        { label: 'LEGO & Blocks',         labelBn: 'লেগো ও ব্লকস',        href: '/products?categorySlug=toys-gaming&sub=lego' },
        { label: 'All Toys →',            labelBn: 'সব খেলনা →',          href: '/products?categorySlug=toys-gaming' },
      ]},
      { heading: 'Video Games', headingBn: 'ভিডিও গেমস', links: [
        { label: 'PlayStation Games',     labelBn: 'প্লেস্টেশন গেম',      href: '/products?categorySlug=toys-gaming&sub=ps-games' },
        { label: 'Xbox Games',            labelBn: 'এক্সবক্স গেম',        href: '/products?categorySlug=toys-gaming&sub=xbox-games' },
        { label: 'PC Games',              labelBn: 'পিসি গেম',            href: '/products?categorySlug=toys-gaming&sub=pc-games' },
        { label: 'Nintendo Switch',       labelBn: 'নিন্টেন্ডো সুইচ',    href: '/products?categorySlug=toys-gaming&sub=nintendo' },
        { label: 'Mobile Game Cards',     labelBn: 'মোবাইল গেম কার্ড',   href: '/products?categorySlug=toys-gaming&sub=mobile-cards' },
        { label: 'Gaming Accessories',    labelBn: 'গেমিং আনুষাঙ্গিক',   href: '/products?categorySlug=toys-gaming&sub=gaming-acc' },
        { label: 'Game Gift Cards',       labelBn: 'গিফট কার্ড',          href: '/products?categorySlug=toys-gaming&sub=gift-cards' },
        { label: 'All Video Games →',     labelBn: 'সব ভিডিও গেম →',     href: '/products?categorySlug=toys-gaming' },
      ]},
      { heading: 'Consoles & Gear', headingBn: 'কনসোল ও গিয়ার', links: [
        { label: 'PlayStation 5',         labelBn: 'প্লেস্টেশন ৫',        href: '/products?categorySlug=toys-gaming&sub=ps5' },
        { label: 'PlayStation 4',         labelBn: 'প্লেস্টেশন ৪',        href: '/products?categorySlug=toys-gaming&sub=ps4' },
        { label: 'Xbox Series X/S',       labelBn: 'এক্সবক্স সিরিজ',      href: '/products?categorySlug=toys-gaming&sub=xbox-series' },
        { label: 'Controllers',           labelBn: 'কন্ট্রোলার',           href: '/products?categorySlug=toys-gaming&sub=controllers' },
        { label: 'Gaming Chairs',         labelBn: 'গেমিং চেয়ার',         href: '/products?categorySlug=toys-gaming&sub=gaming-chair' },
        { label: 'Gaming Headsets',       labelBn: 'গেমিং হেডসেট',        href: '/products?categorySlug=toys-gaming&sub=headset' },
        { label: 'Gaming Monitors',       labelBn: 'গেমিং মনিটর',         href: '/products?categorySlug=toys-gaming&sub=monitor' },
        { label: 'All Consoles →',        labelBn: 'সব কনসোল →',          href: '/products?categorySlug=toys-gaming' },
      ]},
    ],
  },
  // 14 — Travel & Bags
  {
    columns: [
      { heading: 'Luggage & Travel Bags', headingBn: 'লাগেজ ও ট্রাভেল ব্যাগ', links: [
        { label: 'Cabin Trolleys',        labelBn: 'ক্যাবিন ট্রলি',        href: '/products?categorySlug=travel-bags&sub=cabin' },
        { label: 'Check-in Luggage',      labelBn: 'চেক-ইন লাগেজ',        href: '/products?categorySlug=travel-bags&sub=checkin' },
        { label: 'Duffle Bags',           labelBn: 'ডাফেল ব্যাগ',          href: '/products?categorySlug=travel-bags&sub=duffle' },
        { label: 'Travel Backpacks',      labelBn: 'ট্রাভেল ব্যাকপ্যাক',  href: '/products?categorySlug=travel-bags&sub=backpack' },
        { label: 'Gym Bags',              labelBn: 'জিম ব্যাগ',            href: '/products?categorySlug=travel-bags&sub=gym-bag' },
        { label: 'Laptop Bags',           labelBn: 'ল্যাপটপ ব্যাগ',        href: '/products?categorySlug=travel-bags&sub=laptop-bag' },
        { label: 'School Bags',           labelBn: 'স্কুল ব্যাগ',          href: '/products?categorySlug=travel-bags&sub=school-bag' },
        { label: 'All Luggage →',         labelBn: 'সব লাগেজ →',          href: '/products?categorySlug=travel-bags' },
      ]},
      { heading: 'Ladies & Fashion Bags', headingBn: 'লেডিস ও ফ্যাশন ব্যাগ', links: [
        { label: 'Handbags',              labelBn: 'হ্যান্ডব্যাগ',         href: '/products?categorySlug=travel-bags&sub=handbag' },
        { label: 'Clutch Bags',           labelBn: 'ক্লাচ ব্যাগ',          href: '/products?categorySlug=travel-bags&sub=clutch' },
        { label: 'Tote Bags',             labelBn: 'টোট ব্যাগ',            href: '/products?categorySlug=travel-bags&sub=tote' },
        { label: 'Sling Bags',            labelBn: 'স্লিং ব্যাগ',          href: '/products?categorySlug=travel-bags&sub=sling' },
        { label: 'Wallets',               labelBn: 'মানিব্যাগ',            href: '/products?categorySlug=travel-bags&sub=wallet' },
        { label: 'Card Holders',          labelBn: 'কার্ড হোল্ডার',        href: '/products?categorySlug=travel-bags&sub=card-holder' },
        { label: 'Belt Bags',             labelBn: 'বেল্ট ব্যাগ',          href: '/products?categorySlug=travel-bags&sub=belt-bag' },
        { label: 'All Ladies Bags →',     labelBn: 'সব লেডিস ব্যাগ →',    href: '/products?categorySlug=travel-bags' },
      ]},
      { heading: 'Travel Accessories', headingBn: 'ট্রাভেল আনুষাঙ্গিক', links: [
        { label: 'Travel Pillows',        labelBn: 'ট্রাভেল বালিশ',        href: '/products?categorySlug=travel-bags&sub=pillow' },
        { label: 'Passport Holders',      labelBn: 'পাসপোর্ট হোল্ডার',    href: '/products?categorySlug=travel-bags&sub=passport' },
        { label: 'Travel Adapters',       labelBn: 'ট্রাভেল অ্যাডাপ্টার', href: '/products?categorySlug=travel-bags&sub=adapter' },
        { label: 'Packing Cubes',         labelBn: 'প্যাকিং কিউব',         href: '/products?categorySlug=travel-bags&sub=packing' },
        { label: 'Eye Masks',             labelBn: 'চোখের মাস্ক',          href: '/products?categorySlug=travel-bags&sub=eye-mask' },
        { label: 'Luggage Locks',         labelBn: 'লাগেজ লক',            href: '/products?categorySlug=travel-bags&sub=lock' },
        { label: 'Travel Pouches',        labelBn: 'ট্রাভেল পাউচ',         href: '/products?categorySlug=travel-bags&sub=pouch' },
        { label: 'All Accessories →',     labelBn: 'সব আনুষাঙ্গিক →',     href: '/products?categorySlug=travel-bags' },
      ]},
    ],
  },
  // 15 — Eco Friendly Products
  {
    ecoTiles: [
      { label: 'Organic Foods',       labelBn: 'অর্গানিক খাবার',        emoji: '🥗', color: 'bg-green-50 border-green-200 text-green-700',   href: '/products?categorySlug=eco-friendly&sub=organic-foods' },
      { label: 'Natural Skincare',    labelBn: 'প্রাকৃতিক স্কিনকেয়ার', emoji: '🌸', color: 'bg-pink-50 border-pink-200 text-pink-700',     href: '/products?categorySlug=eco-friendly&sub=natural-skincare' },
      { label: 'Bamboo Products',     labelBn: 'বাঁশের পণ্য',           emoji: '🎋', color: 'bg-lime-50 border-lime-200 text-lime-700',     href: '/products?categorySlug=eco-friendly&sub=bamboo' },
      { label: 'Herbal Products',     labelBn: 'ভেষজ পণ্য',             emoji: '🌿', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', href: '/products?categorySlug=eco-friendly&sub=herbal' },
      { label: 'Recycled Products',   labelBn: 'পুনর্ব্যবহৃত পণ্য',    emoji: '♻️', color: 'bg-teal-50 border-teal-200 text-teal-700',    href: '/products?categorySlug=eco-friendly&sub=recycled' },
      { label: 'Eco Stationery',      labelBn: 'ইকো স্টেশনারি',         emoji: '📝', color: 'bg-yellow-50 border-yellow-200 text-yellow-700', href: '/products?categorySlug=eco-friendly&sub=stationery' },
      { label: 'Sustainable Fashion', labelBn: 'টেকসই পোশাক',           emoji: '👗', color: 'bg-violet-50 border-violet-200 text-violet-700', href: '/products?categorySlug=eco-friendly&sub=sustainable-fashion' },
      { label: 'Green Home',          labelBn: 'গ্রিন হোম',             emoji: '🏡', color: 'bg-cyan-50 border-cyan-200 text-cyan-700',    href: '/products?categorySlug=eco-friendly&sub=green-home' },
      { label: 'Jute & Natural Fiber',labelBn: 'পাট ও প্রাকৃতিক তন্তু', emoji: '🌾', color: 'bg-amber-50 border-amber-200 text-amber-700', href: '/products?categorySlug=eco-friendly&sub=jute' },
    ],
    columns: [
      { heading: 'Food & Wellness', headingBn: 'খাদ্য ও সুস্থতা', links: [
        { label: 'Organic Foods',       labelBn: 'অর্গানিক খাবার',      href: '/products?categorySlug=eco-friendly&sub=organic-foods' },
        { label: 'Herbal Supplements',  labelBn: 'ভেষজ সাপ্লিমেন্ট',    href: '/products?categorySlug=eco-friendly&sub=supplements' },
        { label: 'Natural Honey',       labelBn: 'প্রাকৃতিক মধু',       href: '/products?categorySlug=eco-friendly&sub=honey' },
        { label: 'Organic Tea',         labelBn: 'অর্গানিক চা',         href: '/products?categorySlug=eco-friendly&sub=tea' },
        { label: 'Herbal Products',     labelBn: 'ভেষজ পণ্য',           href: '/products?categorySlug=eco-friendly&sub=herbal' },
        { label: 'All Food →',          labelBn: 'সব খাদ্য →',          href: '/products?categorySlug=eco-friendly&sub=organic-foods' },
      ]},
      { heading: 'Home & Beauty', headingBn: 'হোম ও বিউটি', links: [
        { label: 'Natural Skincare',    labelBn: 'প্রাকৃতিক স্কিনকেয়ার', href: '/products?categorySlug=eco-friendly&sub=natural-skincare' },
        { label: 'Bamboo Products',     labelBn: 'বাঁশের পণ্য',          href: '/products?categorySlug=eco-friendly&sub=bamboo' },
        { label: 'Recycled Products',   labelBn: 'পুনর্ব্যবহৃত পণ্য',   href: '/products?categorySlug=eco-friendly&sub=recycled' },
        { label: 'Green Home Decor',    labelBn: 'গ্রিন হোম ডেকোর',     href: '/products?categorySlug=eco-friendly&sub=home-decor' },
        { label: 'Jute & Natural Fiber',labelBn: 'পাট ও প্রাকৃতিক তন্তু', href: '/products?categorySlug=eco-friendly&sub=jute' },
        { label: 'All Home →',          labelBn: 'সব হোম →',            href: '/products?categorySlug=eco-friendly&sub=green-home' },
      ]},
      { heading: 'Fashion & Office', headingBn: 'ফ্যাশন ও অফিস', links: [
        { label: 'Sustainable Fashion', labelBn: 'টেকসই পোশাক',        href: '/products?categorySlug=eco-friendly&sub=sustainable-fashion' },
        { label: 'Eco Stationery',      labelBn: 'ইকো স্টেশনারি',       href: '/products?categorySlug=eco-friendly&sub=stationery' },
        { label: 'Recycled Paper',      labelBn: 'রিসাইকেলড কাগজ',      href: '/products?categorySlug=eco-friendly&sub=recycled-paper' },
        { label: 'Organic Cotton',      labelBn: 'অর্গানিক কটন পোশাক',  href: '/products?categorySlug=eco-friendly&sub=organic-cotton' },
        { label: 'Eco Bags',            labelBn: 'ইকো ব্যাগ',            href: '/products?categorySlug=eco-friendly&sub=eco-bags' },
        { label: 'All Fashion →',       labelBn: 'সব ফ্যাশন →',         href: '/products?categorySlug=eco-friendly&sub=sustainable-fashion' },
      ]},
    ],
  },
] as const;

// Slug order matching MEGA_CATEGORIES / MEGA_CONTENT above
const MEGA_SLUGS = [
  'books','baby-products','leather-products','organic-foods','islamic-lifestyle',
  'handicrafts','electronics','daily-needs','health-sports','fashion-lifestyle',
  'home-furniture','automotive','agriculture','toys-gaming','travel-bags',
  'eco-friendly',
] as const;

// Priority categories always shown in the main nav row (full text, no truncation).
// Keep this list short enough that even long BN names fit at 1200px+.
const MAIN_ROW_SLUGS = new Set([
  'books', 'baby-products', 'leather-products', 'islamic-lifestyle',
  'handicrafts', 'health-sports', 'eco-friendly',
]);

const MEGA_CATS_BY_SLUG = Object.fromEntries(
  MEGA_SLUGS.map((slug, i) => [slug, MEGA_CATEGORIES[i]!] as const)
) as Record<string, typeof MEGA_CATEGORIES[number]>;

const MEGA_CONTENT_BY_SLUG = Object.fromEntries(
  MEGA_SLUGS.map((slug, i) => [slug, MEGA_CONTENT[i]!] as const)
) as Record<string, typeof MEGA_CONTENT[number]>;

const NAV_BY_SLUG = Object.fromEntries(
  NAV_CATEGORIES.map(c => [c.slug, c] as const)
) as Record<string, NavCategory>;

type ApiCat = {
  id: string; slug: string; name: string; isFeatured?: boolean; sortOrder?: number;
  icon?: string; color?: string; imageUrl?: string;
  children?: Array<{ id: string; name: string; slug: string; sortOrder?: number; isActive?: boolean }>;
};

type MegaCat = {
  slug: string;
  emoji: string;
  name: string;
  nameBn: string;
  href: string;
  subs: { label: string; labelBn: string; href: string }[];
};

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
  const [moreOpen, setMoreOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLDivElement>(null);
  const accountPanelRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    if (moreOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [moreOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const inTrigger = accountTriggerRef.current?.contains(e.target as Node);
      const inPanel  = accountPanelRef.current?.contains(e.target as Node);
      if (!inTrigger && !inPanel) setAccountOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };
    if (accountOpen) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [accountOpen]);

  const openAccountDropdown = useCallback(() => {
    if (accountTriggerRef.current) {
      const rect = accountTriggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setAccountOpen(o => !o);
  }, []);

  const itemCount = isAuthenticated
    ? (cart?.itemCount ?? 0)
    : guestCart.items.reduce((sum, i) => sum + i.quantity, 0);

  const guestWishlist = useGuestWishlist();
  const { data: wishlistItems } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getAll(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
  const wishlistCount = isAuthenticated
    ? (wishlistItems?.length ?? 0)
    : guestWishlist.productIds.length;

  const { data: apiCategories, isPending: navCatsPending } = useQuery({
    queryKey: ['nav-categories'],
    queryFn: () => categoriesApi.getAll(false),
    staleTime: 5 * 60 * 1000,
  });

  const { data: contactConfig } = useQuery<Record<string, string>>({
    queryKey: ['chatbot-config'],
    queryFn: () => api.get('/chatbot/config').then(r => (r.data?.data ?? {}) as Record<string, string>),
    staleTime: 5 * 60_000,
    retry: false,
  });
  const supportPhone = contactConfig?.['contact.whatsappNumber']?.trim();

  const { data: barBanner } = useQuery({
    queryKey: ['announcement-bar'],
    queryFn: () => api.get('/design/banners').then(r => {
      const list: Array<{position: string; isActive: boolean; title?: string; subtitle?: string; linkUrl?: string; imageUrl?: string; ctaText?: string}> = r.data?.data ?? r.data ?? [];
      return list.find(b => b.position === 'ANNOUNCEMENT_BAR' && b.isActive) ?? null;
    }).catch(() => null),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    const q = searchParams.get('q');
    setSearchQuery(q ?? '');
  }, [searchParams]);

  // Single source of truth: which category slugs are visible, in nav order.
  // Rules (stable — no layout flicker):
  //   • No API yet            → show the full static set.
  //   • API loaded, none of   → show the full static set (admin hasn't curated;
  //     the cats featured        default isFeatured:false must NOT hide everything).
  //   • API loaded, some       → show featured DB cats + static-only cats
  //     featured                 (those not yet created in the DB).
  const { apiBySlug, visibleSlugs } = useMemo(() => {
    // While loading: return empty so the category row renders a skeleton instead of
    // flashing the full static set and then collapsing to the real featured subset.
    if (navCatsPending) return { apiBySlug: new Map<string, ApiCat>(), visibleSlugs: [] as string[] };
    const map = new Map((apiCategories as ApiCat[] | undefined ?? []).map(c => [c.slug, c]));
    if (map.size === 0) return { apiBySlug: map, visibleSlugs: MEGA_SLUGS as readonly string[] };
    const adminCurated = (apiCategories as ApiCat[]).some(c => c.isFeatured);
    const slugs = MEGA_SLUGS.filter(slug => {
      const apiCat = map.get(slug);
      if (!apiCat) return true;            // not in DB → static fallback
      if (!adminCurated) return true;      // admin hasn't curated → show all
      return apiCat.isFeatured === true;   // curated → only featured
    });
    return { apiBySlug: map, visibleSlugs: slugs };
  }, [apiCategories]);

  const dynamicNavCategories: NavCategory[] = useMemo(() =>
    visibleSlugs.map(slug => {
      const base = NAV_BY_SLUG[slug]!;
      const apiCat = apiBySlug.get(slug);
      return apiCat ? { ...base, displayName: apiCat.name } : base;
    }),
  [visibleSlugs, apiBySlug]);

  // Split into main-row (priority) and More overflow
  const mainRowCats = useMemo(() => dynamicNavCategories.filter(c => MAIN_ROW_SLUGS.has(c.slug)), [dynamicNavCategories]);
  const moreCats    = useMemo(() => dynamicNavCategories.filter(c => !MAIN_ROW_SLUGS.has(c.slug)), [dynamicNavCategories]);

  // Mega-menu left panel: same visible set, with API child categories as sub-items.
  const dynamicMegaCategories = useMemo(() =>
    visibleSlugs.map(slug => {
      const apiCat = apiBySlug.get(slug);
      const st = MEGA_CATS_BY_SLUG[slug];
      const apiChildren = (apiCat?.children ?? [])
        .filter(c => c.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
      const allHref = slug === 'islamic-lifestyle' ? '/islamic-lifestyle' : `/products?categorySlug=${slug}`;
      const subs: MegaCat['subs'] = apiChildren.length > 0
        ? [
            ...apiChildren.map(child => ({ label: child.name, labelBn: child.name, href: `/products?categorySlug=${slug}&sub=${child.slug}` })),
            { label: `All ${apiCat?.name ?? st?.name ?? slug} →`, labelBn: `সব ${apiCat?.name ?? st?.nameBn ?? slug} →`, href: allHref },
          ]
        : (st?.subs as MegaCat['subs'] ?? []);
      return {
        slug,
        emoji: apiCat?.icon ?? st?.emoji ?? '🏷️',
        name: apiCat?.name ?? st?.name ?? slug,
        nameBn: st?.nameBn ?? apiCat?.name ?? slug,
        href: allHref,
        subs,
      } satisfies MegaCat;
    }),
  [visibleSlugs, apiBySlug]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const activeCategory = dynamicNavCategories[activeCategoryIndex] ?? dynamicNavCategories[0];

  const getCatName = (cat: NavCategory) =>
    lang === 'bn' ? t.nav[cat.nameKey] : cat.displayName;

  const getSubLabel = (sub: string) => {
    if (lang === 'bn') {
      if (activeCategory?.slug === '/books') {
        return (t.booksSubnav as Record<string, string>)[sub] ?? sub;
      }
      return BN_SUBNAV[activeCategory?.slug ?? '']?.[sub] ?? sub;
    }
    return sub;
  };

  return (
    <>
      {/* Announcement Bar */}
      {barBanner && (
        barBanner.linkUrl ? (
          <a
            href={barBanner.linkUrl}
            className="block w-full text-center py-2 px-4 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: barBanner.imageUrl ?? '#1d4ed8', color: barBanner.ctaText ?? '#ffffff' }}
          >
            {lang === 'bn' ? (barBanner.title ?? '') : (barBanner.subtitle ?? barBanner.title ?? '')}
          </a>
        ) : (
          <div
            className="w-full text-center py-2 px-4 text-sm font-semibold"
            style={{ background: barBanner.imageUrl ?? '#1d4ed8', color: barBanner.ctaText ?? '#ffffff' }}
          >
            {lang === 'bn' ? (barBanner.title ?? '') : (barBanner.subtitle ?? barBanner.title ?? '')}
          </div>
        )
      )}
      <header className="sticky top-0 z-50 w-full shadow-sm border-b border-gray-200 bg-white overflow-x-hidden lg:overflow-visible">

        {/* ── Tier 1: Utility bar ── */}
        <div className="bg-[#1a1a1a] py-1.5 hidden md:block">
          <div className="max-w-[1400px] mx-auto px-4 flex justify-between items-center text-[11px] text-gray-300 font-medium">
            <div className="flex items-center gap-4">
              {/* ── Sell on Unkora animated button — LEFT side ── */}
              <Link href="/publish" className="sell-border-wrapper normal-case hover:scale-105 transition-transform duration-200 group self-center -my-1.5">
                <span className="sell-spark sell-spark-1" />
                <span className="sell-spark sell-spark-2" />
                <span className="sell-spark sell-spark-3" />
                <span className="sell-spark sell-spark-4" />
                <div className="sell-cta-inner">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
                  </span>
                  <span
                    className={cn(
                      'text-white whitespace-nowrap antialiased [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]',
                      lang === 'bn'
                        ? 'text-xs font-bold tracking-normal'
                        : 'text-[10px] font-black tracking-wide',
                    )}
                  >
                    {lang === 'bn' ? 'বই বিক্রি করুন' : 'Sell Your Book'}
                  </span>
                  <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-full" />
                </div>
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
            <div className="flex items-center gap-4 uppercase tracking-wide">
              {/* Pre-Order — simple button, far right of top bar */}
              <Link
                href="/preorder"
                className="flex items-center gap-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-black text-[10px] tracking-wider px-3 py-1.5 rounded-full transition-colors whitespace-nowrap normal-case shadow-sm shadow-emerald-900/40"
              >
                <CalendarClock className="w-3 h-3 flex-shrink-0" />
                Pre-Order
                <span className="text-white/50">/</span>
                <span className="text-emerald-200">প্রি-অর্ডার</span>
              </Link>
              <div className="h-3 w-px bg-gray-600" />
              <Link href="/support" className="hover:text-primary transition-colors flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> {t.header.support}
              </Link>
              <Link href="/track-order" className="hover:text-primary transition-colors">{t.header.trackOrder}</Link>
            </div>
          </div>
        </div>

        {/* ── Mobile utility strip (phone left / track + support right) ── */}
        <div className="md:hidden bg-[#f8f4ef] border-b border-gray-100 px-4 py-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-600 font-medium">
            {/* Left: phone number */}
            {supportPhone ? (
              <a href={`tel:+${supportPhone}`} className="flex items-center gap-1 text-primary font-bold">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>+{supportPhone}</span>
              </a>
            ) : (
              <a href="tel:+8801700000000" className="flex items-center gap-1 text-primary font-bold">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>+880 1700-000000</span>
              </a>
            )}
            {/* Right: track order + support */}
            <div className="flex items-center gap-3">
              <Link href="/track-order" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Package className="w-3 h-3" />
                <span>ট্র্যাক অর্ডার</span>
              </Link>
              <div className="w-px h-3 bg-gray-300" />
              <Link href="/support" className="flex items-center gap-1 hover:text-primary transition-colors">
                <HelpCircle className="w-3 h-3" />
                <span>সাপোর্ট</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Tier 2: Main bar ── */}
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 md:py-4 relative z-50 bg-white">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">

            {/* Mobile toggle + Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden -ml-1 text-gray-800 hover:text-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <Link href="/" className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight flex items-center whitespace-nowrap">
                <span className="text-gray-900">UNKORA</span>
                <span className="text-secondary">.SHOP</span>
              </Link>
            </div>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 min-w-0 max-w-3xl relative">
              <div className="flex w-full rounded-lg overflow-hidden border-2 border-gray-200 focus-within:border-primary focus-within:shadow-md transition-all duration-300">
                <select className="hidden lg:block bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-600 border-r border-gray-200 cursor-pointer hover:bg-gray-200 focus:outline-none shrink-0 max-w-[120px]">
                  <option value="">{lang === 'bn' ? 'সব' : 'All'}</option>
                  {dynamicNavCategories.map(c => (
                    <option key={c.slug} value={c.slug}>{getCatName(c)}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t.header.searchPlaceholder}
                  className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 outline-none text-sm sm:text-[15px] placeholder:text-gray-400 text-black border-none"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/80 text-white px-4 sm:px-6 lg:px-8 transition-colors flex items-center justify-center font-bold shrink-0"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </form>

            {/* Icons */}
            <div className="flex items-center gap-0 sm:gap-1 md:gap-2 shrink-0 text-gray-800 ml-auto">
              {/* Account */}
              <div ref={accountRef} className="relative group">
                {/* Trigger */}
                <div
                  ref={accountTriggerRef}
                  className="flex items-center gap-1 cursor-pointer transition-colors"
                  onClick={openAccountDropdown}
                >
                  <div className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${accountOpen ? 'text-secondary' : 'hover:text-secondary'}`}>
                    <User className="w-6 h-6" />
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
                </div>

                {/* Dropdown rendered via portal — see bottom of component */}
              </div>

              {/* Admin link */}
              {isAuthenticated && user?.role !== 'CUSTOMER' && (
                <Link href="/admin" className="hidden lg:inline text-xs font-bold text-primary border border-primary/30 rounded px-2 py-1 hover:bg-primary hover:text-white transition-colors">
                  {t.header.admin}
                </Link>
              )}

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="relative min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-secondary transition-colors"
                aria-label="Wishlist"
              >
                <div className="relative">
                  <Heart className="w-6 h-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-black h-[18px] w-[18px] rounded-full flex items-center justify-center border-2 border-white leading-none">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </div>
                <span className="hidden xl:block text-sm font-bold ml-1.5">{lang === 'bn' ? 'উইশলিস্ট' : 'Wishlist'}</span>
              </Link>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-secondary transition-colors"
                aria-label="Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-1.5 -right-2 bg-secondary text-white text-[10px] font-black h-[18px] w-[18px] rounded-full flex items-center justify-center border-2 border-white leading-none">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                </div>
                <span className="hidden xl:block text-sm font-bold ml-1.5">{t.header.cart}</span>
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-1.5 pb-1 md:hidden">
            <form onSubmit={handleSearch} className="flex rounded-lg overflow-hidden border-2 border-gray-200 bg-white focus-within:border-primary transition-all duration-300">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t.header.searchPlaceholderMobile}
                className="flex-1 min-w-0 px-3 py-2.5 outline-none text-sm placeholder:text-gray-400 text-black"
              />
              <button type="submit" className="bg-primary text-white px-4 hover:bg-primary/80 transition-colors flex items-center justify-center min-h-[44px] shrink-0">
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* ── Tier 3: Category nav (desktop) ── */}
        <div className="bg-white hidden lg:block border-b border-gray-200 relative z-30" ref={megaRef}>
          <div className="max-w-[1400px] mx-auto pl-4 xl:pl-6 pr-0 flex items-stretch h-[50px] relative">
            {/* All Departments button */}
            <div className="relative flex items-stretch shrink-0">
              <button
                onClick={() => setMegaOpen(o => !o)}
                className={cn(
                  'h-full flex items-center gap-2 px-4 xl:px-5 font-bold text-[13.5px] cursor-pointer transition-colors whitespace-nowrap',
                  megaOpen ? 'bg-primary text-white' : 'bg-gray-900 text-white hover:bg-gray-800',
                )}
              >
                <Menu className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="hidden xl:inline">{t.header.allDepartments}</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform duration-200 flex-shrink-0', megaOpen && 'rotate-180')} />
              </button>

              {/* ── Mega Menu Dropdown ── */}
              {megaOpen && (
                <div className="absolute top-full left-0 z-50 shadow-2xl rounded-b-2xl overflow-hidden border border-gray-100 flex flex-col bg-white" style={{ width: 'min(960px, calc(100vw - 1.5rem))', maxHeight: 'calc(100vh - 120px)' }}>
                  {/* Top accent */}
                  <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary flex-shrink-0" />

                  <div className="flex flex-1 min-h-0">
                    {/* ── Left sidebar ── */}
                    <div className="w-48 bg-gray-50 border-r border-gray-100 py-1.5 flex-shrink-0 overflow-y-auto">
                      {dynamicMegaCategories.map((cat, i) => (
                        <div
                          key={cat.slug}
                          onMouseEnter={() => setMegaHoverCat(i)}
                          className={cn(
                            'relative flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors text-[13px]',
                            cat.slug === 'eco-friendly'
                              ? megaHoverCat === i
                                ? 'bg-white text-green-600 font-bold border-r-2 border-green-500'
                                : 'text-green-600 font-medium hover:bg-green-50 hover:text-green-700'
                              : megaHoverCat === i
                                ? 'bg-white text-primary font-bold border-r-2 border-primary'
                                : 'text-gray-700 font-medium hover:bg-white hover:text-primary',
                          )}
                        >
                          <span className="text-base leading-none flex-shrink-0">{cat.emoji}</span>
                          <span className="leading-tight">{lang === 'bn' ? cat.nameBn : cat.name}</span>
                          {cat.slug === 'eco-friendly' && (
                            <span className="relative flex h-1.5 w-1.5 ml-auto mr-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                          )}
                          {cat.slug !== 'eco-friendly' && <ChevronDown className="w-3 h-3 ml-auto -rotate-90 opacity-40 flex-shrink-0" />}
                        </div>
                      ))}
                    </div>

                    {/* ── Right content panel ── */}
                    <div className="flex-1 p-5 overflow-y-auto">

                      {/* ── BOOKS (special — Rokomari + Amazon style) ── */}
                      {dynamicMegaCategories[megaHoverCat]?.slug === 'books' && (() => {
                        const content = MEGA_CONTENT_BY_SLUG['books'] as typeof MEGA_CONTENT[0];
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
                                    href={rec.href}
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

                      {/* ── Eco Friendly (special animated) ── */}
                      {dynamicMegaCategories[megaHoverCat]?.slug === 'eco-friendly' && (() => {
                        const ecoContent = MEGA_CONTENT_BY_SLUG['eco-friendly'] as typeof MEGA_CONTENT[15];
                        if (!ecoContent) return null;
                        return (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-[15px] font-black text-gray-900 flex items-center gap-2">
                                🌱 {lang === 'bn' ? 'পরিবেশবান্ধব পণ্য' : 'Eco Friendly Products'}
                                <span className="relative inline-flex">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                                  <span className="relative text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-300">🌍 Green</span>
                                </span>
                              </h3>
                              <Link href="/products?categorySlug=eco-friendly" onClick={() => setMegaOpen(false)} className="text-xs text-green-600 hover:underline font-semibold">
                                {lang === 'bn' ? 'সব পরিবেশবান্ধব পণ্য →' : 'Browse all eco products →'}
                              </Link>
                            </div>
                            {/* Animated category tiles */}
                            <div className="mb-4">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                {lang === 'bn' ? 'বিভাগ অনুযায়ী ব্রাউজ করুন' : 'Browse by Category'}
                              </p>
                              <div className="grid grid-cols-5 gap-2">
                                {(ecoContent as any).ecoTiles?.map((tile: any) => (
                                  <Link
                                    key={tile.label}
                                    href={tile.href}
                                    onClick={() => setMegaOpen(false)}
                                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border ${tile.color} hover:shadow-md hover:scale-105 transition-all text-center group`}
                                  >
                                    <span className="text-xl leading-none group-hover:scale-110 transition-transform">{tile.emoji}</span>
                                    <span className="text-[9px] font-bold leading-tight">{lang === 'bn' ? tile.labelBn : tile.label}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                            {/* Three-column links */}
                            <div className="grid grid-cols-3 gap-x-8">
                              {ecoContent.columns.map((col: any) => (
                                <div key={col.heading}>
                                  <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-2 pb-1 border-b border-green-100">
                                    {lang === 'bn' ? col.headingBn : col.heading}
                                  </p>
                                  <ul className="space-y-0.5">
                                    {col.links.map((link: any) => (
                                      <li key={link.label}>
                                        <Link href={link.href} onClick={() => setMegaOpen(false)}
                                          className="text-[13px] text-gray-600 hover:text-green-600 transition-colors block py-1.5">
                                          {lang === 'bn' ? link.labelBn : link.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                            {/* Green pledge banner */}
                            <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                              <div>
                                <p className="text-[11px] font-black text-green-800">
                                  {lang === 'bn' ? '🌍 পরিবেশ রক্ষায় আমরা প্রতিশ্রুতিবদ্ধ' : '🌍 We are committed to protecting the environment'}
                                </p>
                                <p className="text-[10px] text-green-600 mt-0.5">
                                  {lang === 'bn' ? 'প্রতিটি ক্রয়ের সাথে একটি গাছ লাগানো হয়' : 'A tree is planted with every purchase'}
                                </p>
                              </div>
                              <Link href="/products?categorySlug=eco-friendly" onClick={() => setMegaOpen(false)}
                                className="text-[11px] font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-full transition-colors flex-shrink-0">
                                {lang === 'bn' ? 'শপ করুন →' : 'Shop Now →'}
                              </Link>
                            </div>
                          </>
                        );
                      })()}

                      {/* ── Other categories ── */}
                      {dynamicMegaCategories[megaHoverCat]?.slug !== 'books' && dynamicMegaCategories[megaHoverCat]?.slug !== 'eco-friendly' && (() => {
                        const cat = dynamicMegaCategories[megaHoverCat]!;
                        const staticContent = cat?.slug ? MEGA_CONTENT_BY_SLUG[cat.slug] : undefined;
                        // Fall back to building columns from the category's own subs list
                        const content: { columns: { heading: string; headingBn: string; links: { label: string; labelBn: string; href: string }[] }[] } | undefined =
                          (staticContent as unknown as { columns: { heading: string; headingBn: string; links: { label: string; labelBn: string; href: string }[] }[] } | undefined)
                          ?? (cat?.subs?.length ? { columns: [{ heading: 'Browse', headingBn: 'ব্রাউজ করুন', links: cat.subs }] } : undefined);
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
                      {lang === 'bn' ? `${dynamicMegaCategories.length}টি বিভাগে হাজারো পণ্য` : `1000s of products across ${dynamicMegaCategories.length} departments`}
                    </p>
                    <Link href="/products" onClick={() => setMegaOpen(false)}
                      className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-full transition-colors hover:bg-primary/10">
                      {lang === 'bn' ? 'সব পণ্য দেখুন →' : 'Browse all products →'}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Thin separator ─────────────────────────────────────────────── */}
            <div className="w-px bg-gray-100 my-2.5 mx-1 flex-shrink-0" />

            {/* ── Category links — overflow-hidden so they never bleed into More/special ── */}
            <div className="flex-1 min-w-0 flex items-stretch overflow-hidden">
              {navCatsPending ? (
                // Skeleton shimmer — prevents the static→API flash on first load
                <div className="flex items-center gap-3 px-2">
                  {[80, 72, 96, 80, 100, 88, 76].map((w, i) => (
                    <div key={i} className="h-4 rounded-full bg-gray-100 animate-pulse flex-shrink-0" style={{ width: w }} />
                  ))}
                </div>
              ) : mainRowCats.map((cat, idx) => (
                <Link
                  key={cat.slug}
                  href={cat.slug === 'islamic-lifestyle' ? '/islamic-lifestyle' : `/products?categorySlug=${cat.slug}`}
                  onMouseEnter={() => setActiveCategoryIndex(idx)}
                  className={cn(
                    'flex items-center justify-center px-3.5 xl:px-5 h-full transition-all relative text-[13px] font-semibold whitespace-nowrap flex-shrink-0',
                    cat.slug === 'eco-friendly'
                      ? activeCategoryIndex === idx ? 'text-green-600' : 'text-green-600 hover:text-green-700'
                      : activeCategoryIndex === idx ? 'text-primary' : 'text-gray-700 hover:text-primary',
                  )}
                >
                  {cat.slug === 'eco-friendly' ? (
                    <span className="flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                      </span>
                      {getCatName(cat)}
                    </span>
                  ) : getCatName(cat)}
                  {activeCategoryIndex === idx && (
                    <div className={`absolute bottom-0 left-0 w-full h-[2px] ${cat.slug === 'eco-friendly' ? 'bg-green-500' : 'bg-primary'}`} />
                  )}
                </Link>
              ))}
            </div>

            {/* ── More ▾ — sibling of category container so the dropdown isn't clipped ── */}
            {moreCats.length > 0 && (
              <div ref={moreRef} className="relative flex items-stretch flex-shrink-0">
                <button
                  onClick={() => setMoreOpen(o => !o)}
                  className={cn(
                    'flex items-center gap-1 px-3.5 xl:px-4 h-full text-[13px] font-semibold transition-all whitespace-nowrap relative border-l border-gray-100',
                    moreOpen ? 'text-primary bg-gray-50' : 'text-gray-600 hover:text-primary hover:bg-gray-50',
                  )}
                >
                  {lang === 'bn' ? 'আরও' : 'More'}
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0', moreOpen && 'rotate-180')} />
                  {moreOpen && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />}
                </button>
                {moreOpen && (
                  <div className="absolute top-full right-0 bg-white shadow-2xl rounded-b-xl overflow-hidden border border-gray-100 border-t-2 border-t-primary py-1 min-w-[200px] z-50">
                    {moreCats.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={cat.slug === 'islamic-lifestyle' ? '/islamic-lifestyle' : `/products?categorySlug=${cat.slug}`}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 text-[12.5px] font-medium transition-colors',
                          cat.slug === 'eco-friendly'
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-700 hover:text-primary hover:bg-gray-50',
                        )}
                      >
                        <cat.icon className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                        {getCatName(cat)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Special promotional links — right-anchored, accent-colored ───── */}
            <div className="flex items-stretch flex-shrink-0 border-l border-gray-100 ml-1">
              <Link
                href="/quick-commerce"
                className="flex items-center gap-1.5 px-2.5 xl:px-3.5 h-full text-[12px] xl:text-[13px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors whitespace-nowrap"
              >
                <span className="text-[15px]">⚡</span>
                <span className="hidden xl:inline">{lang === 'bn' ? 'কুইক কমার্স' : 'Quick Commerce'}</span>
                <span className="xl:hidden">{lang === 'bn' ? 'কুইক' : 'Quick'}</span>
              </Link>
              <div className="w-px bg-gray-100 my-3 flex-shrink-0" />
              <Link
                href="/recommerce"
                className="flex items-center gap-1.5 px-2.5 xl:px-3.5 h-full text-[12px] xl:text-[13px] font-bold text-amber-600 hover:bg-amber-50 transition-colors whitespace-nowrap"
              >
                <span className="text-[15px]">♻️</span>
                <span className="hidden xl:inline">{lang === 'bn' ? 'রিকমার্স' : 'Recommerce'}</span>
                <span className="xl:hidden">{lang === 'bn' ? 'রিকমার্স' : 'Reco'}</span>
              </Link>
              <div className="w-px bg-gray-100 my-3 flex-shrink-0" />
              <Link
                href="/flash-deals"
                className="flex items-center gap-1.5 px-2.5 xl:px-3.5 h-full text-[12px] xl:text-[13px] font-bold text-rose-600 hover:bg-rose-50 transition-colors whitespace-nowrap"
              >
                <span className="text-[15px]">🔥</span>
                <span>{lang === 'bn' ? t.header.dealOfDay : 'Deal of the Day'}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Tier 4: Subnav ── */}
        <div className="hidden">
          <div className="max-w-[1400px] mx-auto px-4">
            <nav className="flex items-center gap-6 h-[44px] overflow-x-auto hide-scrollbar">
              {(activeCategory?.subnav ?? []).map(sub => {
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
        <div className="p-5 bg-gray-900 text-white flex items-center justify-between sticky top-0 z-10">
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

        {/* ── Quick destinations — compact 2×2 grid ── */}
        <div className="mx-4 mt-3 mb-3 grid grid-cols-2 gap-1.5">
          <Link href="/publish" onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800 transition-colors text-center">
            <span className="text-yellow-400 text-sm">📖</span>
            <span className="text-[11px] font-black leading-tight">{lang === 'bn' ? 'বই বিক্রি করুন' : 'Sell Your Book'}</span>
          </Link>
          <Link href="/flash-deals" onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors text-center">
            <span className="text-sm">🔥</span>
            <span className="text-[11px] font-black leading-tight">{lang === 'bn' ? t.header.dealOfDay : 'Deal of the Day'}</span>
          </Link>
          <Link href="/quick-commerce" onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors text-center">
            <span className="text-sm">⚡</span>
            <span className="text-[11px] font-black leading-tight">{lang === 'bn' ? 'কুইক কমার্স' : 'Quick Commerce'}</span>
          </Link>
          <Link href="/recommerce" onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors text-center">
            <span className="text-sm">♻️</span>
            <span className="text-[11px] font-black leading-tight">{lang === 'bn' ? 'রিকমার্স' : 'Recommerce'}</span>
          </Link>
        </div>

        {/* User area */}
        <div className="px-5 py-4 bg-primary text-white flex items-center gap-4">
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

        {/* Category list — accordion with sub-menus */}
        <div className="flex flex-col py-2">
          <p className="px-5 pt-2 pb-2 text-base font-black text-gray-900 tracking-tight uppercase">{t.header.ourDepartments}</p>
          {dynamicNavCategories.map(cat => {
            const isExpanded = mobileExpandedCat === cat.slug;
            const catHref = cat.slug === 'islamic-lifestyle' ? '/islamic-lifestyle' : `/products?categorySlug=${cat.slug}`;
            const subItems = MEGA_CATEGORIES.find(m => m.href.includes(cat.slug) || m.href === catHref)?.subs ?? [];
            return (
              <div key={cat.slug} className="border-b border-gray-100">
                <div
                  className={cn(
                    'py-3.5 px-5 font-semibold text-gray-700 flex items-center gap-3 transition-colors min-h-[48px]',
                    isExpanded ? 'bg-orange-50 text-primary' : 'hover:bg-orange-50',
                    pathname === '/products' && searchParams.get('categorySlug') === cat.slug ? 'text-primary bg-accent' : '',
                  )}
                >
                  <Link
                    href={catHref}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <span className="text-primary flex-shrink-0"><cat.icon className="w-4 h-4" /></span>
                    <span className="truncate">{getCatName(cat)}</span>
                  </Link>
                  {subItems.length > 0 && (
                    <button
                      onClick={() => setMobileExpandedCat(isExpanded ? null : cat.slug)}
                      className="p-1.5 rounded-md hover:bg-gray-200 transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <ChevronDown className={cn('w-4 h-4 transition-transform duration-200 text-gray-500', isExpanded && 'rotate-180 text-primary')} />
                    </button>
                  )}
                </div>
                {/* Sub-menu accordion */}
                {isExpanded && subItems.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100">
                    {subItems.map(sub => (
                      <Link
                        key={sub.href + sub.label}
                        href={sub.href}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 py-2.5 px-8 text-[13px] text-gray-600 hover:text-primary hover:bg-orange-50 transition-colors min-h-[44px]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0" />
                        {lang === 'bn' ? sub.labelBn : sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help */}
        <div className="border-t">
          <p className="px-5 pt-4 pb-2 text-base font-black text-gray-900 tracking-tight uppercase">{t.header.helpSettings}</p>
          <Link href="/account/orders" onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2 min-h-[44px]">
            <Package className="w-4 h-4" /> {t.header.yourOrders}
          </Link>
          <Link href="/account/preorders" onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2 min-h-[44px]">
            <CalendarClock className="w-4 h-4" /> {lang === 'bn' ? 'প্রি-অর্ডার' : 'My Pre-orders'}
          </Link>
          <Link href="/seller/dashboard" onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-primary hover:text-primary/80 flex items-center gap-2 font-semibold min-h-[44px]">
            <Store className="w-4 h-4" /> {lang === 'bn' ? 'সেলার প্যানেল' : 'Seller Panel'}
          </Link>
          <Link href={isAuthenticated ? '/account/addresses' : '/login'} onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2 min-h-[44px]">
            <MapPin className="w-4 h-4" /> {t.header.deliverTo}
          </Link>
          <Link href="/support" onClick={() => setSidebarOpen(false)} className="py-2.5 px-5 text-[15px] font-medium text-gray-600 hover:text-secondary flex items-center gap-2 min-h-[44px]">
            <HelpCircle className="w-4 h-4" /> {t.header.customerService}
          </Link>
          {isAuthenticated && (
            <button
              onClick={() => { void logout.mutate(); setSidebarOpen(false); }}
              className="py-2.5 px-5 text-[15px] font-medium text-red-500 hover:text-red-700 flex items-center gap-2 w-full text-left min-h-[44px]"
            >
              <X className="w-4 h-4" /> {t.header.signOut}
            </button>
          )}
          {/* Spacer so bottom nav bar never covers the last item */}
          <div className="h-[calc(4.5rem+env(safe-area-inset-bottom,0px))]" />
        </div>
      </aside>

      {/* Account dropdown portal — renders at document.body to escape header stacking context */}
      {mounted && accountOpen && dropdownPos && createPortal(
        <div
          ref={accountPanelRef}
          role="dialog"
          aria-label="Account menu"
          style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, width: 248, zIndex: 9999 }}
          className="bg-white shadow-2xl rounded-xl border border-gray-100 overflow-hidden"
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-primary to-secondary" />

          {/* ── Not logged in: Sign In + Register ── */}
          {!isAuthenticated && (
            <div className="px-4 pt-4 pb-3">
              <button
                onClick={() => { setAccountOpen(false); router.push('/login'); }}
                className="block w-full text-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 rounded-full text-sm transition-colors"
              >
                {lang === 'bn' ? 'সাইন ইন' : 'Sign in'}
              </button>
              <div className="text-center mt-2">
                <span className="text-xs text-gray-500">{lang === 'bn' ? 'নতুন? ' : 'New? '}</span>
                <button
                  onClick={() => { setAccountOpen(false); router.push('/register'); }}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  {lang === 'bn' ? 'রেজিস্টার করুন' : 'Register'}
                </button>
              </div>
            </div>
          )}

          {/* ── Logged in: user header ── */}
          {isAuthenticated && (
            <div className="px-4 pt-3 pb-2 flex items-center gap-3 bg-gray-50">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                  {user?.firstName || user?.name ||
                    (user?.role === 'ADMIN' ? (lang === 'bn' ? 'অ্যাডমিন' : 'Admin')
                    : user?.role === 'SELLER' ? (lang === 'bn' ? 'সেলার' : 'Seller')
                    : (lang === 'bn' ? 'গ্রাহক' : 'Customer'))}
                </p>
                <button
                  onClick={() => { setAccountOpen(false); router.push('/account'); }}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  {lang === 'bn' ? 'প্রোফাইল দেখুন' : 'View profile'}
                </button>
              </div>
            </div>
          )}

          <div className="h-px bg-gray-100 mx-3 my-1" />

          {/* ── Main nav items — always shown (auth-gating handled by destination pages) ── */}
          <div className="py-1">
            {[
              { icon: Package,       label: 'My Orders',     labelBn: 'আমার অর্ডার',    href: '/account/orders' },
              { icon: CalendarClock, label: 'My Pre-orders', labelBn: 'প্রি-অর্ডার',     href: '/account/preorders' },
              { icon: Heart,         label: 'My Wishlist',   labelBn: 'উইশলিস্ট',       href: '/account/wishlist' },
              { icon: Truck,         label: 'Track Order',   labelBn: 'অর্ডার ট্র্যাক', href: '/track-order' },
              { icon: CreditCard,    label: 'Payment',       labelBn: 'পেমেন্ট',         href: '/account/payment' },
              { icon: Gift,          label: 'My Coupons',    labelBn: 'কুপন',            href: '/account/coupons' },
              { icon: Store,         label: 'Seller Panel',  labelBn: 'সেলার প্যানেল',   href: '/seller/dashboard' },
            ].map(item => (
              <button
                key={item.href}
                onClick={() => { setAccountOpen(false); router.push(item.href); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors text-left"
              >
                <item.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {lang === 'bn' ? item.labelBn : item.label}
              </button>
            ))}
          </div>

          <div className="h-px bg-gray-100 mx-3 my-1" />

          {/* ── Secondary links ── */}
          <div className="py-1 pb-2">
            {[
              { label: 'Settings',               labelBn: 'সেটিংস',              href: '/account/profile', authOnly: true },
              { label: 'Seller Login',           labelBn: 'সেলার লগইন',           href: '/seller/login',    authOnly: false },
              { label: 'Become a Seller',        labelBn: 'সেলার হিসেবে যোগ দিন', href: '/seller/register', authOnly: false },
              { label: 'Return & Refund Policy', labelBn: 'রিটার্ন ও রিফান্ড',    href: '/refund-policy',   authOnly: false },
              { label: 'Help Center',            labelBn: 'সাহায্য কেন্দ্র',      href: '/help',            authOnly: false },
              { label: 'Contact Us',             labelBn: 'যোগাযোগ করুন',         href: '/support',         authOnly: false },
            ].filter(item => !item.authOnly || isAuthenticated).map(item => (
              <button
                key={item.label}
                onClick={() => { setAccountOpen(false); router.push(item.href); }}
                className="w-full block px-4 py-2 text-xs text-gray-500 hover:text-primary hover:bg-gray-50 transition-colors text-left"
              >
                {lang === 'bn' ? item.labelBn : item.label}
              </button>
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
        </div>,
        document.body
      )}
    </>
  );
}
