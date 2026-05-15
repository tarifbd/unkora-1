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
  category: { name: string };
}

export const inventoryApi = {
  getOverview: (page = 1, limit = 30) =>
    api.get('/inventory', { params: { page, limit } }).then(r => r.data.data),

  getLowStock: () =>
    api.get('/inventory/low-stock').then(r => r.data.data),

  getHistory: (productId: string, page = 1) =>
    api.get(`/inventory/${productId}/history`, { params: { page } }).then(r => r.data.data),

  adjust: (data: { productId: string; type: string; quantity: number; note?: string }) =>
    api.post('/inventory/adjust', data).then(r => r.data.data),
};
