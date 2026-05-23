import api from '@/lib/api';

export interface StockMovement {
  id: string;
  productId: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  note?: string;
  createdAt: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  stockQuantity: number;
  basePrice: string | number;
  salePrice?: string | number | null;
  category: { name: string };
  images: { url: string }[];
}

export interface InventoryMeta {
  total: number;
  page: number;
  limit: number;
  outCount: number;
  lowCount: number;
}

export const inventoryApi = {
  getOverview: (page = 1, limit = 200, filter?: string) =>
    api.get('/inventory', { params: { page, limit, ...(filter ? { filter } : {}) } }).then(r => r.data as { data: InventoryProduct[]; meta: InventoryMeta }),

  getLowStock: () =>
    api.get('/inventory/low-stock').then(r => r.data.data as InventoryProduct[]),

  getHistory: (productId: string, page = 1) =>
    api.get(`/inventory/${productId}/history`, { params: { page } }).then(r => r.data.data as StockMovement[]),

  adjust: (data: { productId: string; type: string; quantity: number; note?: string }) =>
    api.post('/inventory/adjust', data).then(r => r.data.data),

  exportCsv: (products: InventoryProduct[]) => {
    const rows = [
      ['Name', 'SKU', 'Category', 'Stock', 'Unit Price (৳)', 'Stock Value (৳)'],
      ...products.map(p => {
        const price = Number(p.salePrice ?? p.basePrice);
        return [p.name, p.sku ?? '', p.category.name, p.stockQuantity, price.toFixed(2), (price * p.stockQuantity).toFixed(2)];
      }),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
