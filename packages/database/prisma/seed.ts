import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const img = (slug: string, w = 400, h = 500) =>
  `https://picsum.photos/seed/${encodeURIComponent(slug)}/${w}/${h}`;

// ─── helpers ──────────────────────────────────────────────────────────────────

async function upsertCat(data: {
  slug: string; name: string; parentSlug?: string; sortOrder?: number;
  icon?: string; color?: string; isFeatured?: boolean; description?: string;
}) {
  const parent = data.parentSlug
    ? await prisma.category.findUnique({ where: { slug: data.parentSlug } })
    : null;
  return prisma.category.upsert({
    where: { slug: data.slug },
    update: { name: data.name, isFeatured: data.isFeatured ?? false },
    create: {
      slug: data.slug, name: data.name,
      description: data.description ?? '',
      icon: data.icon ?? '', color: data.color ?? '',
      sortOrder: data.sortOrder ?? 0,
      isFeatured: data.isFeatured ?? false,
      parentId: parent?.id ?? null,
    },
  });
}

async function upsertProduct(p: {
  slug: string; name: string; sku: string; catSlug: string;
  base: number; sale?: number; stock: number; featured?: boolean;
  short: string; tags?: string[];
  book?: {
    author: string; publisher: string; lang?: string;
    pages: number; isbn: string; binding?: string; genres?: string[];
  };
}) {
  const cat = await prisma.category.findUnique({ where: { slug: p.catSlug } });
  if (!cat) return;
  const i1 = img(p.slug);
  const i2 = img(p.slug + '-b');
  await prisma.product.upsert({
    where: { slug: p.slug },
    update: {
      isFeatured: p.featured ?? false, stockQuantity: p.stock,
      salePrice: p.sale ?? null,
      images: { deleteMany: {}, create: [{ url: i1, isPrimary: true, sortOrder: 0 }, { url: i2, isPrimary: false, sortOrder: 1 }] },
    },
    create: {
      name: p.name, slug: p.slug, sku: p.sku,
      basePrice: p.base, salePrice: p.sale ?? null,
      stockQuantity: p.stock, isFeatured: p.featured ?? false, isActive: true,
      shortDesc: p.short, description: p.short,
      categoryId: cat.id,
      tags: p.tags ?? [],
      images: { create: [{ url: i1, isPrimary: true, sortOrder: 0 }, { url: i2, isPrimary: false, sortOrder: 1 }] },
      ...(p.book ? {
        bookDetail: {
          create: {
            author: p.book.author, publisher: p.book.publisher,
            language: p.book.lang ?? 'Bengali', pageCount: p.book.pages,
            isbn: p.book.isbn, binding: p.book.binding ?? 'Paperback',
            genres: p.book.genres ?? [],
          },
        },
      } : {}),
    },
  });
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding UNKORA (comprehensive v2)…');

  // ══════════════════════════════════════════════════════════════
  // 1. USERS
  // ══════════════════════════════════════════════════════════════
  const [h_admin, h_cust, h_cust2, h_cust3, h_seller] = await Promise.all([
    argon2.hash('Admin@123456'),
    argon2.hash('Customer@123'),
    argon2.hash('Customer@456'),
    argon2.hash('Customer@789'),
    argon2.hash('Seller@123'),
  ]);

  await prisma.user.upsert({
    where: { email: 'admin@unkora.com' },
    update: { passwordHash: h_admin, role: 'SUPER_ADMIN', status: 'ACTIVE' },
    create: {
      email: 'admin@unkora.com', passwordHash: h_admin,
      firstName: 'UNKORA', lastName: 'Admin',
      role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerifiedAt: new Date(),
    },
  });

  const c1 = await prisma.user.upsert({
    where: { email: 'rafiq@test.com' },
    update: { passwordHash: h_cust, status: 'ACTIVE' },
    create: {
      email: 'rafiq@test.com', passwordHash: h_cust,
      firstName: 'রফিক', lastName: 'ইসলাম',
      phone: '01711000001', role: 'CUSTOMER', status: 'ACTIVE', emailVerifiedAt: new Date(),
    },
  });
  const c2 = await prisma.user.upsert({
    where: { email: 'tania@test.com' },
    update: { passwordHash: h_cust2, status: 'ACTIVE' },
    create: {
      email: 'tania@test.com', passwordHash: h_cust2,
      firstName: 'তানিয়া', lastName: 'আক্তার',
      phone: '01722000002', role: 'CUSTOMER', status: 'ACTIVE', emailVerifiedAt: new Date(),
    },
  });
  const c3 = await prisma.user.upsert({
    where: { email: 'arif@test.com' },
    update: { passwordHash: h_cust3, status: 'ACTIVE' },
    create: {
      email: 'arif@test.com', passwordHash: h_cust3,
      firstName: 'আরিফ', lastName: 'রহমান',
      phone: '01733000003', role: 'CUSTOMER', status: 'ACTIVE', emailVerifiedAt: new Date(),
    },
  });

  // Customer address
  await prisma.address.upsert({
    where: { id: 'seed-addr-1' },
    update: {},
    create: {
      id: 'seed-addr-1', userId: c1.id,
      recipientName: 'রফিক ইসলাম', phone: '01711000001',
      addressLine1: '৩২, মিরপুর রোড', city: 'Dhaka',
      district: 'Dhaka', division: 'Dhaka', postalCode: '1216', isDefault: true,
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@test.com' },
    update: { passwordHash: h_seller, status: 'ACTIVE' },
    create: {
      email: 'seller@test.com', passwordHash: h_seller,
      firstName: 'করিম', lastName: 'বুকস',
      phone: '01755000099', role: 'CUSTOMER', status: 'ACTIVE', emailVerifiedAt: new Date(),
    },
  });
  await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: { status: 'ACTIVE', isVerified: true },
    create: {
      userId: sellerUser.id, shopName: 'করিম বুকস', shopSlug: 'karim-books',
      description: 'সেরা বাংলা বইয়ের দোকান', phone: '01755000099',
      status: 'ACTIVE', isVerified: true, commissionRate: 10,
    },
  });

  console.log('✓ Users');

  // ══════════════════════════════════════════════════════════════
  // 2. CATEGORIES  (all 16 nav slugs + subcategories)
  // ══════════════════════════════════════════════════════════════

  // Main categories
  await upsertCat({ slug: 'books',            name: 'Books',              icon: '📚', color: 'bg-blue-100 text-blue-700',    sortOrder: 1,  isFeatured: true,  description: 'বাংলা ও ইংরেজি সেরা বই' });
  await upsertCat({ slug: 'islamic-lifestyle',name: 'Islamic Lifestyle',  icon: '🕌', color: 'bg-emerald-100 text-emerald-700', sortOrder: 2, isFeatured: true, description: 'ইসলামিক লাইফস্টাইল পণ্য' });
  await upsertCat({ slug: 'baby-products',    name: 'Baby Products',      icon: '👶', color: 'bg-pink-100 text-pink-700',     sortOrder: 3,  isFeatured: true,  description: 'শিশু সামগ্রী ও পণ্য' });
  await upsertCat({ slug: 'leather-products', name: 'Leather Products',   icon: '👜', color: 'bg-amber-100 text-amber-700',   sortOrder: 4,  isFeatured: false, description: 'প্রিমিয়াম চামড়ার পণ্য' });
  await upsertCat({ slug: 'organic-foods',    name: 'Organic Foods',      icon: '🌿', color: 'bg-green-100 text-green-700',   sortOrder: 5,  isFeatured: true,  description: 'প্রাকৃতিক ও জৈব পণ্য' });
  await upsertCat({ slug: 'handicrafts',      name: 'Handicrafts',        icon: '🎨', color: 'bg-purple-100 text-purple-700', sortOrder: 6,  isFeatured: true,  description: 'হস্তশিল্প ও কারুপণ্য' });
  await upsertCat({ slug: 'electronics',      name: 'Electronics',        icon: '⚡', color: 'bg-cyan-100 text-cyan-700',     sortOrder: 7,  isFeatured: true,  description: 'ইলেকট্রনিক্স ও গ্যাজেট' });
  await upsertCat({ slug: 'daily-needs',      name: 'Daily Needs',        icon: '🛒', color: 'bg-orange-100 text-orange-700', sortOrder: 8,  isFeatured: true,  description: 'দৈনন্দিন প্রয়োজনীয় পণ্য' });
  await upsertCat({ slug: 'health-sports',    name: 'Health & Sports',    icon: '🏋️', color: 'bg-red-100 text-red-700',       sortOrder: 9,  isFeatured: false, description: 'স্বাস্থ্য ও ক্রীড়া সামগ্রী' });
  await upsertCat({ slug: 'fashion-lifestyle',name: 'Fashion & Lifestyle', icon: '👗', color: 'bg-rose-100 text-rose-700',    sortOrder: 10, isFeatured: true,  description: 'ফ্যাশন ও লাইফস্টাইল' });
  await upsertCat({ slug: 'home-furniture',   name: 'Home & Furniture',   icon: '🏠', color: 'bg-yellow-100 text-yellow-700', sortOrder: 11, isFeatured: true,  description: 'হোম ডেকোর ও ফার্নিচার' });
  await upsertCat({ slug: 'automotive',       name: 'Automotive',         icon: '🚗', color: 'bg-slate-100 text-slate-700',   sortOrder: 12, isFeatured: false, description: 'গাড়ি ও বাইক আনুষাঙ্গিক' });
  await upsertCat({ slug: 'agriculture',      name: 'Agriculture',        icon: '🌾', color: 'bg-lime-100 text-lime-700',     sortOrder: 13, isFeatured: false, description: 'কৃষি সামগ্রী ও বীজ' });
  await upsertCat({ slug: 'toys-gaming',      name: 'Toys & Gaming',      icon: '🎮', color: 'bg-violet-100 text-violet-700', sortOrder: 14, isFeatured: false, description: 'খেলনা ও গেমিং' });
  await upsertCat({ slug: 'travel-bags',      name: 'Travel & Bags',      icon: '🧳', color: 'bg-sky-100 text-sky-700',       sortOrder: 15, isFeatured: false, description: 'ট্র্যাভেল ও ব্যাগ' });
  await upsertCat({ slug: 'eco-friendly',     name: 'Eco Friendly',       icon: '🌱', color: 'bg-teal-100 text-teal-700',     sortOrder: 16, isFeatured: false, description: 'পরিবেশবান্ধব পণ্য' });

  // Sub-categories — Books
  for (const [slug, name, order] of [
    ['fiction',         'Fiction',            1],
    ['islamic-books',   'Islamic Books',      2],
    ['academic',        'Academic Books',     3],
    ['self-help',       'Self-Help',          4],
    ['childrens-books', "Children's Books",   5],
    ['non-fiction',     'Non-Fiction',        6],
    ['e-books',         'E-Books',            7],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'books', sortOrder: order });
  }

  // Sub-categories — Islamic Lifestyle
  for (const [slug, name, order] of [
    ['prayer-essentials',       'Prayer Essentials',         1],
    ['quran-accessories',       'Quran Accessories',         2],
    ['islamic-clothing',        'Islamic Clothing',          3],
    ['perfumes-oud',            'Perfumes & Oud',            4],
    ['tasbih-decor',            'Tasbih & Decor',            5],
    ['islamic-books-lifestyle', 'Islamic Books (Lifestyle)', 6],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'islamic-lifestyle', sortOrder: order });
  }

  // Sub-categories — Baby Products
  for (const [slug, name, order] of [
    ['diapering-care',   'Diapering & Care',  1],
    ['feeding-nursing',  'Feeding & Nursing', 2],
    ['baby-gear',        'Baby Gear',         3],
    ['baby-toys-games',  'Toys & Games',      4],
    ['baby-clothing',    'Baby Clothing',     5],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'baby-products', sortOrder: order });
  }

  // Sub-categories — Leather Products
  for (const [slug, name, order] of [
    ['wallets-cards',      'Wallets & Cards',       1],
    ['bags-backpacks',     'Bags & Backpacks',      2],
    ['belts-accessories',  'Belts & Accessories',   3],
    ['mens-footwear',      "Men's Footwear",        4],
    ['womens-footwear',    "Women's Footwear",      5],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'leather-products', sortOrder: order });
  }

  // Sub-categories — Organic Foods
  for (const [slug, name, order] of [
    ['nuts-seeds',       'Nuts & Seeds',       1],
    ['honey-sweeteners', 'Honey & Sweeteners', 2],
    ['spices-herbs',     'Spices & Herbs',     3],
    ['healthy-snacks',   'Healthy Snacks',     4],
    ['tea-beverages',    'Tea & Beverages',    5],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'organic-foods', sortOrder: order });
  }

  // Sub-categories — Handicrafts
  for (const [slug, name, order] of [
    ['wall-art',         'Wall Art',         1],
    ['showpieces',       'Showpieces',       2],
    ['lamps-lighting',   'Lamps & Lighting', 3],
    ['rugs-carpets',     'Rugs & Carpets',   4],
    ['traditional-crafts','Traditional Crafts',5],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'handicrafts', sortOrder: order });
  }

  // Sub-categories — Electronics
  for (const [slug, name, order] of [
    ['mobiles',          'Mobiles',          1],
    ['laptops',          'Laptops',          2],
    ['elec-accessories', 'Accessories',      3],
    ['home-appliances',  'Home Appliances',  4],
    ['gadgets',          'Gadgets',          5],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'electronics', sortOrder: order });
  }

  // Sub-categories — Daily Needs
  for (const [slug, name, order] of [
    ['grocery',       'Grocery',       1],
    ['personal-care', 'Personal Care', 2],
    ['household',     'Household',     3],
    ['stationery',    'Stationery',    4],
    ['pet-care',      'Pet Care',      5],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'daily-needs', sortOrder: order });
  }

  // Sub-categories — Health & Sports
  for (const [slug, name, order] of [
    ['fitness-equipment', 'Fitness Equipment', 1],
    ['sports',            'Sports',            2],
    ['supplements',       'Supplements',       3],
    ['sportswear',        'Sportswear',        4],
    ['health-monitors',   'Health Monitors',   5],
    ['yoga-wellness',     'Yoga & Wellness',   6],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'health-sports', sortOrder: order });
  }

  // Sub-categories — Fashion & Lifestyle
  for (const [slug, name, order] of [
    ['mens-fashion',    "Men's Fashion",    1],
    ['womens-fashion',  "Women's Fashion",  2],
    ['footwear',        'Footwear',         3],
    ['fashion-accessories','Accessories',   4],
    ['beauty-grooming', 'Beauty & Grooming',5],
    ['kids-fashion',    'Kids Fashion',     6],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'fashion-lifestyle', sortOrder: order });
  }

  // Sub-categories — Home & Furniture
  for (const [slug, name, order] of [
    ['furniture',       'Furniture',          1],
    ['home-decor',      'Home Decor',         2],
    ['bedding-curtains','Bedding & Curtains',  3],
    ['kitchen-dining',  'Kitchen & Dining',   4],
    ['home-lighting',   'Lighting',           5],
    ['cleaning-tools',  'Cleaning & Tools',   6],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'home-furniture', sortOrder: order });
  }

  // Sub-categories — Automotive
  for (const [slug, name, order] of [
    ['car-accessories',    'Car Accessories',        1],
    ['bike-motorcycle',    'Bike & Motorcycle',      2],
    ['helmets',            'Helmets',                3],
    ['auto-tools',         'Tools & Equipment',      4],
    ['car-care',           'Car Care',               5],
    ['nav-electronics',    'Navigation & Electronics',6],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'automotive', sortOrder: order });
  }

  // Sub-categories — Agriculture
  for (const [slug, name, order] of [
    ['seeds-plants',    'Seeds & Plants',   1],
    ['fertilizers',     'Fertilizers',      2],
    ['farming-tools',   'Farming Tools',    3],
    ['irrigation',      'Irrigation',       4],
    ['organic-farming', 'Organic Farming',  5],
    ['livestock',       'Livestock',        6],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'agriculture', sortOrder: order });
  }

  // Sub-categories — Toys & Gaming
  for (const [slug, name, order] of [
    ['action-figures',       'Action Figures',          1],
    ['board-games',          'Board Games',             2],
    ['video-games',          'Video Games',             3],
    ['consoles-accessories', 'Consoles & Accessories',  4],
    ['outdoor-toys',         'Outdoor Toys',            5],
    ['educational-toys',     'Educational Toys',        6],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'toys-gaming', sortOrder: order });
  }

  // Sub-categories — Travel & Bags
  for (const [slug, name, order] of [
    ['luggage-trolleys',  'Luggage & Trolleys', 1],
    ['travel-accessories','Travel Accessories', 2],
    ['backpacks',         'Backpacks',          3],
    ['laptop-bags',       'Laptop Bags',        4],
    ['ladies-bags',       'Ladies Bags',        5],
    ['travel-pillows',    'Travel Pillows',     6],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'travel-bags', sortOrder: order });
  }

  // Sub-categories — Eco Friendly
  for (const [slug, name, order] of [
    ['natural-skincare',    'Natural Skincare',     1],
    ['bamboo-products',     'Bamboo Products',      2],
    ['eco-stationery',      'Eco Stationery',       3],
    ['herbal-products',     'Herbal Products',      4],
    ['sustainable-fashion', 'Sustainable Fashion',  5],
  ] as [string, string, number][]) {
    await upsertCat({ slug, name, parentSlug: 'eco-friendly', sortOrder: order });
  }

  console.log('✓ Categories (16 main + subcategories)');

  // ══════════════════════════════════════════════════════════════
  // 3. PRODUCTS
  // ══════════════════════════════════════════════════════════════

  // ── BOOKS — Fiction ────────────────────────────────────────────
  await upsertProduct({ slug: 'himur-dwitiy-prohor', name: 'হিমুর দ্বিতীয় প্রহর', sku: 'BK-F01', catSlug: 'fiction', base: 280, sale: 240, stock: 42, featured: true, short: 'হুমায়ূন আহমেদের জনপ্রিয় হিমু সিরিজ।', book: { author: 'হুমায়ূন আহমেদ', publisher: 'অন্যপ্রকাশ', pages: 224, isbn: '9789841000001', genres: ['Fiction'] } });
  await upsertProduct({ slug: 'padma-nadir-majhi', name: 'পদ্মা নদীর মাঝি', sku: 'BK-F02', catSlug: 'fiction', base: 320, sale: 275, stock: 45, featured: true, short: 'মানিক বন্দ্যোপাধ্যায়ের কালজয়ী উপন্যাস।', book: { author: 'মানিক বন্দ্যোপাধ্যায়', publisher: 'আনন্দ পাবলিশার্স', pages: 224, isbn: '9789841000002', binding: 'Hardcover', genres: ['Fiction'] } });
  await upsertProduct({ slug: 'devdas', name: 'দেবদাস', sku: 'BK-F03', catSlug: 'fiction', base: 250, stock: 38, featured: false, short: 'শরৎচন্দ্রের অমর প্রেমের উপন্যাস।', book: { author: 'শরৎচন্দ্র চট্টোপাধ্যায়', publisher: 'বিশ্বসাহিত্য কেন্দ্র', pages: 192, isbn: '9789841000003', genres: ['Fiction'] } });
  await upsertProduct({ slug: 'se-rate-purnima-chilo', name: 'সে রাতে পূর্ণিমা ছিল', sku: 'BK-F04', catSlug: 'fiction', base: 260, stock: 55, featured: true, short: 'হুমায়ূন আহমেদের রহস্যময় উপন্যাস।', book: { author: 'হুমায়ূন আহমেদ', publisher: 'অন্যপ্রকাশ', pages: 176, isbn: '9789841000005', genres: ['Fiction'] } });
  await upsertProduct({ slug: 'sapiens-yuval', name: 'Sapiens', sku: 'BK-F05', catSlug: 'non-fiction', base: 580, sale: 499, stock: 22, featured: true, short: 'Yuval Noah Harari-এর বিশ্বখ্যাত মানব ইতিহাসের বই।', book: { author: 'Yuval Noah Harari', publisher: 'Harper Collins', lang: 'English', pages: 443, isbn: '9780062316097', genres: ['Non-Fiction', 'History'] } });
  await upsertProduct({ slug: 'bangladesher-itihas', name: 'বাংলাদেশের ইতিহাস', sku: 'BK-NF01', catSlug: 'non-fiction', base: 580, stock: 25, featured: false, short: 'প্রাচীনকাল থেকে আজ পর্যন্ত বাংলাদেশের পূর্ণাঙ্গ ইতিহাস।', book: { author: 'ড. সিরাজুল ইসলাম', publisher: 'এশিয়াটিক সোসাইটি', pages: 640, isbn: '9789841000027', binding: 'Hardcover', genres: ['Non-Fiction', 'History'] } });
  await upsertProduct({ slug: 'mukti-juddher-golpo', name: 'মুক্তিযুদ্ধের গল্প', sku: 'BK-NF02', catSlug: 'non-fiction', base: 360, stock: 35, featured: true, short: '১৯৭১ সালের অজানা বীরত্বগাঁথা।', book: { author: 'শাহরিয়ার কবির', publisher: 'প্রথমা প্রকাশন', pages: 256, isbn: '9789841000028', genres: ['Non-Fiction', 'History'] } });

  // ── BOOKS — Islamic ────────────────────────────────────────────
  await upsertProduct({ slug: 'nabi-jiboni', name: 'নবী জীবনী', sku: 'BK-IS01', catSlug: 'islamic-books', base: 450, sale: 380, stock: 60, featured: true, short: 'মহানবী (সা.)-এর সম্পূর্ণ জীবনী।', book: { author: 'ড. আলী মুহাম্মদ সাল্লাবী', publisher: 'দারুল কিতাব', pages: 580, isbn: '9789841000008', binding: 'Hardcover', genres: ['Islamic'] } });
  await upsertProduct({ slug: 'paradoxical-sajid', name: 'প্যারাডক্সিক্যাল সাজিদ', sku: 'BK-IS02', catSlug: 'islamic-books', base: 280, sale: 240, stock: 75, featured: true, short: 'আরিফ আজাদের যুক্তিনির্ভর ইসলামিক বই।', book: { author: 'আরিফ আজাদ', publisher: 'গার্ডিয়ান পাবলিকেশনস', pages: 216, isbn: '9789841000011', genres: ['Islamic'] } });
  await upsertProduct({ slug: 'bela-furabar-age', name: 'বেলা ফুরাবার আগে', sku: 'BK-IS03', catSlug: 'islamic-books', base: 300, sale: 260, stock: 48, featured: true, short: 'আরিফ আজাদের অনুপ্রেরণামূলক গল্পগ্রন্থ।', book: { author: 'আরিফ আজাদ', publisher: 'গার্ডিয়ান পাবলিকেশনস', pages: 240, isbn: '9789841000010', genres: ['Islamic'] } });
  await upsertProduct({ slug: 'riyadus-salehin', name: 'রিয়াদুস সালেহীন', sku: 'BK-IS04', catSlug: 'islamic-books', base: 520, sale: 450, stock: 55, featured: false, short: 'ইমাম নববীর বিখ্যাত হাদীস সংকলন।', book: { author: 'ইমাম নববী', publisher: 'ইসলামিক ফাউন্ডেশন', pages: 820, isbn: '9789841000009', binding: 'Hardcover', genres: ['Islamic'] } });
  await upsertProduct({ slug: 'jannat-er-pathe', name: 'জান্নাতের পথে', sku: 'BK-IS05', catSlug: 'islamic-books', base: 320, sale: 280, stock: 35, featured: false, short: 'মিজানুর রহমান আজহারীর অনুপ্রেরণামূলক বই।', book: { author: 'মিজানুর রহমান আজহারী', publisher: 'আলোর পথ', pages: 280, isbn: '9789841000013', genres: ['Islamic'] } });

  // ── BOOKS — Academic ──────────────────────────────────────────
  await upsertProduct({ slug: 'hsc-physics-1st', name: 'HSC Physics 1st Paper', sku: 'BK-AC01', catSlug: 'academic', base: 380, sale: 320, stock: 65, featured: true, short: 'HSC পদার্থবিজ্ঞান ১ম পত্র সম্পূর্ণ গাইড।', book: { author: 'ড. শাহজাহান তপন', publisher: 'হাসান বুক হাউস', pages: 480, isbn: '9789841000014', genres: ['Academic'] } });
  await upsertProduct({ slug: 'bcs-preli-guide', name: 'BCS Preli Guide', sku: 'BK-AC02', catSlug: 'academic', base: 550, sale: 480, stock: 80, featured: true, short: 'BCS প্রিলিমিনারি পরীক্ষার সম্পূর্ণ গাইড।', book: { author: "Professor's", publisher: "Professor's Publications", pages: 650, isbn: '9789841000015', genres: ['Academic'] } });
  await upsertProduct({ slug: 'bank-job-prep', name: 'Bank Job Preparation', sku: 'BK-AC03', catSlug: 'academic', base: 420, sale: 360, stock: 52, featured: true, short: 'ব্যাংক জব প্রস্তুতির সম্পূর্ণ গাইড।', book: { author: 'আসাদুজ্জামান', publisher: 'অ্যাসুরেন্স পাবলিকেশন', pages: 520, isbn: '9789841000016', genres: ['Academic'] } });
  await upsertProduct({ slug: 'du-admission-guide', name: 'DU Admission Guide', sku: 'BK-AC04', catSlug: 'academic', base: 350, sale: 300, stock: 45, featured: false, short: 'ঢাকা বিশ্ববিদ্যালয় ভর্তি পরীক্ষার গাইড।', book: { author: 'শিক্ষার্থী পরিবার', publisher: 'শিক্ষার্থী পরিবার প্রকাশনী', pages: 580, isbn: '9789841000017', genres: ['Academic'] } });

  // ── BOOKS — Self-Help ─────────────────────────────────────────
  await upsertProduct({ slug: 'atomic-habits', name: 'Atomic Habits', sku: 'BK-SH01', catSlug: 'self-help', base: 550, sale: 480, stock: 25, featured: true, short: 'James Clear-এর বিশ্বখ্যাত অভ্যাস পরিবর্তনের বই।', book: { author: 'James Clear', publisher: 'Penguin Random House', lang: 'English', pages: 320, isbn: '9780593189236', genres: ['Self-Help'] } });
  await upsertProduct({ slug: 'psychology-of-money', name: 'The Psychology of Money', sku: 'BK-SH02', catSlug: 'self-help', base: 480, sale: 420, stock: 20, featured: true, short: 'Morgan Housel-এর অর্থ ও মানসিকতার বই।', book: { author: 'Morgan Housel', publisher: 'Harriman House', lang: 'English', pages: 256, isbn: '9780857197765', genres: ['Self-Help'] } });
  await upsertProduct({ slug: 'deep-work', name: 'Deep Work', sku: 'BK-SH03', catSlug: 'self-help', base: 420, stock: 18, featured: true, short: 'Cal Newport-এর Focus ও Productivity বই।', book: { author: 'Cal Newport', publisher: 'Grand Central Publishing', lang: 'English', pages: 296, isbn: '9781455586691', genres: ['Self-Help'] } });
  await upsertProduct({ slug: 'ikigai-book', name: 'Ikigai', sku: 'BK-SH04', catSlug: 'self-help', base: 390, sale: 340, stock: 33, featured: true, short: 'জাপানিদের দীর্ঘ সুখী জীবনের রহস্য।', book: { author: 'Héctor García', publisher: 'Penguin Books', lang: 'English', pages: 208, isbn: '9780143130727', genres: ['Self-Help'] } });
  await upsertProduct({ slug: 'quantum-method', name: 'Quantum Method', sku: 'BK-SH05', catSlug: 'self-help', base: 360, sale: 310, stock: 44, featured: true, short: 'কোয়ান্টাম মেথড — মানসিক শক্তি ও সাফল্যের পথ।', book: { author: 'মহাজাতক', publisher: 'কোয়ান্টাম ফাউন্ডেশন', pages: 320, isbn: '9789841000024', genres: ['Self-Help'] } });

  // ── BOOKS — Children's ────────────────────────────────────────
  await upsertProduct({ slug: 'thakurmar-jhuli', name: 'ঠাকুরমার ঝুলি', sku: 'BK-CH01', catSlug: 'childrens-books', base: 240, sale: 200, stock: 70, featured: false, short: 'দক্ষিণারঞ্জনের কালজয়ী রূপকথার গল্প।', book: { author: 'দক্ষিণারঞ্জন মিত্র', publisher: 'বিশ্বসাহিত্য কেন্দ্র', pages: 288, isbn: '9789841000025', binding: 'Hardcover', genres: ["Children's"] } });
  await upsertProduct({ slug: 'chotoder-quiz', name: 'ছোটদের কুইজ ও ধাঁধা', sku: 'BK-CH02', catSlug: 'childrens-books', base: 180, stock: 80, featured: false, short: 'শিশুদের মেধা বিকাশে মজার কুইজ ও ধাঁধা।', book: { author: 'রোকনুজ্জামান খান', publisher: 'শিশু একাডেমি', pages: 128, isbn: '9789841000026', binding: 'Hardcover', genres: ["Children's"] } });

  console.log('✓ Books (22)');

  // ── ISLAMIC LIFESTYLE ─────────────────────────────────────────
  await upsertProduct({ slug: 'jaynamaz-premium', name: 'প্রিমিয়াম জায়নামাজ', sku: 'IL-01', catSlug: 'prayer-essentials', base: 650, sale: 550, stock: 40, featured: true, short: 'উচ্চমানের তুর্কি জায়নামাজ — নরম ও টেকসই।', tags: ['jaynamaz', 'prayer-mat', 'islamic'] });
  await upsertProduct({ slug: 'quran-majeed-tajweed', name: 'কুরআন মাজীদ (তাজউইদ)', sku: 'IL-02', catSlug: 'quran-accessories', base: 850, sale: 720, stock: 35, featured: true, short: 'রঙিন তাজউইদ চিহ্নসহ পূর্ণ কুরআন মাজীদ।', tags: ['quran', 'tajweed', 'islamic'] });
  await upsertProduct({ slug: 'attar-oud-arabic', name: 'আরবি আতর — ওউদ', sku: 'IL-03', catSlug: 'perfumes-oud', base: 1200, sale: 980, stock: 25, featured: true, short: 'সৌদি আরব থেকে আনা খাঁটি ওউদ আতর।', tags: ['attar', 'oud', 'perfume', 'islamic'] });
  await upsertProduct({ slug: 'hijab-set-cotton', name: 'কটন হিজাব সেট', sku: 'IL-04', catSlug: 'islamic-clothing', base: 480, sale: 390, stock: 60, featured: false, short: 'আরামদায়ক সুতি কাপড়ের হিজাব সেট।', tags: ['hijab', 'islamic-clothing', 'cotton'] });
  await upsertProduct({ slug: 'tasbeeh-crystal', name: 'ক্রিস্টাল তাসবিহ', sku: 'IL-05', catSlug: 'tasbih-decor', base: 350, sale: 290, stock: 50, featured: false, short: 'উচ্চমানের ক্রিস্টাল পুঁতির ৯৯ দানার তাসবিহ।', tags: ['tasbeeh', 'crystal', 'islamic'] });
  await upsertProduct({ slug: 'kaba-wall-art', name: 'কাবা শরীফ ক্যানভাস', sku: 'IL-06', catSlug: 'tasbih-decor', base: 1500, sale: 1200, stock: 20, featured: true, short: 'কাবা শরীফের HD ক্যানভাস প্রিন্ট — রুমের সৌন্দর্য বাড়ান।', tags: ['wall-art', 'canvas', 'kaaba', 'islamic'] });
  await upsertProduct({ slug: 'panjabi-eid-white', name: 'ঈদ পাঞ্জাবি — সাদা', sku: 'IL-07', catSlug: 'islamic-clothing', base: 950, sale: 799, stock: 45, featured: true, short: 'ঈদের জন্য প্রিমিয়াম সাদা পাঞ্জাবি।', tags: ['panjabi', 'eid', 'islamic-clothing'] });

  console.log('✓ Islamic Lifestyle (7)');

  // ── BABY PRODUCTS ─────────────────────────────────────────────
  await upsertProduct({ slug: 'baby-teddy-bear', name: 'সফট টেডি বেয়ার', sku: 'BB-01', catSlug: 'baby-toys-games', base: 750, sale: 620, stock: 40, featured: true, short: 'নিরাপদ ও মোলায়েম BPA-free টেডি বেয়ার।', tags: ['baby', 'toy', 'soft-toy'] });
  await upsertProduct({ slug: 'baby-mosquito-net', name: 'শিশু মশারি', sku: 'BB-02', catSlug: 'baby-gear', base: 420, stock: 45, featured: false, short: 'শিশুর নিরাপদ ঘুমের জন্য মশামুক্ত মশারি।', tags: ['baby', 'mosquito-net'] });
  await upsertProduct({ slug: 'baby-diaper-pants-xl', name: 'Baby Diaper Pants XL (40pcs)', sku: 'BB-03', catSlug: 'diapering-care', base: 890, sale: 750, stock: 85, featured: true, short: 'উচ্চ শোষণ ক্ষমতার XL ডায়াপার প্যান্ট।', tags: ['diaper', 'baby', 'care'] });
  await upsertProduct({ slug: 'baby-feeding-bottle', name: 'Anti-Colic ফিডিং বোতল', sku: 'BB-04', catSlug: 'feeding-nursing', base: 580, sale: 480, stock: 55, featured: false, short: 'বায়ুরোধী ভালভ সহ BPA-free ফিডিং বোতল।', tags: ['feeding-bottle', 'baby', 'nursing'] });
  await upsertProduct({ slug: 'baby-blanket-soft', name: 'অর্গানিক কটন বেবি ব্লাংকেট', sku: 'BB-05', catSlug: 'baby-clothing', base: 680, sale: 580, stock: 30, featured: false, short: 'অর্গানিক সুতির নরম শিশু কম্বল।', tags: ['baby', 'blanket', 'cotton'] });
  await upsertProduct({ slug: 'baby-stroller', name: 'Baby Stroller/Pram', sku: 'BB-06', catSlug: 'baby-gear', base: 8500, sale: 7200, stock: 12, featured: true, short: 'হালকা ওজনের ফোল্ডেবল বেবি স্ট্রোলার।', tags: ['stroller', 'pram', 'baby-gear'] });
  await upsertProduct({ slug: 'baby-walker', name: 'বেবি ওয়াকার', sku: 'BB-07', catSlug: 'baby-gear', base: 2200, sale: 1800, stock: 18, featured: false, short: 'অ্যাডজাস্টেবল বেবি ওয়াকার — মিউজিক সহ।', tags: ['walker', 'baby', 'gear'] });

  console.log('✓ Baby Products (7)');

  // ── LEATHER PRODUCTS ──────────────────────────────────────────
  await upsertProduct({ slug: 'leather-ladies-handbag', name: 'চামড়ার লেডিস হ্যান্ডব্যাগ', sku: 'LT-01', catSlug: 'bags-backpacks', base: 2800, sale: 2400, stock: 15, featured: true, short: 'নরসিংদীর খাঁটি চামড়ায় তৈরি হ্যান্ডব্যাগ।', tags: ['leather', 'handbag', 'ladies'] });
  await upsertProduct({ slug: 'leather-mens-wallet', name: 'চামড়ার জেন্টস পার্স', sku: 'LT-02', catSlug: 'wallets-cards', base: 950, sale: 820, stock: 30, featured: true, short: 'আসল চামড়ার স্লিম ডিজাইনের পার্স।', tags: ['leather', 'wallet', 'mens'] });
  await upsertProduct({ slug: 'leather-belt-mens', name: 'চামড়ার বেল্ট — জেন্টস', sku: 'LT-03', catSlug: 'belts-accessories', base: 680, sale: 580, stock: 35, featured: false, short: 'খাঁটি চামড়ার টেকসই পুরুষ বেল্ট।', tags: ['leather', 'belt', 'mens'] });
  await upsertProduct({ slug: 'leather-laptop-bag', name: 'চামড়ার ল্যাপটপ ব্যাগ', sku: 'LT-04', catSlug: 'bags-backpacks', base: 3500, sale: 2999, stock: 10, featured: true, short: '15.6 ইঞ্চি ল্যাপটপ ধারণ ক্ষমতার চামড়ার ব্যাগ।', tags: ['leather', 'laptop-bag'] });
  await upsertProduct({ slug: 'leather-sandal-mens', name: 'চামড়ার স্যান্ডেল — পুরুষ', sku: 'LT-05', catSlug: 'mens-footwear', base: 1200, sale: 980, stock: 25, featured: false, short: 'হাতে তৈরি খাঁটি চামড়ার স্যান্ডেল।', tags: ['leather', 'sandal', 'footwear'] });
  await upsertProduct({ slug: 'leather-card-holder', name: 'চামড়ার কার্ড হোল্ডার', sku: 'LT-06', catSlug: 'wallets-cards', base: 450, sale: 380, stock: 50, featured: false, short: 'পাতলা ও মজবুত চামড়ার ব্যবসায়িক কার্ড হোল্ডার।', tags: ['leather', 'card-holder'] });

  console.log('✓ Leather Products (6)');

  // ── ORGANIC FOODS ─────────────────────────────────────────────
  await upsertProduct({ slug: 'organic-honey-sundarban', name: 'সুন্দরবনের খাঁটি মধু', sku: 'OF-01', catSlug: 'honey-sweeteners', base: 650, sale: 580, stock: 50, featured: true, short: '১০০% প্রাকৃতিক সুন্দরবনের ফুলের মধু।', tags: ['honey', 'organic', 'sundarban'] });
  await upsertProduct({ slug: 'organic-turmeric-powder', name: 'অর্গানিক হলুদ গুঁড়া', sku: 'OF-02', catSlug: 'spices-herbs', base: 220, sale: 190, stock: 80, featured: true, short: 'কীটনাশকমুক্ত খাঁটি হলুদ গুঁড়া।', tags: ['turmeric', 'organic', 'spice'] });
  await upsertProduct({ slug: 'cold-pressed-coconut-oil', name: 'কোল্ড প্রেসড নারিকেল তেল', sku: 'OF-03', catSlug: 'healthy-snacks', base: 480, stock: 35, featured: false, short: 'ঐতিহ্যবাহী পদ্ধতিতে তৈরি খাঁটি নারিকেল তেল।', tags: ['coconut-oil', 'organic'] });
  await upsertProduct({ slug: 'organic-black-seed', name: 'খাঁটি কালিজিরা', sku: 'OF-04', catSlug: 'nuts-seeds', base: 180, sale: 150, stock: 65, featured: true, short: '১০০% প্রাকৃতিক কালিজিরা।', tags: ['black-seed', 'organic', 'natural'] });
  await upsertProduct({ slug: 'pure-mustard-oil', name: 'খাঁটি সরিষার তেল', sku: 'OF-05', catSlug: 'spices-herbs', base: 320, sale: 280, stock: 45, featured: false, short: 'ঘানি ভাঙা খাঁটি সরিষার তেল।', tags: ['mustard-oil', 'organic'] });
  await upsertProduct({ slug: 'green-tea-darjeeling', name: 'দার্জিলিং গ্রিন টি', sku: 'OF-06', catSlug: 'tea-beverages', base: 450, sale: 380, stock: 40, featured: false, short: 'অ্যান্টিঅক্সিডেন্টসমৃদ্ধ দার্জিলিং গ্রিন টি।', tags: ['green-tea', 'organic', 'tea'] });
  await upsertProduct({ slug: 'mixed-nuts-trail', name: 'মিক্সড নাটস ট্রেইল', sku: 'OF-07', catSlug: 'nuts-seeds', base: 580, sale: 499, stock: 30, featured: true, short: 'আখরোট, কাজু, আমন্ড ও পেস্তার মিশ্রণ।', tags: ['nuts', 'healthy-snacks', 'organic'] });
  await upsertProduct({ slug: 'moringa-powder', name: 'মরিঙ্গা পাউডার', sku: 'OF-08', catSlug: 'healthy-snacks', base: 380, sale: 320, stock: 28, featured: false, short: 'সজনে পাতার পুষ্টিকর মরিঙ্গা পাউডার।', tags: ['moringa', 'organic', 'superfood'] });

  console.log('✓ Organic Foods (8)');

  // ── HANDICRAFTS ───────────────────────────────────────────────
  await upsertProduct({ slug: 'nakshi-kantha-large', name: 'নকশিকাঁথা — বড়', sku: 'HC-01', catSlug: 'traditional-crafts', base: 1800, sale: 1500, stock: 12, featured: true, short: 'হাতে সেলাই করা ঐতিহ্যবাহী নকশিকাঁথা।', tags: ['nakshi-kantha', 'handicraft', 'traditional'] });
  await upsertProduct({ slug: 'terracotta-vase', name: 'টেরাকোটা ফুলদানি', sku: 'HC-02', catSlug: 'showpieces', base: 680, sale: 580, stock: 20, featured: true, short: 'হাতে তৈরি দেশীয় টেরাকোটার ফুলদানি।', tags: ['terracotta', 'vase', 'handicraft'] });
  await upsertProduct({ slug: 'bamboo-lamp-shade', name: 'বাঁশের ল্যাম্পশেড', sku: 'HC-03', catSlug: 'lamps-lighting', base: 1200, sale: 980, stock: 15, featured: false, short: 'পরিবেশবান্ধব বাঁশের তৈরি ল্যাম্পশেড।', tags: ['bamboo', 'lamp', 'eco'] });
  await upsertProduct({ slug: 'jute-rug-handmade', name: 'হাতে বোনা পাটের রাগ', sku: 'HC-04', catSlug: 'rugs-carpets', base: 1500, sale: 1250, stock: 10, featured: true, short: 'প্রাকৃতিক পাট থেকে হাতে বোনা রাগ।', tags: ['jute', 'rug', 'handmade'] });
  await upsertProduct({ slug: 'rickshaw-art-canvas', name: 'রিকশা আর্ট ক্যানভাস', sku: 'HC-05', catSlug: 'wall-art', base: 950, sale: 780, stock: 18, featured: true, short: 'বাংলাদেশের ঐতিহ্যবাহী রিকশা আর্ট।', tags: ['rickshaw-art', 'canvas', 'wall-art'] });
  await upsertProduct({ slug: 'brass-showpiece', name: 'পিতলের শোপিস — ময়ূর', sku: 'HC-06', catSlug: 'showpieces', base: 850, sale: 720, stock: 22, featured: false, short: 'হাতে তৈরি পিতলের ময়ূর শোপিস।', tags: ['brass', 'showpiece', 'handicraft'] });

  console.log('✓ Handicrafts (6)');

  // ── ELECTRONICS ───────────────────────────────────────────────
  await upsertProduct({ slug: 'earbuds-wireless-tws', name: 'TWS Wireless Earbuds', sku: 'EL-01', catSlug: 'gadgets', base: 1800, sale: 1499, stock: 45, featured: true, short: 'Active Noise Cancellation সহ ওয়্যারলেস ইয়ারবাড।', tags: ['earbuds', 'wireless', 'electronics'] });
  await upsertProduct({ slug: 'power-bank-20000', name: 'Power Bank 20000mAh', sku: 'EL-02', catSlug: 'elec-accessories', base: 2200, sale: 1899, stock: 35, featured: true, short: '20000mAh দ্রুত চার্জিং পাওয়ার ব্যাংক।', tags: ['power-bank', 'accessories'] });
  await upsertProduct({ slug: 'smart-watch-fitness', name: 'Smart Watch Fitness Band', sku: 'EL-03', catSlug: 'gadgets', base: 3500, sale: 2999, stock: 28, featured: true, short: 'হার্টরেট ও SpO2 মনিটর সহ স্মার্ট ওয়াচ।', tags: ['smart-watch', 'fitness', 'electronics'] });
  await upsertProduct({ slug: 'usb-c-cable-braided', name: 'ব্রেইডেড USB-C কেবল (3m)', sku: 'EL-04', catSlug: 'elec-accessories', base: 380, sale: 299, stock: 100, featured: false, short: 'টেকসই নাইলন ব্রেইডেড USB-C চার্জিং কেবল।', tags: ['cable', 'usb-c', 'accessories'] });
  await upsertProduct({ slug: 'portable-bluetooth-speaker', name: 'পোর্টেবল ব্লুটুথ স্পিকার', sku: 'EL-05', catSlug: 'gadgets', base: 2800, sale: 2399, stock: 22, featured: false, short: 'ওয়াটারপ্রুফ পোর্টেবল ব্লুটুথ স্পিকার।', tags: ['speaker', 'bluetooth', 'portable'] });
  await upsertProduct({ slug: 'rice-cooker-national', name: 'রাইস কুকার (1.8L)', sku: 'EL-06', catSlug: 'home-appliances', base: 1500, sale: 1299, stock: 40, featured: false, short: 'অটো কুক ও ওয়ার্ম ফাংশন সহ রাইস কুকার।', tags: ['rice-cooker', 'home-appliance'] });
  await upsertProduct({ slug: 'phone-case-universal', name: 'Phone Stand & Case', sku: 'EL-07', catSlug: 'elec-accessories', base: 350, sale: 280, stock: 75, featured: false, short: 'অ্যাডজাস্টেবল ডেস্ক ফোন স্ট্যান্ড।', tags: ['phone-stand', 'accessories'] });

  console.log('✓ Electronics (7)');

  // ── DAILY NEEDS ───────────────────────────────────────────────
  await upsertProduct({ slug: 'boro-plus-cream', name: 'ময়েশ্চারাইজিং ক্রিম', sku: 'DN-01', catSlug: 'personal-care', base: 180, sale: 150, stock: 120, featured: false, short: 'অ্যালোভেরা ও গ্লিসারিন সমৃদ্ধ ময়েশ্চারাইজার।', tags: ['cream', 'skincare', 'personal-care'] });
  await upsertProduct({ slug: 'notebook-a4-100pages', name: 'A4 নোটবুক ১০০ পৃষ্ঠা', sku: 'DN-02', catSlug: 'stationery', base: 120, stock: 200, featured: false, short: 'মসৃণ কাগজের অফিস ও স্টুডেন্ট নোটবুক।', tags: ['notebook', 'stationery'] });
  await upsertProduct({ slug: 'liquid-soap-handwash', name: 'হ্যান্ডওয়াশ (500ml)', sku: 'DN-03', catSlug: 'personal-care', base: 220, sale: 185, stock: 90, featured: false, short: 'অ্যান্টিব্যাকটেরিয়াল লিকুইড হ্যান্ডওয়াশ।', tags: ['handwash', 'soap', 'personal-care'] });
  await upsertProduct({ slug: 'floor-cleaner-1l', name: 'ফ্লোর ক্লিনার (1L)', sku: 'DN-04', catSlug: 'household', base: 280, sale: 240, stock: 70, featured: false, short: 'সুগন্ধি ও কার্যকর ফ্লোর ক্লিনার।', tags: ['cleaner', 'household'] });
  await upsertProduct({ slug: 'ball-pen-pack-10', name: 'বল পেন প্যাক (১০টি)', sku: 'DN-05', catSlug: 'stationery', base: 150, stock: 250, featured: false, short: 'মসৃণ লেখার নীল বল পেনের প্যাক।', tags: ['pen', 'stationery'] });
  await upsertProduct({ slug: 'cat-food-dry', name: 'ড্রাই ক্যাট ফুড (1kg)', sku: 'DN-06', catSlug: 'pet-care', base: 580, sale: 499, stock: 30, featured: false, short: 'পুষ্টিকর ভিটামিন সমৃদ্ধ ড্রাই ক্যাট ফুড।', tags: ['cat-food', 'pet-care'] });

  console.log('✓ Daily Needs (6)');

  // ── HEALTH & SPORTS ───────────────────────────────────────────
  await upsertProduct({ slug: 'yoga-mat-6mm', name: 'যোগব্যায়াম ম্যাট (6mm)', sku: 'HS-01', catSlug: 'yoga-wellness', base: 1200, sale: 980, stock: 35, featured: true, short: 'নন-স্লিপ TPE যোগব্যায়াম ম্যাট।', tags: ['yoga-mat', 'fitness', 'wellness'] });
  await upsertProduct({ slug: 'dumbbell-pair-5kg', name: 'ডাম্বেল পেয়ার (৫kg×২)', sku: 'HS-02', catSlug: 'fitness-equipment', base: 2500, sale: 2100, stock: 20, featured: true, short: 'রাবার কোটেড আয়রন ডাম্বেল পেয়ার।', tags: ['dumbbell', 'fitness', 'gym'] });
  await upsertProduct({ slug: 'whey-protein-1kg', name: 'Whey Protein (1kg)', sku: 'HS-03', catSlug: 'supplements', base: 3800, sale: 3299, stock: 15, featured: true, short: 'Chocolate flavor Whey Protein — 24g protein per serving।', tags: ['protein', 'supplement', 'fitness'] });
  await upsertProduct({ slug: 'cricket-bat-kashmir', name: 'কাশ্মীরি উইলো ক্রিকেট ব্যাট', sku: 'HS-04', catSlug: 'sports', base: 2200, sale: 1850, stock: 25, featured: false, short: 'Kashmir Willow কাঠের টেকসই ক্রিকেট ব্যাট।', tags: ['cricket', 'bat', 'sports'] });
  await upsertProduct({ slug: 'blood-pressure-monitor', name: 'ডিজিটাল বিপি মনিটর', sku: 'HS-05', catSlug: 'health-monitors', base: 2800, sale: 2399, stock: 18, featured: true, short: 'অটোমেটিক আপার আর্ম ব্লাড প্রেশার মনিটর।', tags: ['bp-monitor', 'health', 'monitor'] });
  await upsertProduct({ slug: 'running-shoes-sport', name: 'রানিং শুজ — স্পোর্টস', sku: 'HS-06', catSlug: 'sportswear', base: 2500, sale: 1999, stock: 30, featured: false, short: 'লাইটওয়েট কুশনড রানিং শুজ।', tags: ['running-shoes', 'sports', 'footwear'] });
  await upsertProduct({ slug: 'skipping-rope-steel', name: 'স্কিপিং রোপ — স্টিল কেবল', sku: 'HS-07', catSlug: 'fitness-equipment', base: 680, sale: 550, stock: 50, featured: false, short: 'অ্যাডজাস্টেবল স্টিল কেবল স্কিপিং রোপ।', tags: ['skipping-rope', 'fitness'] });

  console.log('✓ Health & Sports (7)');

  // ── FASHION & LIFESTYLE ───────────────────────────────────────
  await upsertProduct({ slug: 'cotton-kurta-mens', name: 'কটন কুর্তা — পুরুষ', sku: 'FL-01', catSlug: 'mens-fashion', base: 980, sale: 799, stock: 40, featured: true, short: 'ব্লক প্রিন্টের আরামদায়ক কটন কুর্তা।', tags: ['kurta', 'mens-fashion', 'cotton'] });
  await upsertProduct({ slug: 'saree-jamdani', name: 'জামদানি শাড়ি', sku: 'FL-02', catSlug: 'womens-fashion', base: 5500, sale: 4800, stock: 10, featured: true, short: 'হাতে বোনা ঐতিহ্যবাহী জামদানি শাড়ি।', tags: ['saree', 'jamdani', 'womens-fashion'] });
  await upsertProduct({ slug: 'sneakers-casual-white', name: 'হোয়াইট ক্যাজুয়াল স্নিকার', sku: 'FL-03', catSlug: 'footwear', base: 1800, sale: 1499, stock: 35, featured: false, short: 'ক্লাসিক সাদা ক্যানভাস স্নিকার।', tags: ['sneaker', 'footwear', 'casual'] });
  await upsertProduct({ slug: 'face-serum-vitamin-c', name: 'Vitamin C ফেস সিরাম', sku: 'FL-04', catSlug: 'beauty-grooming', base: 850, sale: 720, stock: 25, featured: true, short: 'উজ্জ্বল ত্বকের জন্য ভিটামিন সি সিরাম।', tags: ['serum', 'skincare', 'vitamin-c'] });
  await upsertProduct({ slug: 'kids-t-shirt-pack', name: 'কিডস টি-শার্ট সেট (৩টি)', sku: 'FL-05', catSlug: 'kids-fashion', base: 680, sale: 580, stock: 50, featured: false, short: 'রঙিন সুতির শিশুদের টি-শার্ট সেট।', tags: ['kids', 't-shirt', 'fashion'] });
  await upsertProduct({ slug: 'sunglasses-uv400', name: 'UV400 সানগ্লাস', sku: 'FL-06', catSlug: 'fashion-accessories', base: 750, sale: 620, stock: 30, featured: false, short: 'UV400 সুরক্ষায় স্টাইলিশ পোলারাইজড সানগ্লাস।', tags: ['sunglasses', 'accessories', 'uv-protection'] });
  await upsertProduct({ slug: 'katan-silk-saree', name: 'কাতান সিল্ক শাড়ি', sku: 'FL-07', catSlug: 'womens-fashion', base: 8500, sale: 7200, stock: 8, featured: true, short: 'বিশেষ অনুষ্ঠানের জন্য প্রিমিয়াম কাতান সিল্ক।', tags: ['saree', 'silk', 'katan'] });

  console.log('✓ Fashion & Lifestyle (7)');

  // ── HOME & FURNITURE ──────────────────────────────────────────
  await upsertProduct({ slug: 'bookshelf-wooden-5tier', name: '৫ তলা কাঠের বুকশেলফ', sku: 'HF-01', catSlug: 'furniture', base: 8500, sale: 7200, stock: 8, featured: true, short: 'দেবদারু কাঠের মজবুত ৫ তলা বুকশেলফ।', tags: ['bookshelf', 'furniture', 'wood'] });
  await upsertProduct({ slug: 'sofa-cover-3seater', name: 'সোফা কভার ৩ সিটার', sku: 'HF-02', catSlug: 'home-decor', base: 1800, sale: 1499, stock: 20, featured: false, short: 'ওয়াটারপ্রুফ সোফা কভার — ৩ সিটার।', tags: ['sofa-cover', 'home-decor'] });
  await upsertProduct({ slug: 'non-stick-cookware-set', name: 'নন-স্টিক কুকওয়্যার সেট', sku: 'HF-03', catSlug: 'kitchen-dining', base: 3200, sale: 2699, stock: 15, featured: true, short: 'গ্রানাইট কোটেড ৫ পিস নন-স্টিক কুকওয়্যার সেট।', tags: ['cookware', 'non-stick', 'kitchen'] });
  await upsertProduct({ slug: 'led-ceiling-light', name: 'LED সিলিং লাইট (24W)', sku: 'HF-04', catSlug: 'home-lighting', base: 950, sale: 780, stock: 40, featured: false, short: 'এনার্জি সেভিং 24W LED সিলিং লাইট।', tags: ['led', 'lighting', 'ceiling'] });
  await upsertProduct({ slug: 'comforter-king-size', name: 'কিং সাইজ কমফোর্টার', sku: 'HF-05', catSlug: 'bedding-curtains', base: 4500, sale: 3800, stock: 12, featured: true, short: 'মাইক্রোফাইবার ফিলিং সহ উষ্ণ কিং সাইজ কমফোর্টার।', tags: ['comforter', 'bedding', 'king-size'] });
  await upsertProduct({ slug: 'wall-clock-wooden', name: 'ওয়াল ক্লক — কাঠ', sku: 'HF-06', catSlug: 'home-decor', base: 1200, sale: 980, stock: 25, featured: false, short: 'হাতে তৈরি কাঠের ওয়াল ক্লক।', tags: ['wall-clock', 'wood', 'home-decor'] });
  await upsertProduct({ slug: 'microfiber-mop-set', name: 'মাইক্রোফাইবার মপ সেট', sku: 'HF-07', catSlug: 'cleaning-tools', base: 850, sale: 699, stock: 35, featured: false, short: '৩৬০° স্পিন মাইক্রোফাইবার মপ সেট।', tags: ['mop', 'cleaning', 'microfiber'] });

  console.log('✓ Home & Furniture (7)');

  // ── AUTOMOTIVE ────────────────────────────────────────────────
  await upsertProduct({ slug: 'car-seat-cover-full', name: 'কার সিট কভার সেট', sku: 'AU-01', catSlug: 'car-accessories', base: 3500, sale: 2999, stock: 15, featured: true, short: 'লেদারেট ফুল কার সিট কভার সেট।', tags: ['car-seat', 'car-accessories'] });
  await upsertProduct({ slug: 'motorcycle-helmet', name: 'ফুল ফেস মোটরসাইকেল হেলমেট', sku: 'AU-02', catSlug: 'helmets', base: 4500, sale: 3800, stock: 12, featured: true, short: 'DOT সার্টিফাইড ফুল ফেস হেলমেট।', tags: ['helmet', 'motorcycle', 'safety'] });
  await upsertProduct({ slug: 'car-dash-cam', name: 'ড্যাশ ক্যাম 4K', sku: 'AU-03', catSlug: 'nav-electronics', base: 5500, sale: 4500, stock: 10, featured: false, short: '4K Night Vision সহ ড্যাশ ক্যামেরা।', tags: ['dashcam', 'camera', 'car'] });
  await upsertProduct({ slug: 'tyre-inflator-portable', name: 'পোর্টেবল টায়ার ইনফ্লেটর', sku: 'AU-04', catSlug: 'auto-tools', base: 2200, sale: 1799, stock: 20, featured: false, short: 'ডিজিটাল প্রেশার গেজ সহ পোর্টেবল কমপ্রেসার।', tags: ['tyre-inflator', 'car-tools'] });
  await upsertProduct({ slug: 'car-polish-wax', name: 'কার পলিশ ওয়াক্স', sku: 'AU-05', catSlug: 'car-care', base: 680, sale: 580, stock: 30, featured: false, short: 'গাড়ির পেইন্ট রক্ষায় প্রিমিয়াম পলিশ ওয়াক্স।', tags: ['polish', 'wax', 'car-care'] });

  console.log('✓ Automotive (5)');

  // ── AGRICULTURE ───────────────────────────────────────────────
  await upsertProduct({ slug: 'hybrid-tomato-seeds', name: 'হাইব্রিড টমেটো বীজ', sku: 'AG-01', catSlug: 'seeds-plants', base: 280, sale: 240, stock: 80, featured: true, short: 'উচ্চ ফলনশীল হাইব্রিড টমেটো বীজ।', tags: ['tomato', 'seeds', 'vegetable'] });
  await upsertProduct({ slug: 'organic-fertilizer-5kg', name: 'অর্গানিক কম্পোস্ট সার (৫kg)', sku: 'AG-02', catSlug: 'fertilizers', base: 350, sale: 290, stock: 60, featured: false, short: 'পরিবেশবান্ধব জৈব সার।', tags: ['fertilizer', 'organic', 'compost'] });
  await upsertProduct({ slug: 'hand-sprayer-2l', name: '২L হ্যান্ড স্প্রেয়ার', sku: 'AG-03', catSlug: 'farming-tools', base: 380, sale: 320, stock: 45, featured: false, short: 'কৃষি ও বাগানের জন্য ২ লিটার স্প্রেয়ার।', tags: ['sprayer', 'farming-tool'] });
  await upsertProduct({ slug: 'drip-irrigation-kit', name: 'ড্রিপ ইরিগেশন কিট', sku: 'AG-04', catSlug: 'irrigation', base: 1200, sale: 999, stock: 25, featured: true, short: 'পানি সাশ্রয়ী ড্রিপ ইরিগেশন সেটআপ কিট।', tags: ['drip-irrigation', 'water-saving', 'farming'] });
  await upsertProduct({ slug: 'neem-organic-pesticide', name: 'নিম অর্গানিক কীটনাশক', sku: 'AG-05', catSlug: 'organic-farming', base: 320, sale: 270, stock: 55, featured: false, short: 'পরিবেশবান্ধব নিম তেল-ভিত্তিক কীটনাশক।', tags: ['pesticide', 'neem', 'organic'] });

  console.log('✓ Agriculture (5)');

  // ── TOYS & GAMING ─────────────────────────────────────────────
  await upsertProduct({ slug: 'ludo-board-game', name: 'লুডু বোর্ড গেম — ডিলাক্স', sku: 'TG-01', catSlug: 'board-games', base: 580, sale: 480, stock: 40, featured: true, short: 'পরিবারের জন্য ডিলাক্স লুডু সেট।', tags: ['ludo', 'board-game', 'family'] });
  await upsertProduct({ slug: 'rc-car-remote', name: 'RC রিমোট কন্ট্রোল কার', sku: 'TG-02', catSlug: 'outdoor-toys', base: 1500, sale: 1250, stock: 25, featured: true, short: '৪WD অফ-রোড RC রিমোট কন্ট্রোল গাড়ি।', tags: ['rc-car', 'remote-control', 'toy'] });
  await upsertProduct({ slug: 'building-blocks-500pcs', name: 'বিল্ডিং ব্লকস ৫০০ পিস', sku: 'TG-03', catSlug: 'educational-toys', base: 1200, sale: 999, stock: 30, featured: false, short: 'সৃজনশীলতা বিকাশে ৫০০ পিস বিল্ডিং ব্লকস।', tags: ['building-blocks', 'educational', 'toy'] });
  await upsertProduct({ slug: 'ps-controller-wireless', name: 'Wireless Game Controller', sku: 'TG-04', catSlug: 'consoles-accessories', base: 2500, sale: 2100, stock: 18, featured: true, short: 'PC ও PS-compatible ওয়্যারলেস গেম কন্ট্রোলার।', tags: ['controller', 'gaming', 'wireless'] });
  await upsertProduct({ slug: 'football-size5', name: 'ফুটবল — সাইজ ৫', sku: 'TG-05', catSlug: 'outdoor-toys', base: 680, sale: 580, stock: 35, featured: false, short: 'PVC লামিনেটেড ম্যাচ কোয়ালিটি ফুটবল।', tags: ['football', 'outdoor', 'sports'] });
  await upsertProduct({ slug: 'chess-magnetic-set', name: 'ম্যাগনেটিক চেস সেট', sku: 'TG-06', catSlug: 'board-games', base: 950, sale: 799, stock: 20, featured: false, short: 'ট্র্যাভেল সাইজ ম্যাগনেটিক চেস বোর্ড সেট।', tags: ['chess', 'board-game', 'magnetic'] });

  console.log('✓ Toys & Gaming (6)');

  // ── TRAVEL & BAGS ─────────────────────────────────────────────
  await upsertProduct({ slug: 'trolley-bag-24inch', name: 'হার্ডশেল ট্রলি ব্যাগ (২৪")', sku: 'TB-01', catSlug: 'luggage-trolleys', base: 4500, sale: 3800, stock: 12, featured: true, short: 'TSA লক সহ PC হার্ডশেল ট্রলি লাগেজ।', tags: ['trolley', 'luggage', 'travel'] });
  await upsertProduct({ slug: 'backpack-school-15l', name: 'স্কুল ব্যাকপ্যাক (১৫L)', sku: 'TB-02', catSlug: 'backpacks', base: 1500, sale: 1250, stock: 30, featured: true, short: 'USB চার্জিং পোর্ট সহ ওয়াটারপ্রুফ ব্যাকপ্যাক।', tags: ['backpack', 'school', 'travel'] });
  await upsertProduct({ slug: 'laptop-bag-sleeve-15', name: 'ল্যাপটপ ব্যাগ স্লিভ (১৫.৬")', sku: 'TB-03', catSlug: 'laptop-bags', base: 950, sale: 780, stock: 40, featured: false, short: 'নিওপ্রিন ওয়াটারপ্রুফ ল্যাপটপ স্লিভ।', tags: ['laptop-bag', 'sleeve', 'waterproof'] });
  await upsertProduct({ slug: 'crossbody-ladies-bag', name: 'ক্রসবডি লেডিস ব্যাগ', sku: 'TB-04', catSlug: 'ladies-bags', base: 1200, sale: 999, stock: 25, featured: false, short: 'স্টাইলিশ PU লেদার ক্রসবডি ব্যাগ।', tags: ['ladies-bag', 'crossbody', 'fashion'] });
  await upsertProduct({ slug: 'travel-neck-pillow', name: 'ট্র্যাভেল নেক পিলো', sku: 'TB-05', catSlug: 'travel-pillows', base: 580, sale: 480, stock: 35, featured: false, short: 'মেমোরি ফোমের আরামদায়ক ট্র্যাভেল নেক পিলো।', tags: ['neck-pillow', 'travel', 'memory-foam'] });
  await upsertProduct({ slug: 'packing-cube-set', name: 'ট্র্যাভেল প্যাকিং কিউব সেট', sku: 'TB-06', catSlug: 'travel-accessories', base: 780, sale: 649, stock: 28, featured: true, short: '৬ পিস লাগেজ অর্গানাইজার প্যাকিং কিউব।', tags: ['packing-cube', 'travel-accessory'] });

  console.log('✓ Travel & Bags (6)');

  // ── ECO FRIENDLY ──────────────────────────────────────────────
  await upsertProduct({ slug: 'aloe-vera-gel-organic', name: 'অর্গানিক অ্যালোভেরা জেল', sku: 'EC-01', catSlug: 'natural-skincare', base: 380, sale: 320, stock: 45, featured: true, short: '১০০% প্রাকৃতিক অ্যালোভেরা জেল।', tags: ['aloe-vera', 'skincare', 'organic'] });
  await upsertProduct({ slug: 'bamboo-toothbrush-pack', name: 'বাঁশের টুথব্রাশ (৪টি)', sku: 'EC-02', catSlug: 'bamboo-products', base: 280, sale: 240, stock: 80, featured: false, short: 'বায়োডিগ্রেডেবল বাঁশের টুথব্রাশ।', tags: ['bamboo', 'toothbrush', 'eco'] });
  await upsertProduct({ slug: 'recycled-notebook', name: 'রিসাইকেলড পেপার নোটবুক', sku: 'EC-03', catSlug: 'eco-stationery', base: 180, stock: 100, featured: false, short: 'পরিবেশবান্ধব পুনর্ব্যবহারযোগ্য কাগজের নোটবুক।', tags: ['recycled', 'notebook', 'eco'] });
  await upsertProduct({ slug: 'neem-face-wash', name: 'নিম ফেস ওয়াশ', sku: 'EC-04', catSlug: 'herbal-products', base: 320, sale: 270, stock: 55, featured: true, short: 'ব্রণ প্রতিরোধে নিম ও হলুদ ফেস ওয়াশ।', tags: ['neem', 'face-wash', 'herbal'] });
  await upsertProduct({ slug: 'organic-cotton-tote', name: 'অর্গানিক কটন টোটব্যাগ', sku: 'EC-05', catSlug: 'sustainable-fashion', base: 350, sale: 290, stock: 40, featured: false, short: 'হাতে প্রিন্ট করা অর্গানিক কটন টোটব্যাগ।', tags: ['tote', 'cotton', 'eco', 'sustainable'] });
  await upsertProduct({ slug: 'beeswax-candle-set', name: 'বিসওয়াক্স ক্যান্ডেল সেট', sku: 'EC-06', catSlug: 'natural-skincare', base: 650, sale: 550, stock: 20, featured: false, short: 'হাতে তৈরি প্রাকৃতিক মোমের সুগন্ধি মোমবাতি সেট।', tags: ['candle', 'beeswax', 'natural', 'eco'] });

  console.log('✓ Eco Friendly (6)');

  // Product variants for top books
  const variantPairs = [
    ['atomic-habits',   'Atomic Habits — Hardcover',     'BK-SH01-HC', 650],
    ['paradoxical-sajid','প্যারাডক্সিক্যাল সাজিদ — হার্ডকভার', 'BK-IS02-HC', 360],
    ['nabi-jiboni',     'নবী জীবনী — পেপারব্যাক',       'BK-IS01-PB', 320],
  ] as [string, string, string, number][];

  for (const [slug, varName, sku, price] of variantPairs) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) continue;
    await prisma.productVariant.upsert({
      where: { sku },
      update: {},
      create: { productId: product.id, name: varName, sku, price, stockQuantity: 15, isActive: true, attributes: {} },
    });
  }

  console.log('✓ Product variants');

  // ══════════════════════════════════════════════════════════════
  // 4. REVIEWS  (top 8 products)
  // ══════════════════════════════════════════════════════════════
  const reviewData: Array<{ slug: string; userId: string; rating: number; title: string; body: string }> = [
    { slug: 'paradoxical-sajid',     userId: c1.id, rating: 5, title: 'অসাধারণ বই!', body: 'আরিফ আজাদের যুক্তিগুলো অত্যন্ত শক্তিশালী। প্রতিটি মুসলিমের পড়া উচিত।' },
    { slug: 'paradoxical-sajid',     userId: c2.id, rating: 5, title: 'Must Read', body: 'সংশয়বাদীদের জন্য সেরা জবাব।' },
    { slug: 'paradoxical-sajid',     userId: c3.id, rating: 4, title: 'ভালো বই', body: 'লেখা সুন্দর, আরেকটু বিস্তারিত হলে ভালো হতো।' },
    { slug: 'atomic-habits',         userId: c1.id, rating: 5, title: 'Life changing!', body: 'ছোট অভ্যাসের শক্তি বুঝলাম। James Clear অসাধারণ লিখেছেন।' },
    { slug: 'atomic-habits',         userId: c3.id, rating: 5, title: 'সেরা Self-Help বই', body: 'Highly recommended! প্রতিদিন ১% উন্নতির কনসেপ্ট মাথা ঘুরিয়ে দিয়েছে।' },
    { slug: 'bela-furabar-age',      userId: c2.id, rating: 5, title: 'হৃদয় স্পর্শকারী', body: 'পড়তে পড়তে চোখে জল এসে গেছে।' },
    { slug: 'nabi-jiboni',           userId: c1.id, rating: 5, title: 'সেরা জীবনী', body: 'মহানবীর জীবন সম্পর্কে অনেক অজানা তথ্য জানলাম।' },
    { slug: 'organic-honey-sundarban',userId: c2.id, rating: 5, title: 'সত্যিই খাঁটি!', body: 'অনেক জায়গার মধু খেয়েছি, এটাই সেরা।' },
    { slug: 'organic-honey-sundarban',userId: c3.id, rating: 5, title: 'Pure & Natural', body: 'স্বাদ ও গন্ধ অসাধারণ। আবার অর্ডার করব।' },
    { slug: 'nakshi-kantha-large',   userId: c2.id, rating: 5, title: 'অপূর্ব শিল্পকর্ম', body: 'হাতের কাজ অসাধারণ। উপহার হিসেবে দিয়েছিলাম, সবাই মুগ্ধ।' },
    { slug: 'earbuds-wireless-tws',  userId: c1.id, rating: 4, title: 'ভালো সাউন্ড', body: 'দামে তুলনামূলক অনেক ভালো সাউND। Battery life ভালো।' },
    { slug: 'smart-watch-fitness',   userId: c3.id, rating: 5, title: 'দারুণ প্রোডাক্ট', body: 'HeartRate এবং SpO2 মনিটর সঠিক কাজ করে। ডিসপ্লে clear।' },
    { slug: 'yoga-mat-6mm',          userId: c1.id, rating: 5, title: 'Best Yoga Mat', body: 'নন-স্লিপ সারফেস অসাধারণ। ধোয়া সহজ।' },
    { slug: 'saree-jamdani',         userId: c2.id, rating: 5, title: 'অনন্য শাড়ি', body: 'হাতে বোনা জামদানির কোনো তুলনা নেই। অসম্ভব সুন্দর।' },
  ];

  for (const r of reviewData) {
    const product = await prisma.product.findUnique({ where: { slug: r.slug } });
    if (!product) continue;
    await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId: r.userId } },
      update: { rating: r.rating, title: r.title, body: r.body, isPublished: true, isVerified: true },
      create: { productId: product.id, userId: r.userId, rating: r.rating, title: r.title, body: r.body, isPublished: true, isVerified: true },
    });
  }
  console.log(`✓ Reviews (${reviewData.length})`);

  // ══════════════════════════════════════════════════════════════
  // 5. COUPONS
  // ══════════════════════════════════════════════════════════════
  const coupons = [
    { code: 'WELCOME10', description: 'নতুন গ্রাহকদের জন্য ১০% ছাড়', discountType: 'PERCENTAGE', discountValue: 10, minOrderValue: 300, maxDiscount: 150, usageLimit: 500, firstOrderOnly: true },
    { code: 'SAVE50',    description: '৫০ টাকা তাৎক্ষণিক ছাড়',       discountType: 'FIXED',      discountValue: 50, minOrderValue: 500,  usageLimit: 1000 },
    { code: 'BOOK20',    description: 'বইয়ে ২০% ছাড়',                discountType: 'PERCENTAGE', discountValue: 20, minOrderValue: 400, maxDiscount: 200, usageLimit: 300 },
    { code: 'EID2026',   description: 'ঈদ স্পেশাল ১৫% ছাড়',          discountType: 'PERCENTAGE', discountValue: 15, minOrderValue: 600, maxDiscount: 300, usageLimit: 500, expiresAt: new Date('2026-12-31') },
    { code: 'FREESHIP',  description: 'ফ্রি শিপিং কুপন',               discountType: 'FIXED',      discountValue: 60, minOrderValue: 200,  usageLimit: 2000 },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { isActive: true },
      create: {
        code: c.code, description: c.description,
        discountType: c.discountType as any, discountValue: c.discountValue,
        minOrderValue: c.minOrderValue ?? null, maxDiscount: (c as any).maxDiscount ?? null,
        usageLimit: c.usageLimit ?? null, firstOrderOnly: (c as any).firstOrderOnly ?? false,
        expiresAt: (c as any).expiresAt ?? null, isActive: true,
      },
    });
  }
  console.log(`✓ Coupons (${coupons.length})`);

  // ══════════════════════════════════════════════════════════════
  // 6. SHIPPING ZONES & RATES
  // ══════════════════════════════════════════════════════════════
  const dhaka = await prisma.shippingZone.upsert({
    where: { id: 'zone-dhaka' },
    update: {},
    create: { id: 'zone-dhaka', name: 'ঢাকা মেট্রোপলিটন', description: 'ঢাকা সিটি ও আশেপাশের এলাকা', divisions: ['Dhaka'], districts: ['Dhaka'], countries: [], isActive: true },
  });
  await prisma.shippingRate.upsert({
    where: { id: 'rate-dhaka-std' },
    update: {},
    create: { id: 'rate-dhaka-std', zoneId: dhaka.id, name: 'স্ট্যান্ডার্ড ডেলিভারি', carrier: 'Pathao', baseRate: 60, perKgRate: 0, freeAbove: 1000, estimatedDays: '1-2', isActive: true },
  });
  await prisma.shippingRate.upsert({
    where: { id: 'rate-dhaka-exp' },
    update: {},
    create: { id: 'rate-dhaka-exp', zoneId: dhaka.id, name: 'এক্সপ্রেস ডেলিভারি', carrier: 'Pathao Express', baseRate: 120, perKgRate: 0, estimatedDays: 'Same Day', isActive: true },
  });

  const ctg = await prisma.shippingZone.upsert({
    where: { id: 'zone-ctg' },
    update: {},
    create: { id: 'zone-ctg', name: 'চট্টগ্রাম বিভাগ', divisions: ['Chittagong'], districts: [], countries: [], isActive: true },
  });
  await prisma.shippingRate.upsert({
    where: { id: 'rate-ctg-std' },
    update: {},
    create: { id: 'rate-ctg-std', zoneId: ctg.id, name: 'স্ট্যান্ডার্ড ডেলিভারি', carrier: 'SteadFast', baseRate: 100, perKgRate: 20, freeAbove: 1500, estimatedDays: '2-3', isActive: true },
  });

  const nationwide = await prisma.shippingZone.upsert({
    where: { id: 'zone-bd-all' },
    update: {},
    create: { id: 'zone-bd-all', name: 'সারা বাংলাদেশ', description: 'ঢাকা ও চট্টগ্রাম ব্যতীত সকল জেলা', divisions: [], districts: [], countries: ['BD'], isActive: true },
  });
  await prisma.shippingRate.upsert({
    where: { id: 'rate-bd-std' },
    update: {},
    create: { id: 'rate-bd-std', zoneId: nationwide.id, name: 'নিয়মিত কুরিয়ার', carrier: 'SteadFast', baseRate: 130, perKgRate: 30, freeAbove: 2000, estimatedDays: '3-5', isActive: true },
  });

  console.log('✓ Shipping Zones & Rates');

  // ══════════════════════════════════════════════════════════════
  // 7. PICKUP POINTS
  // ══════════════════════════════════════════════════════════════
  const pickupPoints = [
    { id: 'pp-dhanmondi', name: 'UNKORA ধানমন্ডি', address: 'হাউস ৩২, রোড ২, ধানমন্ডি', city: 'Dhaka', district: 'Dhaka', phone: '01911369686', openHours: 'শনি–বৃহস্পতি ১০am–৮pm', sortOrder: 1 },
    { id: 'pp-gulshan',   name: 'UNKORA গুলশান',   address: 'প্লট ১৫, গুলশান-২',         city: 'Dhaka', district: 'Dhaka', phone: '01911369687', openHours: 'শনি–বৃহস্পতি ১০am–৯pm', sortOrder: 2 },
    { id: 'pp-ctg',       name: 'UNKORA চট্টগ্রাম', address: 'জিইসি মোড়, চট্টগ্রাম',    city: 'Chittagong', district: 'Chittagong', phone: '01911369688', openHours: 'শনি–বৃহস্পতি ১০am–৮pm', sortOrder: 3 },
  ];

  for (const pp of pickupPoints) {
    await prisma.pickupPoint.upsert({
      where: { id: pp.id },
      update: {},
      create: { ...pp, isActive: true },
    });
  }
  console.log('✓ Pickup Points');

  // ══════════════════════════════════════════════════════════════
  // 8. SITE SETTINGS  (dot-notation keys matching frontend reads)
  // ══════════════════════════════════════════════════════════════
  const settings: Array<[string, string]> = [
    // Site identity
    ['site.name',           'UNKORA'],
    ['site.tagline',        'বাংলাদেশের সেরা অনলাইন মার্কেটপ্লেস'],
    ['site.email',          'support@unkora.shop'],
    ['site.phone',          '+880 1911-369686'],
    ['site.address',        '160, Hasan Nagar,\nDhaka-1211'],
    ['site.url',            'https://unkora.shop'],
    // Social
    ['social.facebook',     'https://facebook.com/unkora.shop'],
    ['social.instagram',    'https://instagram.com/unkora.shop'],
    ['social.youtube',      'https://youtube.com/@unkorashop'],
    ['social.whatsapp',     '8801911369686'],
    // Commerce
    ['currency',            'BDT'],
    ['currency.symbol',     '৳'],
    ['shipping.freeAbove',  '1000'],
    ['shipping.defaultCost','60'],
    ['cod.enabled',         'true'],
    ['bkash.enabled',       'true'],
    ['nagad.enabled',       'true'],
    // Features
    ['recommerce.enabled',  'false'],
    ['maintenance.mode',    'false'],
    ['flash_sale_enabled',  'true'],
    // Announcement bar
    ['announcement_bar', JSON.stringify({
      enabled: true,
      text: '🎉 বিশেষ অফার! ১০০০ টাকার উপরে অর্ডারে ফ্রি শিপিং',
      textEn: '🎉 Special Offer! Free shipping on orders above ৳1000',
      link: '/products', bgColor: '#065f46',
    })],
    // SEO
    ['meta.title',          'UNKORA — বাংলাদেশের সেরা অনলাইন মার্কেটপ্লেস'],
    ['meta.description',    'UNKORA-তে পাবেন বই, অর্গানিক পণ্য, চামড়াজাত পণ্য, ইসলামিক লাইফস্টাইল ও আরো অনেক কিছু। সেরা দামে, দ্রুত ডেলিভারিতে।'],
    // Chatbot
    ['chatbot.enabled',           'true'],
    ['chatbot.welcomeMessage',    'হ্যালো! 👋 আমি Unkora AI। আপনাকে কীভাবে সাহায্য করতে পারি?'],
    ['contact.whatsappNumber',    '8801911369686'],
    ['contact.messengerUsername', 'unkora.shop'],
    // Courier (empty configs — admin fills in via UI)
    ['courier_configs', JSON.stringify({
      pathao:    { enabled: false, sandbox: true },
      steadfast: { enabled: false, sandbox: true },
      redx:      { enabled: false, sandbox: true },
      paperFly:  { enabled: false, sandbox: true },
      eCourier:  { enabled: false, sandbox: true },
      sundarban: { enabled: false, sandbox: false },
      carrybee:  { enabled: false, sandbox: true },
    })],
  ];

  for (const [key, value] of settings) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log(`✓ Site settings (${settings.length})`);

  // ══════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════
  const [pc, cc, ic, rc, cpnc, ssc] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.productImage.count(),
    prisma.review.count(),
    prisma.coupon.count(),
    prisma.siteSetting.count(),
  ]);

  console.log('\n✅ Seed complete!');
  console.log(`   products=${pc}  categories=${cc}  images=${ic}  reviews=${rc}  coupons=${cpnc}  settings=${ssc}`);
  console.log('');
  console.log('   🔑  Admin:    admin@unkora.com    / Admin@123456');
  console.log('   👤  Customer: rafiq@test.com      / Customer@123');
  console.log('   🏪  Seller:   seller@test.com     / Seller@123');
  console.log('');
  console.log('   🎟️  Coupons:  WELCOME10 · SAVE50 · BOOK20 · EID2026 · FREESHIP');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
