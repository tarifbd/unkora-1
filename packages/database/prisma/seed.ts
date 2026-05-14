import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const img = (id: number, w = 600, h = 800) => `https://picsum.photos/seed/unkora${id}/${w}/${h}`;

async function main() {
  console.log('🌱 Seeding UNKORA...');

  const adminHash = await argon2.hash('Admin@123456');
  const customerHash = await argon2.hash('Customer@123');

  await prisma.user.upsert({ where: { email: 'admin@unkora.com' }, update: {}, create: { email: 'admin@unkora.com', passwordHash: adminHash, firstName: 'UNKORA', lastName: 'Admin', role: 'SUPER_ADMIN', status: 'ACTIVE', emailVerifiedAt: new Date() } });
  await prisma.user.upsert({ where: { email: 'customer@test.com' }, update: {}, create: { email: 'customer@test.com', passwordHash: customerHash, firstName: 'Rafiq', lastName: 'Islam', phone: '01711000000', role: 'CUSTOMER', status: 'ACTIVE', emailVerifiedAt: new Date() } });
  console.log('✓ Users');

  const booksCat = await prisma.category.upsert({ where: { slug: 'books' }, update: {}, create: { name: 'Books', slug: 'books', description: 'বাংলা ও ইংরেজি বই', sortOrder: 1 } });
  const organicCat = await prisma.category.upsert({ where: { slug: 'organic' }, update: {}, create: { name: 'Organic', slug: 'organic', description: 'প্রাকৃতিক ও জৈব পণ্য', sortOrder: 2 } });
  const babyCat = await prisma.category.upsert({ where: { slug: 'baby' }, update: {}, create: { name: 'Baby', slug: 'baby', description: 'শিশু সামগ্রী', sortOrder: 3 } });
  const homeDecorCat = await prisma.category.upsert({ where: { slug: 'home-decor' }, update: {}, create: { name: 'Home Decor', slug: 'home-decor', description: 'ঘর সাজানোর সামগ্রী', sortOrder: 4 } });
  const leatherCat = await prisma.category.upsert({ where: { slug: 'leather' }, update: {}, create: { name: 'Leather', slug: 'leather', description: 'চামড়ার প্রিমিয়াম পণ্য', sortOrder: 5 } });
  const fictionCat = await prisma.category.upsert({ where: { slug: 'fiction' }, update: {}, create: { name: 'Fiction', slug: 'fiction', parentId: booksCat.id, sortOrder: 1 } });
  const islamicCat = await prisma.category.upsert({ where: { slug: 'islamic-books' }, update: {}, create: { name: 'Islamic', slug: 'islamic-books', parentId: booksCat.id, sortOrder: 2 } });
  const childrenCat = await prisma.category.upsert({ where: { slug: 'childrens-books' }, update: {}, create: { name: "Children's", slug: 'childrens-books', parentId: booksCat.id, sortOrder: 3 } });
  const selfHelpCat = await prisma.category.upsert({ where: { slug: 'self-help' }, update: {}, create: { name: 'Self-Help', slug: 'self-help', parentId: booksCat.id, sortOrder: 4 } });
  console.log('✓ Categories');

  type BookSeed = { name: string; slug: string; sku: string; base: number; sale?: number; stock: number; featured: boolean; imgId: number; catId: string; short: string; desc: string; author: string; publisher: string; lang: string; pages: number; isbn: string; binding: string; genres: string[]; tags: string[] };
  const books: BookSeed[] = [
    { name: 'পদ্মা নদীর মাঝি', slug: 'padma-nadir-majhi', sku: 'BK-001', base: 320, sale: 270, stock: 45, featured: true, imgId: 11, catId: fictionCat.id, short: 'মানিক বন্দ্যোপাধ্যায়ের কালজয়ী উপন্যাস — পদ্মার জেলে জীবনের এক অনন্য চিত্র।', desc: 'পদ্মা নদীর মাঝি বাংলা সাহিত্যের এক অবিস্মরণীয় উপন্যাস। মানিক বন্দ্যোপাধ্যায় পদ্মার তীরে জেলেদের জীবন ও সংগ্রামের জীবন্ত চিত্র তুলে ধরেছেন।', author: 'মানিক বন্দ্যোপাধ্যায়', publisher: 'আনন্দ পাবলিশার্স', lang: 'Bengali', pages: 224, isbn: '9788172151001', binding: 'Hardcover', genres: ['Fiction', 'Classic', 'Bengali Literature'], tags: ['classic', 'bengali', 'fiction'] },
    { name: 'আলোর পথযাত্রী', slug: 'alor-pothojatri', sku: 'BK-002', base: 280, stock: 30, featured: true, imgId: 22, catId: fictionCat.id, short: 'হুমায়ূন আহমেদের হৃদয়গ্রাহী উপন্যাস।', desc: 'হুমায়ূন আহমেদের লেখা এই উপন্যাসটি আলো ও অন্ধকারের মাঝে মানুষের সংগ্রামের গল্প বলে।', author: 'হুমায়ূন আহমেদ', publisher: 'অন্যপ্রকাশ', lang: 'Bengali', pages: 192, isbn: '9789841001', binding: 'Paperback', genres: ['Fiction', 'Drama'], tags: ['humayun', 'fiction', 'bengali'] },
    { name: 'নবী জীবনী', slug: 'nabi-jiboni', sku: 'BK-003', base: 450, sale: 380, stock: 60, featured: true, imgId: 33, catId: islamicCat.id, short: 'মহানবী (সা.)-এর সম্পূর্ণ জীবনী — সহজ বাংলায়।', desc: 'মহানবী হযরত মুহাম্মদ (সা.)-এর জন্ম থেকে মৃত্যু পর্যন্ত সম্পূর্ণ জীবনী সহজ ভাষায়।', author: 'ড. আলী মুহাম্মদ সাল্লাবী', publisher: 'দারুল কিতাব', lang: 'Bengali', pages: 580, isbn: '9789841002', binding: 'Hardcover', genres: ['Islamic', 'Biography'], tags: ['islamic', 'biography', 'prophet'] },
    { name: 'Atomic Habits', slug: 'atomic-habits', sku: 'BK-004', base: 550, sale: 480, stock: 25, featured: true, imgId: 44, catId: selfHelpCat.id, short: 'James Clear-এর বিশ্বখ্যাত বই — ছোট অভ্যাসে বড় পরিবর্তন।', desc: 'ছোট অভ্যাসগুলো কিভাবে বড় পরিবর্তন আনতে পারে তা বৈজ্ঞানিক ও ব্যবহারিক উপায়ে বর্ণনা।', author: 'James Clear', publisher: 'Penguin Random House', lang: 'English', pages: 320, isbn: '9780593189236', binding: 'Paperback', genres: ['Self-Help', 'Psychology', 'Productivity'], tags: ['self-help', 'habits', 'english'] },
    { name: 'ছোটদের রঙিন দুনিয়া', slug: 'chotoder-rongeen-duniya', sku: 'BK-005', base: 180, sale: 150, stock: 80, featured: false, imgId: 55, catId: childrenCat.id, short: 'শিশুদের জন্য রঙিন ছবি ও গল্পের অনন্য সংকলন।', desc: 'ছোটদের জন্য মজার গল্প, ছড়া ও রঙিন চিত্রের সমাহার।', author: 'রোকনুজ্জামান খান', publisher: 'শিশু একাডেমি', lang: 'Bengali', pages: 128, isbn: '9789841003', binding: 'Hardcover', genres: ["Children's", 'Story'], tags: ['children', 'story', 'colorful'] },
    { name: 'মুক্তিযুদ্ধের গল্প', slug: 'mukti-juddher-golpo', sku: 'BK-006', base: 360, stock: 35, featured: true, imgId: 66, catId: fictionCat.id, short: '১৯৭১ সালের মুক্তিযুদ্ধের অজানা বীরত্বগাঁথা।', desc: 'বাংলাদেশের মুক্তিযুদ্ধের অজানা কাহিনী ও বীর মুক্তিযোদ্ধাদের আত্মত্যাগের কথা।', author: 'শাহরিয়ার কবির', publisher: 'প্রথমা প্রকাশন', lang: 'Bengali', pages: 256, isbn: '9789841004', binding: 'Paperback', genres: ['History', 'Non-Fiction'], tags: ['history', 'liberation-war', 'bangladesh'] },
    { name: 'The Psychology of Money', slug: 'the-psychology-of-money', sku: 'BK-007', base: 480, sale: 420, stock: 20, featured: true, imgId: 77, catId: selfHelpCat.id, short: 'Morgan Housel-এর অর্থনীতি ও মানসিকতার অসাধারণ বই।', desc: 'অর্থ ও সম্পদ নিয়ে মানুষের মনস্তত্ত্ব বিষয়ে Morgan Housel-এর গভীর বিশ্লেষণ।', author: 'Morgan Housel', publisher: 'Harriman House', lang: 'English', pages: 256, isbn: '9780857197765', binding: 'Paperback', genres: ['Finance', 'Self-Help'], tags: ['finance', 'money', 'english'] },
    { name: 'রিয়াদুস সালেহীন', slug: 'riyadus-salehin', sku: 'BK-008', base: 520, sale: 450, stock: 55, featured: false, imgId: 88, catId: islamicCat.id, short: 'ইমাম নববীর বিখ্যাত হাদীস সংকলন।', desc: 'ইমাম নববী রহ. কর্তৃক সংকলিত বিশুদ্ধ হাদীস — মুসলিম জীবনযাপনের পথপ্রদর্শক।', author: 'ইমাম নববী', publisher: 'ইসলামিক ফাউন্ডেশন', lang: 'Bengali', pages: 820, isbn: '9789841005', binding: 'Hardcover', genres: ['Islamic', 'Hadith'], tags: ['islamic', 'hadith', 'religion'] },
    { name: 'Deep Work', slug: 'deep-work', sku: 'BK-009', base: 420, stock: 18, featured: false, imgId: 99, catId: selfHelpCat.id, short: 'Cal Newport-এর Focus ও Productivity নিয়ে অসাধারণ বই।', desc: 'গভীর মনোযোগের কাজই সাফল্যের চাবিকাঠি — Cal Newport বিস্তারিত ব্যাখ্যা।', author: 'Cal Newport', publisher: 'Grand Central Publishing', lang: 'English', pages: 296, isbn: '9781455586691', binding: 'Paperback', genres: ['Self-Help', 'Productivity'], tags: ['focus', 'productivity', 'english'] },
    { name: 'ঠাকুরমার ঝুলি', slug: 'thakurmar-jhuli', sku: 'BK-010', base: 240, sale: 200, stock: 70, featured: false, imgId: 101, catId: childrenCat.id, short: 'দক্ষিণারঞ্জনের কালজয়ী রূপকথার গল্প।', desc: 'বাংলার ঐতিহ্যবাহী রূপকথার গল্পের অনন্য সংকলন — শিশু থেকে বড় সকলের জন্য।', author: 'দক্ষিণারঞ্জন মিত্র মজুমদার', publisher: 'বিশ্বসাহিত্য কেন্দ্র', lang: 'Bengali', pages: 288, isbn: '9789841006', binding: 'Hardcover', genres: ["Children's", 'Fairy Tale'], tags: ['fairy-tale', 'children', 'classic'] },
    { name: 'Think and Grow Rich', slug: 'think-and-grow-rich', sku: 'BK-011', base: 380, sale: 320, stock: 40, featured: false, imgId: 112, catId: selfHelpCat.id, short: 'Napoleon Hill-এর বিশ্বখ্যাত সাফল্যের বই।', desc: 'সাফল্যের রহস্য উন্মোচন — বিশ্বের সবচেয়ে বেশি পঠিত self-help বইগুলোর একটি।', author: 'Napoleon Hill', publisher: 'Penguin Books', lang: 'English', pages: 320, isbn: '9780143119103', binding: 'Paperback', genres: ['Self-Help', 'Finance'], tags: ['success', 'self-help', 'english'] },
    { name: 'বাংলাদেশের ইতিহাস', slug: 'bangladesher-itihas', sku: 'BK-012', base: 580, stock: 25, featured: false, imgId: 123, catId: fictionCat.id, short: 'প্রাচীনকাল থেকে আজ পর্যন্ত বাংলাদেশের পূর্ণাঙ্গ ইতিহাস।', desc: 'বাংলাদেশের ইতিহাস, সংস্কৃতি ও ঐতিহ্যের একটি পূর্ণাঙ্গ বিবরণ।', author: 'ড. সিরাজুল ইসলাম', publisher: 'এশিয়াটিক সোসাইটি', lang: 'Bengali', pages: 640, isbn: '9789841007', binding: 'Hardcover', genres: ['History', 'Non-Fiction'], tags: ['history', 'bangladesh'] },
  ];

  for (const b of books) {
    await prisma.product.upsert({
      where: { slug: b.slug }, update: {},
      create: {
        name: b.name, slug: b.slug, sku: b.sku, basePrice: b.base, salePrice: b.sale ?? null,
        stockQuantity: b.stock, isFeatured: b.featured, isActive: true,
        shortDesc: b.short, description: b.desc, categoryId: b.catId, tags: b.tags,
        images: { create: [{ url: img(b.imgId, 400, 560), isPrimary: true, sortOrder: 0 }, { url: img(b.imgId + 300, 400, 560), isPrimary: false, sortOrder: 1 }] },
        bookDetail: { create: { author: b.author, publisher: b.publisher, language: b.lang, pageCount: b.pages, isbn: b.isbn, binding: b.binding, genres: b.genres } },
      },
    });
  }
  console.log('✓ Books (12)');

  type OtherSeed = { name: string; slug: string; sku: string; base: number; sale?: number; stock: number; featured: boolean; imgId: number; catId: string; short: string; desc: string; tags: string[] };
  const others: OtherSeed[] = [
    { name: 'অর্গানিক মধু — সুন্দরবন', slug: 'organic-honey-sundarban', sku: 'ORG-001', base: 650, sale: 580, stock: 50, featured: true, imgId: 201, catId: organicCat.id, short: 'সুন্দরবনের খাঁটি ফুলের মধু — ১০০% প্রাকৃতিক।', desc: 'সুন্দরবন থেকে সংগ্রহ করা খাঁটি ফুলের মধু। কোনো কৃত্রিম রং বা preservative নেই।', tags: ['organic', 'honey', 'natural'] },
    { name: 'কোল্ড প্রেসড নারিকেল তেল', slug: 'cold-pressed-coconut-oil', sku: 'ORG-002', base: 480, stock: 35, featured: false, imgId: 212, catId: organicCat.id, short: 'ঐতিহ্যবাহী পদ্ধতিতে তৈরি খাঁটি নারিকেল তেল।', desc: 'কোল্ড প্রেস পদ্ধতিতে তৈরি ১০০% বিশুদ্ধ নারিকেল তেল। রান্না ও ত্বকের যত্নে সমান উপকারী।', tags: ['organic', 'coconut-oil'] },
    { name: 'অর্গানিক হলুদ গুঁড়া', slug: 'organic-turmeric-powder', sku: 'ORG-003', base: 220, sale: 190, stock: 80, featured: true, imgId: 223, catId: organicCat.id, short: 'কীটনাশকমুক্ত খাঁটি হলুদ গুঁড়া।', desc: 'রাসায়নিক সার ও কীটনাশকমুক্ত জমিতে চাষ করা হলুদ থেকে তৈরি বিশুদ্ধ গুঁড়া।', tags: ['organic', 'turmeric', 'spice'] },
    { name: 'শিশু সফট টয় — টেডি বেয়ার', slug: 'baby-teddy-bear', sku: 'BB-001', base: 750, sale: 620, stock: 40, featured: true, imgId: 301, catId: babyCat.id, short: 'নিরাপদ ও মোলায়েম টেডি বেয়ার।', desc: 'শিশুর কোমল ত্বকের জন্য নিরাপদ উপাদানে তৈরি নরম টেডি বেয়ার। BPA free ও non-toxic।', tags: ['baby', 'toy', 'soft-toy'] },
    { name: 'শিশু মশারি — সুতির', slug: 'baby-mosquito-net', sku: 'BB-002', base: 420, stock: 45, featured: false, imgId: 312, catId: babyCat.id, short: 'শিশুর নিরাপদ ঘুমের জন্য মশামুক্ত মশারি।', desc: 'শিশুর জন্য বিশেষভাবে তৈরি হালকা সুতির মশারি। mosquito থেকে শিশুকে সুরক্ষিত রাখে।', tags: ['baby', 'mosquito-net', 'cotton'] },
    { name: 'বাঁশের হাতপাখা', slug: 'bamboo-hand-fan', sku: 'HD-001', base: 320, sale: 280, stock: 60, featured: true, imgId: 401, catId: homeDecorCat.id, short: 'বাংলাদেশের ঐতিহ্যবাহী হাতপাখা — হস্তশিল্প।', desc: 'দক্ষ হস্তশিল্পীদের হাতে তৈরি ঐতিহ্যবাহী বাঁশের হাতপাখা। ঘর সাজাতে অনন্য।', tags: ['home-decor', 'handicraft', 'bamboo'] },
    { name: 'মাটির ফুলদানি — হ্যান্ডমেড', slug: 'handmade-clay-vase', sku: 'HD-002', base: 550, stock: 25, featured: true, imgId: 412, catId: homeDecorCat.id, short: 'রাজশাহীর মৃৎশিল্পীদের তৈরি অনন্য ফুলদানি।', desc: 'রাজশাহীর দক্ষ মৃৎশিল্পীদের হাতে তৈরি প্রতিটি ফুলদানি অনন্য শিল্পকর্ম।', tags: ['home-decor', 'clay', 'handmade'] },
    { name: 'নকশিকাঁথা — হস্তশিল্প', slug: 'nakshi-kantha', sku: 'HD-003', base: 1800, sale: 1500, stock: 12, featured: true, imgId: 423, catId: homeDecorCat.id, short: 'বাংলাদেশের ঐতিহ্যবাহী নকশিকাঁথা — হাতে সেলাই।', desc: 'দক্ষ কারিগরদের হাতে তৈরি ঐতিহ্যবাহী নকশিকাঁথা। প্রতিটি কাঁথাই অনন্য শিল্পকর্ম।', tags: ['home-decor', 'handicraft', 'nakshi-kantha'] },
    { name: 'চামড়ার হ্যান্ডব্যাগ — লেডিস', slug: 'leather-ladies-handbag', sku: 'LT-001', base: 2800, sale: 2400, stock: 15, featured: true, imgId: 501, catId: leatherCat.id, short: 'নরসিংদীর খাঁটি চামড়ায় তৈরি মহিলাদের হ্যান্ডব্যাগ।', desc: 'বাংলাদেশের সেরা চামড়া ব্যবহার করে দক্ষ কারিগরদের হাতে তৈরি এই হ্যান্ডব্যাগ।', tags: ['leather', 'handbag', 'ladies', 'premium'] },
    { name: 'চামড়ার পার্স — জেন্টস', slug: 'leather-mens-wallet', sku: 'LT-002', base: 950, sale: 820, stock: 30, featured: true, imgId: 512, catId: leatherCat.id, short: 'আসল চামড়ার পাতলা ও মজবুত পুরুষের পার্স।', desc: 'genuine leather দিয়ে তৈরি স্লিম ডিজাইনের পার্স। একাধিক কার্ড স্লট ও নোট কম্পার্টমেন্ট।', tags: ['leather', 'wallet', 'mens'] },
  ];

  for (const p of others) {
    await prisma.product.upsert({
      where: { slug: p.slug }, update: {},
      create: {
        name: p.name, slug: p.slug, sku: p.sku, basePrice: p.base, salePrice: p.sale ?? null,
        stockQuantity: p.stock, isFeatured: p.featured, isActive: true,
        shortDesc: p.short, description: p.desc, categoryId: p.catId, tags: p.tags,
        images: { create: [{ url: img(p.imgId, 500, 500), isPrimary: true, sortOrder: 0 }] },
      },
    });
  }
  console.log('✓ Other products (10)');

  console.log('\n✅ Seed complete! 22 products total.');
  console.log('   🔑 Admin:    admin@unkora.com / Admin@123456');
  console.log('   👤 Customer: customer@test.com / Customer@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
