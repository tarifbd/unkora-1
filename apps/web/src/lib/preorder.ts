// Shared logic for deciding when a product should be treated as "pre-order".
// A product is pre-order when EITHER:
//   1. an admin explicitly marked it (isPreorder = true), OR
//   2. it's out of stock (stockQuantity <= 0), OR
//   3. its category / tags clearly say pre-order.
// Keeping this in one place so every card, badge and page agrees.

const PREORDER_KEYWORDS = ['preorder', 'pre-order', 'pre order', 'প্রি-অর্ডার', 'প্রিঅর্ডার'];

export interface Preorderable {
  isPreorder?: boolean;
  stockQuantity: number;
  tags?: string[];
  category?: { name?: string; slug?: string } | null;
}

export function isPreorderProduct(p: Preorderable): boolean {
  if (p.isPreorder) return true;
  if (p.stockQuantity <= 0) return true;

  const cat = `${p.category?.name ?? ''} ${p.category?.slug ?? ''}`.toLowerCase();
  if (PREORDER_KEYWORDS.some(k => cat.includes(k))) return true;

  if ((p.tags ?? []).some(t => PREORDER_KEYWORDS.some(k => t.toLowerCase().includes(k)))) return true;

  return false;
}
