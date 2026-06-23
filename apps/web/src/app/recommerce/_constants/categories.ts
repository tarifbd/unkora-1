export const RECOMMERCE_CATEGORIES = [
  { slug: 'electronics',  emoji: '📱', labelBn: 'ইলেকট্রনিক্স',        labelEn: 'Electronics' },
  { slug: 'furniture',    emoji: '🛋️', labelBn: 'আসবাবপত্র',           labelEn: 'Furniture' },
  { slug: 'vehicles',     emoji: '🚗', labelBn: 'যানবাহন',             labelEn: 'Vehicles' },
  { slug: 'clothing',     emoji: '👗', labelBn: 'পোশাক',               labelEn: 'Clothing' },
  { slug: 'books',        emoji: '📚', labelBn: 'বই',                  labelEn: 'Books' },
  { slug: 'appliances',   emoji: '🏠', labelBn: 'হোম অ্যাপ্লায়েন্স', labelEn: 'Appliances' },
  { slug: 'gaming',       emoji: '🎮', labelBn: 'গেমিং',               labelEn: 'Gaming' },
  { slug: 'kids',         emoji: '🧸', labelBn: 'শিশু পণ্য',           labelEn: 'Baby & Kids' },
  { slug: 'sports',       emoji: '⚽', labelBn: 'স্পোর্টস',            labelEn: 'Sports' },
  { slug: 'tools',        emoji: '🔧', labelBn: 'টুলস',                labelEn: 'Tools & DIY' },
  { slug: 'beauty',       emoji: '💄', labelBn: 'বিউটি',               labelEn: 'Beauty' },
  { slug: 'others',       emoji: '📦', labelBn: 'অন্যান্য',            labelEn: 'Others' },
] as const;

export type RecommerceCategory = typeof RECOMMERCE_CATEGORIES[number];

export const GRADE_META = {
  'A+': { label: 'প্রায় নতুন',   labelEn: 'Like New',    color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  'A':  { label: 'ভালো অবস্থা',  labelEn: 'Good',        color: 'bg-green-100 text-green-700 border-green-300' },
  'B':  { label: 'ব্যবহারযোগ্য', labelEn: 'Usable',      color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  'C':  { label: 'মেরামতযোগ্য',  labelEn: 'Fair',        color: 'bg-orange-100 text-orange-700 border-orange-300' },
} as const;

export const LOCATIONS = [
  'ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'ময়মনসিংহ', 'রংপুর',
] as const;
