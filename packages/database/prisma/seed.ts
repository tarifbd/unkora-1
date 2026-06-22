import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// picsum.photos gives consistent, always-loading images keyed by slug
const productImg = (slug: string, w = 400, h = 500) =>
  `https://picsum.photos/seed/${encodeURIComponent(slug)}/${w}/${h}`;

async function main() {
  console.log('🌱 Seeding UNKORA...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash     = await argon2.hash('Admin@123456');
  const customerHash  = await argon2.hash('Customer@123');
  const sellerHash    = await argon2.hash('Seller@123');
  const reviewer1Hash = await argon2.hash('Reviewer@123');

  await prisma.user.upsert({
    where: { email: 'admin@unkora.com' },
    update: { passwordHash: adminHash, role: 'SUPER_ADMIN', status: 'ACTIVE' },
    create: {
      email: 'admin@unkora.com', passwordHash: adminHash,
      firstName: 'UNKORA', lastName: 'Admin',
      role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerifiedAt: new Date(),
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: { passwordHash: customerHash, status: 'ACTIVE' },
    create: {
      email: 'customer@test.com', passwordHash: customerHash,
      firstName: 'Rafiq', lastName: 'Islam',
      phone: '01711000000', role: 'CUSTOMER', status: 'ACTIVE', emailVerifiedAt: new Date(),
    },
  });

  // Extra users for reviews (idempotent — skip if phone conflict)
  const reviewer1 = await prisma.user.upsert({
    where: { email: 'rakib@test.com' },
    update: { status: 'ACTIVE' },
    create: {
      email: 'rakib@test.com', passwordHash: reviewer1Hash,
      firstName: 'রাকিব', lastName: 'হাসান',
      phone: '01722000001', role: 'CUSTOMER', status: 'ACTIVE', emailVerifiedAt: new Date(),
    },
  });

  const reviewer2 = await prisma.user.upsert({
    where: { email: 'tania@test.com' },
    update: { status: 'ACTIVE' },
    create: {
      email: 'tania@test.com', passwordHash: reviewer1Hash,
      firstName: 'তানিয়া', lastName: 'আক্তার',
      phone: '01733000002', role: 'CUSTOMER', status: 'ACTIVE', emailVerifiedAt: new Date(),
    },
  });

  const reviewer3 = await prisma.user.upsert({
    where: { email: 'arif@test.com' },
    update: { status: 'ACTIVE' },
    create: {
      email: 'arif@test.com', passwordHash: reviewer1Hash,
      firstName: 'আরিফ', lastName: 'রহমান',
      phone: '01744000003', role: 'CUSTOMER', status: 'ACTIVE', emailVerifiedAt: new Date(),
    },
  });

  // Seller user (role CUSTOMER — no SELLER in UserRole enum)
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@test.com' },
    update: { passwordHash: sellerHash, status: 'ACTIVE' },
    create: {
      email: 'seller@test.com', passwordHash: sellerHash,
      firstName: 'Karim', lastName: 'Books',
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

  console.log('✓ Users (admin, customer, seller, reviewers)');

  // ── Top-level categories ───────────────────────────────────────────────────
  const booksCat = await prisma.category.upsert({
    where: { slug: 'books' },
    update: { isFeatured: true },
    create: { name: 'Books', slug: 'books', description: 'বাংলা ও ইংরেজি বই', sortOrder: 1, color: 'bg-blue-100 text-blue-700', icon: '📚', isFeatured: true },
  });
  const babyProductsCat = await prisma.category.upsert({
    where: { slug: 'baby-products' },
    update: { isFeatured: true },
    create: { name: 'Baby Products', slug: 'baby-products', description: 'শিশু সামগ্রী', sortOrder: 2, color: 'bg-pink-100 text-pink-700', icon: '👶', isFeatured: true },
  });
  const leatherProductsCat = await prisma.category.upsert({
    where: { slug: 'leather-products' },
    update: {},
    create: { name: 'Leather Products', slug: 'leather-products', description: 'চামড়ার প্রিমিয়াম পণ্য', sortOrder: 3, color: 'bg-amber-100 text-amber-700', icon: '👜' },
  });
  const organicFoodsCat = await prisma.category.upsert({
    where: { slug: 'organic-foods' },
    update: { isFeatured: true },
    create: { name: 'Organic Foods', slug: 'organic-foods', description: 'প্রাকৃতিক ও জৈব পণ্য', sortOrder: 4, color: 'bg-green-100 text-green-700', icon: '🌿', isFeatured: true },
  });
  const handicraftsCat = await prisma.category.upsert({
    where: { slug: 'handicrafts' },
    update: {},
    create: { name: 'Handicrafts', slug: 'handicrafts', description: 'হস্তশিল্প', sortOrder: 5, color: 'bg-purple-100 text-purple-700', icon: '🎨' },
  });
  const electronicsCat = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: { name: 'Electronics', slug: 'electronics', description: 'ইলেকট্রনিক্স পণ্য', sortOrder: 6, color: 'bg-cyan-100 text-cyan-700', icon: '⚡' },
  });
  const dailyNeedsCat = await prisma.category.upsert({
    where: { slug: 'daily-needs' },
    update: {},
    create: { name: 'Daily Needs', slug: 'daily-needs', description: 'দৈনন্দিন প্রয়োজনীয় পণ্য', sortOrder: 7, color: 'bg-orange-100 text-orange-700', icon: '🛒' },
  });

  // ── Sub-categories of Books ────────────────────────────────────────────────
  const fictionCat = await prisma.category.upsert({
    where: { slug: 'fiction' },
    update: {},
    create: { name: 'Fiction', slug: 'fiction', parentId: booksCat.id, sortOrder: 1 },
  });
  const islamicCat = await prisma.category.upsert({
    where: { slug: 'islamic-books' },
    update: {},
    create: { name: 'Islamic Books', slug: 'islamic-books', parentId: booksCat.id, sortOrder: 2 },
  });
  const academicCat = await prisma.category.upsert({
    where: { slug: 'academic' },
    update: {},
    create: { name: 'Academic', slug: 'academic', parentId: booksCat.id, sortOrder: 3 },
  });
  const selfHelpCat = await prisma.category.upsert({
    where: { slug: 'self-help' },
    update: {},
    create: { name: 'Self-Help', slug: 'self-help', parentId: booksCat.id, sortOrder: 4 },
  });
  const childrenCat = await prisma.category.upsert({
    where: { slug: 'childrens-books' },
    update: {},
    create: { name: "Children's Books", slug: 'childrens-books', parentId: booksCat.id, sortOrder: 5 },
  });
  const nonFictionCat = await prisma.category.upsert({
    where: { slug: 'non-fiction' },
    update: {},
    create: { name: 'Non-Fiction', slug: 'non-fiction', parentId: booksCat.id, sortOrder: 6 },
  });

  // ── Islamic Lifestyle (matches the storefront /islamic-lifestyle section) ──
  const islamicLifestyleCat = await prisma.category.upsert({
    where: { slug: 'islamic-lifestyle' },
    update: {},
    create: { name: 'Islamic Lifestyle', slug: 'islamic-lifestyle', description: 'ইসলামিক লাইফস্টাইল পণ্য', sortOrder: 8, color: 'bg-emerald-100 text-emerald-700', icon: '🕌', isFeatured: true },
  });
  const islamicLifestyleSubs = [
    { name: 'Prayer Essentials', slug: 'prayer-essentials',  sortOrder: 1 },
    { name: 'Quran Accessories', slug: 'quran-accessories',  sortOrder: 2 },
    { name: 'Islamic Clothing',  slug: 'islamic-clothing',   sortOrder: 3 },
    { name: 'Perfumes & Oud',    slug: 'perfumes-oud',       sortOrder: 4 },
    { name: 'Tasbih & Decor',    slug: 'tasbih-decor',       sortOrder: 5 },
  ];
  for (const sub of islamicLifestyleSubs) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: { ...sub, parentId: islamicLifestyleCat.id },
    });
  }

  console.log('✓ Categories');

  void electronicsCat; void dailyNeedsCat;

  // ── Books ──────────────────────────────────────────────────────────────────
  type BookSeed = {
    name: string; slug: string; sku: string; base: number; sale?: number;
    stock: number; featured: boolean; catId: string; short: string; desc: string;
    author: string; publisher: string; lang: string; pages: number; isbn: string;
    binding: string; genres: string[];
  };

  const books: BookSeed[] = [
    // Fiction
    { name: 'হিমুর দ্বিতীয় প্রহর', slug: 'himur-dwitiy-prohor', sku: 'BK-001', base: 280, sale: 240, stock: 42, featured: true, catId: fictionCat.id, short: 'হুমায়ূন আহমেদের জনপ্রিয় হিমু সিরিজের একটি অসাধারণ উপন্যাস।', desc: 'হুমায়ূন আহমেদের হিমু চরিত্রকে ঘিরে গড়ে ওঠা রহস্য ও রোমাঞ্চকর কাহিনী।', author: 'হুমায়ূন আহমেদ', publisher: 'অন্যপ্রকাশ', lang: 'Bengali', pages: 224, isbn: '9789841000001', binding: 'Paperback', genres: ['Fiction', 'Bengali Literature'] },
    { name: 'পদ্মা নদীর মাঝি', slug: 'padma-nadir-majhi', sku: 'BK-002', base: 320, sale: 270, stock: 45, featured: true, catId: fictionCat.id, short: 'মানিক বন্দ্যোপাধ্যায়ের কালজয়ী উপন্যাস।', desc: 'পদ্মা নদীর তীরে জেলেদের জীবন ও সংগ্রামের জীবন্ত চিত্র।', author: 'মানিক বন্দ্যোপাধ্যায়', publisher: 'আনন্দ পাবলিশার্স', lang: 'Bengali', pages: 224, isbn: '9789841000002', binding: 'Hardcover', genres: ['Fiction', 'Bengali Literature'] },
    { name: 'দেবদাস', slug: 'devdas', sku: 'BK-003', base: 250, stock: 38, featured: false, catId: fictionCat.id, short: 'শরৎচন্দ্রের অমর প্রেমের উপন্যাস।', desc: 'বাংলা সাহিত্যের সবচেয়ে বিখ্যাত প্রেমের উপন্যাসগুলোর একটি।', author: 'শরৎচন্দ্র চট্টোপাধ্যায়', publisher: 'বিশ্বসাহিত্য কেন্দ্র', lang: 'Bengali', pages: 192, isbn: '9789841000003', binding: 'Paperback', genres: ['Fiction', 'Bengali Literature'] },
    { name: 'লোহার চুড়ি', slug: 'lohar-churi', sku: 'BK-004', base: 340, sale: 290, stock: 31, featured: true, catId: fictionCat.id, short: 'সমরেশ মজুমদারের শক্তিশালী সামাজিক উপন্যাস।', desc: 'সমরেশ মজুমদারের অসাধারণ লেখনীতে সমাজের চিত্র।', author: 'সমরেশ মজুমদার', publisher: 'আনন্দ পাবলিশার্স', lang: 'Bengali', pages: 312, isbn: '9789841000004', binding: 'Paperback', genres: ['Fiction', 'Bengali Literature'] },
    { name: 'সে রাতে পূর্ণিমা ছিল', slug: 'se-rate-purnima-chilo', sku: 'BK-005', base: 260, stock: 55, featured: true, catId: fictionCat.id, short: 'হুমায়ূন আহমেদের রহস্যময় ও আবেগী উপন্যাস।', desc: 'পূর্ণিমার রাতে ঘটে যাওয়া এক অলৌকিক ঘটনার গল্প।', author: 'হুমায়ূন আহমেদ', publisher: 'অন্যপ্রকাশ', lang: 'Bengali', pages: 176, isbn: '9789841000005', binding: 'Paperback', genres: ['Fiction', 'Bengali Literature'] },
    { name: 'পুতুলনাচের ইতিকথা', slug: 'putul-nacher-itikotha', sku: 'BK-006', base: 300, stock: 28, featured: false, catId: fictionCat.id, short: 'মানিক বন্দ্যোপাধ্যায়ের বিশ্লেষণাত্মক সামাজিক উপন্যাস।', desc: 'মানুষের সম্পর্ক ও সমাজের জটিল গতিপ্রকৃতির অনন্য বিশ্লেষণ।', author: 'মানিক বন্দ্যোপাধ্যায়', publisher: 'আনন্দ পাবলিশার্স', lang: 'Bengali', pages: 256, isbn: '9789841000006', binding: 'Hardcover', genres: ['Fiction', 'Bengali Literature'] },
    { name: 'Sapiens', slug: 'sapiens', sku: 'BK-007', base: 580, sale: 499, stock: 22, featured: true, catId: fictionCat.id, short: 'Yuval Noah Harari-এর বিশ্বখ্যাত মানব ইতিহাসের বই।', desc: 'মানবজাতির উৎপত্তি থেকে বর্তমান পর্যন্ত সম্পূর্ণ ইতিহাস।', author: 'Yuval Noah Harari', publisher: 'Harper Collins', lang: 'English', pages: 443, isbn: '9780062316097', binding: 'Paperback', genres: ['Non-Fiction', 'History'] },
    // Islamic
    { name: 'নবী জীবনী', slug: 'nabi-jiboni', sku: 'BK-008', base: 450, sale: 380, stock: 60, featured: true, catId: islamicCat.id, short: 'মহানবী (সা.)-এর সম্পূর্ণ জীবনী।', desc: 'মহানবী হযরত মুহাম্মদ (সা.)-এর জন্ম থেকে মৃত্যু পর্যন্ত সম্পূর্ণ জীবনী।', author: 'ড. আলী মুহাম্মদ সাল্লাবী', publisher: 'দারুল কিতাব', lang: 'Bengali', pages: 580, isbn: '9789841000008', binding: 'Hardcover', genres: ['Islamic'] },
    { name: 'রিয়াদুস সালেহীন', slug: 'riyadus-salehin', sku: 'BK-009', base: 520, sale: 450, stock: 55, featured: false, catId: islamicCat.id, short: 'ইমাম নববীর বিখ্যাত হাদীস সংকলন।', desc: 'ইমাম নববী রহ. কর্তৃক সংকলিত বিশুদ্ধ হাদীস।', author: 'ইমাম নববী', publisher: 'ইসলামিক ফাউন্ডেশন', lang: 'Bengali', pages: 820, isbn: '9789841000009', binding: 'Hardcover', genres: ['Islamic'] },
    { name: 'বেলা ফুরাবার আগে', slug: 'bela-furabar-age', sku: 'BK-010', base: 300, sale: 260, stock: 48, featured: true, catId: islamicCat.id, short: 'আরিফ আজাদের জনপ্রিয় ইসলামিক গল্পগ্রন্থ।', desc: 'জীবনের অর্থ ও ইসলামের আলোয় পথ খোঁজার অসাধারণ গল্পসংকলন।', author: 'আরিফ আজাদ', publisher: 'গার্ডিয়ান পাবলিকেশনস', lang: 'Bengali', pages: 240, isbn: '9789841000010', binding: 'Paperback', genres: ['Islamic'] },
    { name: 'প্যারাডক্সিক্যাল সাজিদ', slug: 'paradoxical-sajid', sku: 'BK-011', base: 280, sale: 240, stock: 75, featured: true, catId: islamicCat.id, short: 'আরিফ আজাদের সংশয়বাদীদের জন্য যুক্তিনির্ভর জবাব।', desc: 'ইসলামের বিরুদ্ধে প্রচলিত প্রশ্নগুলোর যুক্তিসম্মত উত্তর।', author: 'আরিফ আজাদ', publisher: 'গার্ডিয়ান পাবলিকেশনস', lang: 'Bengali', pages: 216, isbn: '9789841000011', binding: 'Paperback', genres: ['Islamic'] },
    { name: 'আরজ আলী সমীপে', slug: 'arj-ali-samipe', sku: 'BK-012', base: 240, stock: 40, featured: true, catId: islamicCat.id, short: 'আরিফ আজাদের নাস্তিকতার বিরুদ্ধে শক্তিশালী জবাব।', desc: 'আরজ আলীর প্রশ্নগুলোর ইসলামিক দৃষ্টিকোণ থেকে উত্তর।', author: 'আরিফ আজাদ', publisher: 'গার্ডিয়ান পাবলিকেশনস', lang: 'Bengali', pages: 196, isbn: '9789841000012', binding: 'Paperback', genres: ['Islamic'] },
    { name: 'জান্নাতের পথে', slug: 'jannater-pathe', sku: 'BK-013', base: 320, sale: 280, stock: 35, featured: false, catId: islamicCat.id, short: 'মিজানুর রহমান আজহারীর অনুপ্রেরণামূলক ইসলামিক বই।', desc: 'জান্নাতের পথে চলার দিকনির্দেশনা ও অনুপ্রেরণা।', author: 'মিজানুর রহমান আজহারী', publisher: 'আলোর পথ', lang: 'Bengali', pages: 280, isbn: '9789841000013', binding: 'Paperback', genres: ['Islamic'] },
    // Academic
    { name: 'HSC Physics 1st Paper', slug: 'hsc-physics-1st', sku: 'BK-014', base: 380, sale: 320, stock: 65, featured: true, catId: academicCat.id, short: 'HSC পদার্থবিজ্ঞান ১ম পত্র সম্পূর্ণ গাইড।', desc: 'HSC পরীক্ষার জন্য পদার্থবিজ্ঞান ১ম পত্রের সম্পূর্ণ প্রস্তুতি গাইড।', author: 'ড. শাহজাহান তপন', publisher: 'হাসান বুক হাউস', lang: 'Bengali', pages: 480, isbn: '9789841000014', binding: 'Paperback', genres: ['Academic', 'Education'] },
    { name: 'BCS Preli Guide', slug: 'bcs-preli-guide', sku: 'BK-015', base: 550, sale: 480, stock: 80, featured: true, catId: academicCat.id, short: 'BCS প্রিলিমিনারি পরীক্ষার সম্পূর্ণ গাইড।', desc: 'BCS পরীক্ষার সকল বিষয়ের প্রিলিমিনারি প্রস্তুতি।', author: "Professor's", publisher: "Professor's Publications", lang: 'Bengali', pages: 650, isbn: '9789841000015', binding: 'Paperback', genres: ['Academic', 'Education'] },
    { name: 'Bank Job Preparation', slug: 'bank-job-prep', sku: 'BK-016', base: 420, sale: 360, stock: 52, featured: true, catId: academicCat.id, short: 'ব্যাংক জব প্রস্তুতির সম্পূর্ণ গাইড।', desc: 'বাংলাদেশ ব্যাংকসহ সকল সরকারি ও বেসরকারি ব্যাংকের নিয়োগ পরীক্ষার গাইড।', author: 'আসাদুজ্জামান', publisher: 'অ্যাসুরেন্স পাবলিকেশন', lang: 'Bengali', pages: 520, isbn: '9789841000016', binding: 'Paperback', genres: ['Academic', 'Education'] },
    { name: 'Admission Guide Dhaka University', slug: 'du-admission-guide', sku: 'BK-017', base: 350, sale: 300, stock: 45, featured: false, catId: academicCat.id, short: 'ঢাকা বিশ্ববিদ্যালয় ভর্তি পরীক্ষার সম্পূর্ণ গাইড।', desc: 'ঢাকা বিশ্ববিদ্যালয়ের সকল ইউনিটের ভর্তি পরীক্ষার প্রস্তুতি।', author: 'শিক্ষার্থী পরিবার', publisher: 'শিক্ষার্থী পরিবার প্রকাশনী', lang: 'Bengali', pages: 580, isbn: '9789841000017', binding: 'Paperback', genres: ['Academic', 'Education'] },
    // Self-Help
    { name: 'Atomic Habits', slug: 'atomic-habits', sku: 'BK-018', base: 550, sale: 480, stock: 25, featured: true, catId: selfHelpCat.id, short: 'James Clear-এর বিশ্বখ্যাত বই — ছোট অভ্যাসে বড় পরিবর্তন।', desc: 'ছোট অভ্যাসগুলো কিভাবে বড় পরিবর্তন আনতে পারে তা বৈজ্ঞানিক উপায়ে বর্ণনা।', author: 'James Clear', publisher: 'Penguin Random House', lang: 'English', pages: 320, isbn: '9780593189236', binding: 'Paperback', genres: ['Self-Help', 'Productivity'] },
    { name: 'Deep Work', slug: 'deep-work', sku: 'BK-019', base: 420, stock: 18, featured: true, catId: selfHelpCat.id, short: 'Cal Newport-এর Focus ও Productivity নিয়ে অসাধারণ বই।', desc: 'গভীর মনোযোগের কাজই সাফল্যের চাবিকাঠি।', author: 'Cal Newport', publisher: 'Grand Central Publishing', lang: 'English', pages: 296, isbn: '9781455586691', binding: 'Paperback', genres: ['Self-Help', 'Productivity'] },
    { name: 'The Psychology of Money', slug: 'psychology-of-money', sku: 'BK-020', base: 480, sale: 420, stock: 20, featured: true, catId: selfHelpCat.id, short: 'Morgan Housel-এর অর্থনীতি ও মানসিকতার অসাধারণ বই।', desc: 'অর্থ ও সম্পদ নিয়ে মানুষের মনস্তত্ত্ব বিষয়ে গভীর বিশ্লেষণ।', author: 'Morgan Housel', publisher: 'Harriman House', lang: 'English', pages: 256, isbn: '9780857197765', binding: 'Paperback', genres: ['Self-Help', 'Productivity'] },
    { name: 'Think and Grow Rich', slug: 'think-and-grow-rich', sku: 'BK-021', base: 380, sale: 320, stock: 40, featured: false, catId: selfHelpCat.id, short: 'Napoleon Hill-এর বিশ্বখ্যাত সাফল্যের বই।', desc: 'সাফল্যের রহস্য উন্মোচন — বিশ্বের সবচেয়ে বেশি পঠিত self-help বইগুলোর একটি।', author: 'Napoleon Hill', publisher: 'Penguin Books', lang: 'English', pages: 320, isbn: '9780143119103', binding: 'Paperback', genres: ['Self-Help', 'Productivity'] },
    { name: 'Ikigai', slug: 'ikigai-japanese-secret', sku: 'BK-022', base: 390, sale: 340, stock: 33, featured: true, catId: selfHelpCat.id, short: 'জাপানিদের দীর্ঘ সুখী জীবনের রহস্য।', desc: 'Ikigai ধারণাটি ব্যবহার করে কীভাবে জীবনের অর্থ খুঁজে নেওয়া যায়।', author: 'Héctor García', publisher: 'Penguin Books', lang: 'English', pages: 208, isbn: '9780143130727', binding: 'Paperback', genres: ['Self-Help', 'Productivity'] },
    { name: '7 Habits of Highly Effective People', slug: 'seven-habits', sku: 'BK-023', base: 450, sale: 390, stock: 27, featured: false, catId: selfHelpCat.id, short: 'Stephen Covey-এর সময়-পরীক্ষিত সাফল্যের ৭টি অভ্যাস।', desc: 'ব্যক্তিগত ও পেশাদার জীবনে কার্যকর হওয়ার ৭টি শক্তিশালী অভ্যাস।', author: 'Stephen R. Covey', publisher: 'Free Press', lang: 'English', pages: 381, isbn: '9781982137274', binding: 'Paperback', genres: ['Self-Help', 'Productivity'] },
    { name: 'Quantum Method', slug: 'quantum-method', sku: 'BK-024', base: 360, sale: 310, stock: 44, featured: true, catId: selfHelpCat.id, short: 'কোয়ান্টাম মেথড — মানসিক শক্তি ও সাফল্যের পথ।', desc: 'কোয়ান্টাম ফাউন্ডেশনের বিজ্ঞানসম্মত মেডিটেশন ও জীবন উন্নয়নের পদ্ধতি।', author: 'মহাজাতক', publisher: 'কোয়ান্টাম ফাউন্ডেশন', lang: 'Bengali', pages: 320, isbn: '9789841000024', binding: 'Paperback', genres: ['Self-Help', 'Productivity'] },
    // Children's
    { name: 'ঠাকুরমার ঝুলি', slug: 'thakurmar-jhuli', sku: 'BK-025', base: 240, sale: 200, stock: 70, featured: false, catId: childrenCat.id, short: 'দক্ষিণারঞ্জনের কালজয়ী রূপকথার গল্প।', desc: 'বাংলার ঐতিহ্যবাহী রূপকথার গল্পের অনন্য সংকলন।', author: 'দক্ষিণারঞ্জন মিত্র', publisher: 'বিশ্বসাহিত্য কেন্দ্র', lang: 'Bengali', pages: 288, isbn: '9789841000025', binding: 'Hardcover', genres: ["Children's"] },
    { name: 'ছোটদের রঙিন দুনিয়া', slug: 'chotoder-rongeen-duniya', sku: 'BK-026', base: 180, stock: 80, featured: false, catId: childrenCat.id, short: 'শিশুদের জন্য রঙিন ছবি ও গল্পের অনন্য সংকলন।', desc: 'ছোটদের জন্য মজার গল্প, ছড়া ও রঙিন চিত্রের সমাহার।', author: 'রোকনুজ্জামান খান', publisher: 'শিশু একাডেমি', lang: 'Bengali', pages: 128, isbn: '9789841000026', binding: 'Hardcover', genres: ["Children's"] },
    // Non-Fiction
    { name: 'বাংলাদেশের ইতিহাস', slug: 'bangladesher-itihas', sku: 'BK-027', base: 580, stock: 25, featured: false, catId: nonFictionCat.id, short: 'প্রাচীনকাল থেকে আজ পর্যন্ত বাংলাদেশের পূর্ণাঙ্গ ইতিহাস।', desc: 'বাংলাদেশের ইতিহাস, সংস্কৃতি ও ঐতিহ্যের একটি পূর্ণাঙ্গ বিবরণ।', author: 'ড. সিরাজুল ইসলাম', publisher: 'এশিয়াটিক সোসাইটি', lang: 'Bengali', pages: 640, isbn: '9789841000027', binding: 'Hardcover', genres: ['Non-Fiction', 'History'] },
    { name: 'মুক্তিযুদ্ধের গল্প', slug: 'mukti-juddher-golpo', sku: 'BK-028', base: 360, stock: 35, featured: true, catId: nonFictionCat.id, short: '১৯৭১ সালের মুক্তিযুদ্ধের অজানা বীরত্বগাঁথা।', desc: 'বাংলাদেশের মুক্তিযুদ্ধের অজানা কাহিনী ও বীর মুক্তিযোদ্ধাদের আত্মত্যাগের কথা।', author: 'শাহরিয়ার কবির', publisher: 'প্রথমা প্রকাশন', lang: 'Bengali', pages: 256, isbn: '9789841000028', binding: 'Paperback', genres: ['Non-Fiction', 'History'] },
  ];

  for (const b of books) {
    const img1 = productImg(b.slug);
    const img2 = productImg(b.slug + '-back');
    await prisma.product.upsert({
      where: { slug: b.slug },
      update: {
        isFeatured: b.featured, stockQuantity: b.stock, salePrice: b.sale ?? null,
        images: { deleteMany: {}, create: [{ url: img1, isPrimary: true, sortOrder: 0 }, { url: img2, isPrimary: false, sortOrder: 1 }] },
      },
      create: {
        name: b.name, slug: b.slug, sku: b.sku,
        basePrice: b.base, salePrice: b.sale ?? null,
        stockQuantity: b.stock, isFeatured: b.featured, isActive: true,
        shortDesc: b.short, description: b.desc,
        categoryId: b.catId,
        tags: b.genres.map(g => g.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
        images: { create: [{ url: img1, isPrimary: true, sortOrder: 0 }, { url: img2, isPrimary: false, sortOrder: 1 }] },
        bookDetail: {
          create: {
            author: b.author, publisher: b.publisher, language: b.lang,
            pageCount: b.pages, isbn: b.isbn, binding: b.binding, genres: b.genres,
          },
        },
      },
    });
  }
  console.log(`✓ Books (${books.length})`);

  // ── Non-book products ──────────────────────────────────────────────────────
  type OtherSeed = {
    name: string; slug: string; sku: string; base: number; sale?: number;
    stock: number; featured: boolean; catId: string;
    short: string; desc: string; tags: string[];
  };

  const others: OtherSeed[] = [
    { name: 'অর্গানিক মধু — সুন্দরবন', slug: 'organic-honey-sundarban', sku: 'ORG-001', base: 650, sale: 580, stock: 50, featured: true, catId: organicFoodsCat.id, short: 'সুন্দরবনের খাঁটি ফুলের মধু — ১০০% প্রাকৃতিক।', desc: 'সুন্দরবন থেকে সংগ্রহ করা খাঁটি ফুলের মধু। কোনো কৃত্রিম রং বা preservative নেই।', tags: ['organic', 'honey', 'natural'] },
    { name: 'অর্গানিক হলুদ গুঁড়া', slug: 'organic-turmeric-powder', sku: 'ORG-002', base: 220, sale: 190, stock: 80, featured: true, catId: organicFoodsCat.id, short: 'কীটনাশকমুক্ত খাঁটি হলুদ গুঁড়া।', desc: 'রাসায়নিক সার ও কীটনাশকমুক্ত জমিতে চাষ করা হলুদ থেকে তৈরি বিশুদ্ধ গুঁড়া।', tags: ['organic', 'turmeric', 'spice'] },
    { name: 'কোল্ড প্রেসড নারিকেল তেল', slug: 'cold-pressed-coconut-oil', sku: 'ORG-003', base: 480, stock: 35, featured: false, catId: organicFoodsCat.id, short: 'ঐতিহ্যবাহী পদ্ধতিতে তৈরি খাঁটি নারিকেল তেল।', desc: 'কোল্ড প্রেস পদ্ধতিতে তৈরি ১০০% বিশুদ্ধ নারিকেল তেল।', tags: ['organic', 'coconut-oil'] },
    { name: 'অর্গানিক কালিজিরা', slug: 'organic-black-seed', sku: 'ORG-004', base: 180, sale: 150, stock: 65, featured: true, catId: organicFoodsCat.id, short: 'খাঁটি কালিজিরা — রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি করে।', desc: '১০০% প্রাকৃতিক কালিজিরা — কোনো ভেজাল নেই।', tags: ['organic', 'black-seed', 'natural'] },
    { name: 'খাঁটি সরিষার তেল', slug: 'pure-mustard-oil', sku: 'ORG-005', base: 320, sale: 280, stock: 45, featured: false, catId: organicFoodsCat.id, short: 'ঐতিহ্যবাহী কোলু পদ্ধতিতে তৈরি সরিষার তেল।', desc: 'ঘানি ভাঙা খাঁটি সরিষার তেল — সম্পূর্ণ প্রাকৃতিক।', tags: ['organic', 'mustard-oil'] },
    { name: 'শিশু সফট টয় — টেডি বেয়ার', slug: 'baby-teddy-bear', sku: 'BB-001', base: 750, sale: 620, stock: 40, featured: true, catId: babyProductsCat.id, short: 'নিরাপদ ও মোলায়েম টেডি বেয়ার।', desc: 'শিশুর কোমল ত্বকের জন্য নিরাপদ উপাদানে তৈরি নরম টেডি বেয়ার। BPA free ও non-toxic।', tags: ['baby', 'toy', 'soft-toy'] },
    { name: 'শিশু মশারি — সুতির', slug: 'baby-mosquito-net', sku: 'BB-002', base: 420, stock: 45, featured: false, catId: babyProductsCat.id, short: 'শিশুর নিরাপদ ঘুমের জন্য মশামুক্ত মশারি।', desc: 'শিশুর জন্য বিশেষভাবে তৈরি হালকা সুতির মশারি।', tags: ['baby', 'mosquito-net', 'cotton'] },
    { name: 'চামড়ার হ্যান্ডব্যাগ — লেডিস', slug: 'leather-ladies-handbag', sku: 'LT-001', base: 2800, sale: 2400, stock: 15, featured: true, catId: leatherProductsCat.id, short: 'নরসিংদীর খাঁটি চামড়ায় তৈরি মহিলাদের হ্যান্ডব্যাগ।', desc: 'বাংলাদেশের সেরা চামড়া ব্যবহার করে দক্ষ কারিগরদের হাতে তৈরি হ্যান্ডব্যাগ।', tags: ['leather', 'handbag', 'ladies', 'premium'] },
    { name: 'চামড়ার পার্স — জেন্টস', slug: 'leather-mens-wallet', sku: 'LT-002', base: 950, sale: 820, stock: 30, featured: true, catId: leatherProductsCat.id, short: 'আসল চামড়ার পাতলা ও মজবুত পুরুষের পার্স।', desc: 'genuine leather দিয়ে তৈরি স্লিম ডিজাইনের পার্স।', tags: ['leather', 'wallet', 'mens'] },
    { name: 'নকশিকাঁথা — হস্তশিল্প', slug: 'nakshi-kantha', sku: 'HC-001', base: 1800, sale: 1500, stock: 12, featured: true, catId: handicraftsCat.id, short: 'বাংলাদেশের ঐতিহ্যবাহী নকশিকাঁথা — হাতে সেলাই।', desc: 'দক্ষ কারিগরদের হাতে তৈরি ঐতিহ্যবাহী নকশিকাঁথা। প্রতিটি কাঁথাই অনন্য শিল্পকর্ম।', tags: ['handicraft', 'nakshi-kantha', 'traditional'] },
  ];

  for (const p of others) {
    const img = productImg(p.slug);
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        isFeatured: p.featured, stockQuantity: p.stock, salePrice: p.sale ?? null,
        images: { deleteMany: {}, create: [{ url: img, isPrimary: true, sortOrder: 0 }] },
      },
      create: {
        name: p.name, slug: p.slug, sku: p.sku,
        basePrice: p.base, salePrice: p.sale ?? null,
        stockQuantity: p.stock, isFeatured: p.featured, isActive: true,
        shortDesc: p.short, description: p.desc,
        categoryId: p.catId, tags: p.tags,
        images: { create: [{ url: img, isPrimary: true, sortOrder: 0 }] },
      },
    });
  }
  console.log(`✓ Other products (${others.length})`);

  // ── Product Variants ───────────────────────────────────────────────────────
  // Add binding variants for top books
  const variantBooks = [
    { slug: 'atomic-habits',      hardcoverSku: 'BK-018-HC', price: 680 },
    { slug: 'paradoxical-sajid',  hardcoverSku: 'BK-011-HC', price: 350 },
    { slug: 'bela-furabar-age',   hardcoverSku: 'BK-010-HC', price: 380 },
    { slug: 'nabi-jiboni',        paperbackSku: 'BK-008-PB', price: 320 },
  ];

  for (const vb of variantBooks) {
    const product = await prisma.product.findUnique({ where: { slug: vb.slug } });
    if (!product) continue;

    if ('hardcoverSku' in vb) {
      await prisma.productVariant.upsert({
        where: { sku: vb.hardcoverSku },
        update: {},
        create: {
          productId: product.id,
          name: 'Hardcover Edition',
          sku: vb.hardcoverSku,
          price: vb.price,
          stockQuantity: 15,
          attributes: { binding: 'Hardcover', edition: 'Special' },
          isActive: true,
        },
      });
    } else {
      await prisma.productVariant.upsert({
        where: { sku: vb.paperbackSku },
        update: {},
        create: {
          productId: product.id,
          name: 'Paperback Edition',
          sku: vb.paperbackSku,
          price: vb.price,
          stockQuantity: 20,
          attributes: { binding: 'Paperback', edition: 'Standard' },
          isActive: true,
        },
      });
    }
  }
  console.log('✓ Product variants');

  // ── Reviews ────────────────────────────────────────────────────────────────
  type ReviewSeed = {
    productSlug: string;
    userId: string;
    rating: number;
    title: string;
    body: string;
  };

  const reviewSeeds: ReviewSeed[] = [
    { productSlug: 'paradoxical-sajid', userId: customerUser.id, rating: 5, title: 'অসাধারণ বই!', body: 'আরিফ আজাদের এই বইটি সত্যিই চমৎকার। যুক্তিগুলো খুব শক্তিশালী।' },
    { productSlug: 'paradoxical-sajid', userId: reviewer1.id, rating: 5, title: 'Must read!', body: 'প্রতিটি মুসলিমের পড়া উচিত। অনেক কিছু জানতে পারলাম।' },
    { productSlug: 'paradoxical-sajid', userId: reviewer2.id, rating: 4, title: 'ভালো বই', body: 'বেশ ভালো লেখা। কিছু জায়গায় আরো বিস্তারিত হতে পারতো।' },
    { productSlug: 'atomic-habits', userId: customerUser.id, rating: 5, title: 'Life changing book!', body: 'এই বইটি আমার জীবন পরিবর্তন করে দিয়েছে। প্রতিদিনের ছোট অভ্যাসগুলো কতটা গুরুত্বপূর্ণ তা বুঝলাম।' },
    { productSlug: 'atomic-habits', userId: reviewer3.id, rating: 5, title: 'সেরা বই', body: 'Highly recommended! James Clear অসাধারণভাবে লিখেছেন।' },
    { productSlug: 'bela-furabar-age', userId: reviewer1.id, rating: 5, title: 'হৃদয় স্পর্শ করে', body: 'পড়তে পড়তে চোখে জল এসে গেছে। আরিফ আজাদ অসাধারণ লেখক।' },
    { productSlug: 'bela-furabar-age', userId: reviewer2.id, rating: 5, title: 'অনুপ্রেরণামূলক', body: 'এই বইটি পড়ে অনেক অনুপ্রাণিত হয়েছি। সবাইকে পড়ার অনুরোধ।' },
    { productSlug: 'nabi-jiboni', userId: customerUser.id, rating: 5, title: 'সেরা জীবনী', body: 'মহানবীর জীবন সম্পর্কে অনেক কিছু জানলাম। অনুবাদও চমৎকার।' },
    { productSlug: 'nabi-jiboni', userId: reviewer3.id, rating: 5, title: 'অমূল্য গ্রন্থ', body: 'প্রতিটি মুসলিম পরিবারে এই বই থাকা উচিত।' },
    { productSlug: 'himur-dwitiy-prohor', userId: reviewer1.id, rating: 5, title: 'হিমু ফ্যানদের জন্য মাস্ট রিড', body: 'হুমায়ূন আহমেদের লেখার জাদু — একবার শুরু করলে শেষ না করে ওঠা যায় না।' },
    { productSlug: 'himur-dwitiy-prohor', userId: reviewer2.id, rating: 4, title: 'দারুণ বই', body: 'হিমু সিরিজের এই বইটি অসাধারণ। তবে আরেকটু লম্বা হলে ভালো হতো।' },
    { productSlug: 'sapiens', userId: customerUser.id, rating: 5, title: 'Mind-blowing!', body: 'মানবজাতির ইতিহাস এত সুন্দরভাবে লেখা হয়েছে। পড়তে পড়তে অবাক হয়ে যাই।' },
    { productSlug: 'bcs-preli-guide', userId: reviewer3.id, rating: 4, title: 'BCS প্রস্তুতির জন্য ভালো', body: 'সব বিষয় কভার করা আছে। তবে কিছু প্রশ্নের ব্যাখ্যা আরো বিস্তারিত হলে ভালো হতো।' },
    { productSlug: 'organic-honey-sundarban', userId: reviewer1.id, rating: 5, title: 'সত্যিই খাঁটি মধু!', body: 'অনেক জায়গার মধু খেয়েছি, এটাই সেরা। স্বাদ ও গন্ধ দুটোই অসাধারণ।' },
    { productSlug: 'organic-honey-sundarban', userId: reviewer2.id, rating: 5, title: 'Pure & Natural', body: 'ডাক্তার সুন্দরবনের মধু খেতে বলেছিলেন। এটা সত্যিই ভালো।' },
    { productSlug: 'leather-mens-wallet', userId: reviewer3.id, rating: 5, title: 'প্রিমিয়াম কোয়ালিটি', body: 'পার্সটা দেখতে যেমন সুন্দর তেমনি টেকসই। একদম genuine leather।' },
    { productSlug: 'psychology-of-money', userId: reviewer1.id, rating: 5, title: 'অর্থ সম্পর্কে নতুন দৃষ্টিভঙ্গি', body: 'Money নিয়ে এত গভীরভাবে কখনো ভাবিনি। Morgan Housel অসাধারণ লিখেছেন।' },
    { productSlug: 'nakshi-kantha', userId: reviewer2.id, rating: 5, title: 'অপূর্ব শিল্পকর্ম', body: 'হাতের কাজ অসাধারণ। উপহার হিসেবে দিয়েছিলাম, সবাই মুগ্ধ হয়েছে।' },
  ];

  for (const r of reviewSeeds) {
    const product = await prisma.product.findUnique({ where: { slug: r.productSlug } });
    if (!product) continue;
    await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId: r.userId } },
      update: { rating: r.rating, title: r.title, body: r.body, isPublished: true, isVerified: true },
      create: {
        productId: product.id, userId: r.userId,
        rating: r.rating, title: r.title, body: r.body,
        isPublished: true, isVerified: true,
      },
    });
  }
  console.log(`✓ Reviews (${reviewSeeds.length})`);

  // ── Site Settings ──────────────────────────────────────────────────────────
  const settings: { key: string; value: string }[] = [
    { key: 'site_name',           value: 'UNKORA' },
    { key: 'site_tagline',        value: 'বাংলাদেশের সেরা অনলাইন মার্কেটপ্লেস' },
    { key: 'site_email',          value: 'support@unkora.com' },
    { key: 'site_phone',          value: '+880 1708-166233' },
    { key: 'site_address',        value: 'Dhaka, Bangladesh' },
    { key: 'currency',            value: 'BDT' },
    { key: 'currency_symbol',     value: '৳' },
    { key: 'free_shipping_above', value: '500' },
    { key: 'default_shipping_cost', value: '60' },
    { key: 'announcement_bar',    value: JSON.stringify({ enabled: true, text: '🎉 বিশেষ অফার! ৫০০ টাকার উপরে অর্ডারে ফ্রি শিপিং', textEn: '🎉 Special Offer! Free shipping on orders above ৳500', link: '/products', bgColor: '#dc2626' }) },
    { key: 'flash_sale_enabled',  value: 'true' },
    { key: 'flash_sale_ends_at',  value: new Date(Date.now() + 72 * 3600 * 1000).toISOString() },
    { key: 'meta_title',          value: 'UNKORA — বাংলাদেশের সেরা অনলাইন মার্কেটপ্লেস' },
    { key: 'meta_description',    value: 'UNKORA-তে পাবেন বই, অর্গানিক পণ্য, চামড়াজাত পণ্য, শিশু সামগ্রী ও আরো অনেক কিছু। সেরা দামে, দ্রুত ডেলিভারিতে।' },
    { key: 'social_facebook',     value: 'https://facebook.com/unkora' },
    { key: 'social_instagram',    value: 'https://instagram.com/unkora' },
    { key: 'maintenance_mode',    value: 'false' },
    { key: 'cod_enabled',         value: 'true' },
    { key: 'bkash_enabled',       value: 'true' },
    { key: 'nagad_enabled',       value: 'true' },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  console.log(`✓ Site settings (${settings.length})`);

  // ── Chat Widget defaults (create-only, so admin changes survive re-seeding) ─
  const chatDefaults: { key: string; value: string }[] = [
    { key: 'chatbot.enabled',           value: 'true' },
    { key: 'chatbot.welcomeMessage',    value: 'হ্যালো! 👋 আমি Unkora AI। আপনাকে কীভাবে সাহায্য করতে পারি?' },
    { key: 'contact.whatsappNumber',    value: '8801708166233' },
    { key: 'contact.messengerUsername', value: 'unkora' },
  ];
  for (const s of chatDefaults) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value },
    });
  }
  console.log(`✓ Chat widget defaults (${chatDefaults.length})`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const [pCount, catCount, imgCount, varCount, revCount, settCount] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.productImage.count(),
    prisma.productVariant.count(),
    prisma.review.count(),
    prisma.siteSetting.count(),
  ]);

  console.log('\n✅ Seed complete!');
  console.log(`   products=${pCount}, categories=${catCount}, images=${imgCount}, variants=${varCount}, reviews=${revCount}, site_settings=${settCount}`);
  console.log('   🔑 Admin:    admin@unkora.com / Admin@123456');
  console.log('   👤 Customer: customer@test.com / Customer@123');
  console.log('   🏪 Seller:   seller@test.com / Seller@123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
