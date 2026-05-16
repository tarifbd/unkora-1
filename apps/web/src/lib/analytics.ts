// Browser-side analytics event helpers

declare global {
  interface Window {
    fbq?: (action: string, event: string, data?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackAddToCart(params: { productId: string; name: string; price: number; currency?: string }) {
  if (typeof window === 'undefined') return;
  // Meta Pixel
  window.fbq?.('track', 'AddToCart', {
    content_ids: [params.productId],
    content_name: params.name,
    value: params.price,
    currency: params.currency ?? 'BDT',
    content_type: 'product',
  });
  // GA4
  window.gtag?.('event', 'add_to_cart', {
    currency: params.currency ?? 'BDT',
    value: params.price,
    items: [{ item_id: params.productId, item_name: params.name, price: params.price }],
  });
  // GTM dataLayer
  window.dataLayer?.push({
    event: 'add_to_cart',
    ecommerce: { currency: params.currency ?? 'BDT', value: params.price, items: [{ item_id: params.productId, item_name: params.name }] },
  });
}

export function trackViewProduct(params: { productId: string; name: string; price: number; category?: string }) {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', 'ViewContent', {
    content_ids: [params.productId],
    content_name: params.name,
    value: params.price,
    currency: 'BDT',
    content_type: 'product',
  });
  window.gtag?.('event', 'view_item', {
    currency: 'BDT',
    value: params.price,
    items: [{ item_id: params.productId, item_name: params.name, item_category: params.category }],
  });
  window.dataLayer?.push({ event: 'view_item', ecommerce: { items: [{ item_id: params.productId, item_name: params.name }] } });
}

export function trackPurchase(params: { orderId: string; value: number; items: Array<{ id: string; name: string; price: number; quantity: number }> }) {
  if (typeof window === 'undefined') return;
  // Note: Purchase event is also fired server-side via CAPI for reliability
  window.fbq?.('track', 'Purchase', {
    value: params.value,
    currency: 'BDT',
    content_ids: params.items.map(i => i.id),
    content_type: 'product',
    num_items: params.items.reduce((s, i) => s + i.quantity, 0),
  });
  window.gtag?.('event', 'purchase', {
    transaction_id: params.orderId,
    value: params.value,
    currency: 'BDT',
    items: params.items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
  window.dataLayer?.push({ event: 'purchase', ecommerce: { transaction_id: params.orderId, value: params.value, currency: 'BDT', items: params.items } });
}
