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

// V2 types
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: { stocks: number; purchaseOrders: number };
}

export interface InventoryStock {
  id: string;
  warehouseId: string;
  productId: string;
  variantId?: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityDamaged: number;
  lowStockThreshold: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  updatedAt: string;
  product: {
    id: string; name: string; sku: string;
    basePrice: string; salePrice?: string | null;
    images: { url: string }[];
    category: { name: string };
  };
  warehouse: { id: string; name: string; code: string };
}

export interface InventoryMovementRecord {
  id: string;
  warehouseId: string;
  productId: string;
  variantId?: string | null;
  type: string;
  quantity: number;
  reference?: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  warehouse: { name: string; code: string };
}

export interface StockAdjustment {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string;
  createdBy: string;
  createdAt: string;
  warehouse: { name: string; code: string };
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  notes?: string;
  createdAt: string;
  _count?: { purchaseOrders: number };
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  status: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  expectedDate?: string;
  receivedAt?: string;
  notes?: string;
  subtotal: string;
  total: string;
  createdBy: string;
  createdAt: string;
  supplier: { name: string; code: string };
  warehouse: { name: string; code: string };
  _count?: { items: number };
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  variantId?: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: string;
  totalCost: string;
  note?: string;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  warehouseId?: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'EXPIRY_SOON';
  threshold?: number;
  currentQty?: number;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  product: { id: string; name: string; sku: string; images: { url: string }[] };
}

export interface DashboardStats {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  pendingAlerts: number;
  pendingPurchaseOrders: number;
  recentMovements: InventoryMovementRecord[];
}

const p = <T>(r: any) => r.data.data as T;

export const inventoryApi = {
  // V1 legacy
  getOverview: (page = 1, limit = 200, filter?: string) =>
    api.get('/inventory', { params: { page, limit, ...(filter ? { filter } : {}) } }).then(r => p<{ data: InventoryProduct[]; meta: InventoryMeta }>(r)),

  getLowStock: () =>
    api.get('/inventory/low-stock').then(r => p<InventoryProduct[]>(r)),

  getHistory: (productId: string, page = 1) =>
    api.get(`/inventory/${productId}/history`, { params: { page } }).then(r => p<{ data: StockMovement[]; meta: any }>(r)),

  adjust: (data: { productId: string; type: string; quantity: number; note?: string }) =>
    api.post('/inventory/adjust', data).then(r => p<any>(r)),

  // V2 dashboard
  getDashboard: () =>
    api.get('/inventory/v2/dashboard').then(r => p<DashboardStats>(r)),

  // V2 stocks
  getStocks: (page = 1, limit = 30, warehouseId?: string, status?: string) =>
    api.get('/inventory/v2/stocks', { params: { page, limit, warehouseId, status } }).then(r => p<{ data: InventoryStock[]; meta: any }>(r)),

  setStock: (data: { productId: string; variantId?: string; warehouseId: string; quantity: number; lowStockThreshold?: number; note?: string }) =>
    api.post('/inventory/v2/stocks/set', data).then(r => p<any>(r)),

  // V2 movements
  getMovements: (page = 1, limit = 30, productId?: string, warehouseId?: string, type?: string) =>
    api.get('/inventory/v2/movements', { params: { page, limit, productId, warehouseId, type } }).then(r => p<{ data: InventoryMovementRecord[]; meta: any }>(r)),

  // V2 adjustments
  getAdjustments: (page = 1, limit = 20, productId?: string) =>
    api.get('/inventory/v2/adjustments', { params: { page, limit, productId } }).then(r => p<{ data: StockAdjustment[]; meta: any }>(r)),

  createAdjustment: (data: { productId: string; variantId?: string; warehouseId: string; quantity: number; reason: string; note?: string }) =>
    api.post('/inventory/v2/adjustments', data).then(r => p<StockAdjustment>(r)),

  // V2 alerts
  getAlerts: (page = 1, limit = 20, resolved = false) =>
    api.get('/inventory/v2/alerts', { params: { page, limit, resolved } }).then(r => p<{ data: InventoryAlert[]; meta: any }>(r)),

  resolveAlert: (id: string) =>
    api.patch(`/inventory/v2/alerts/${id}/resolve`).then(r => p<InventoryAlert>(r)),

  // Warehouses
  getWarehouses: () =>
    api.get('/inventory/v2/warehouses').then(r => p<Warehouse[]>(r)),

  createWarehouse: (data: { name: string; code: string; address?: string; city?: string; isDefault?: boolean }) =>
    api.post('/inventory/v2/warehouses', data).then(r => p<Warehouse>(r)),

  updateWarehouse: (id: string, data: Partial<Warehouse>) =>
    api.put(`/inventory/v2/warehouses/${id}`, data).then(r => p<Warehouse>(r)),

  deleteWarehouse: (id: string) =>
    api.delete(`/inventory/v2/warehouses/${id}`).then(r => p<any>(r)),

  // Suppliers
  getSuppliers: (page = 1, limit = 20, status?: string) =>
    api.get('/inventory/v2/suppliers', { params: { page, limit, status } }).then(r => p<{ data: Supplier[]; meta: any }>(r)),

  getSupplier: (id: string) =>
    api.get(`/inventory/v2/suppliers/${id}`).then(r => p<Supplier>(r)),

  createSupplier: (data: Omit<Supplier, 'id' | 'createdAt' | 'status' | '_count'>) =>
    api.post('/inventory/v2/suppliers', data).then(r => p<Supplier>(r)),

  updateSupplier: (id: string, data: Partial<Supplier>) =>
    api.put(`/inventory/v2/suppliers/${id}`, data).then(r => p<Supplier>(r)),

  deleteSupplier: (id: string) =>
    api.delete(`/inventory/v2/suppliers/${id}`).then(r => p<any>(r)),

  // Purchase Orders
  getPurchaseOrders: (page = 1, limit = 20, status?: string) =>
    api.get('/inventory/v2/purchase-orders', { params: { page, limit, status } }).then(r => p<{ data: PurchaseOrder[]; meta: any }>(r)),

  getPurchaseOrder: (id: string) =>
    api.get(`/inventory/v2/purchase-orders/${id}`).then(r => p<PurchaseOrder & { items: PurchaseOrderItem[] }>(r)),

  createPurchaseOrder: (data: any) =>
    api.post('/inventory/v2/purchase-orders', data).then(r => p<PurchaseOrder>(r)),

  markOrdered: (id: string) =>
    api.patch(`/inventory/v2/purchase-orders/${id}/order`).then(r => p<PurchaseOrder>(r)),

  receivePO: (id: string, data: { items: { itemId: string; quantityReceived: number }[]; notes?: string }) =>
    api.post(`/inventory/v2/purchase-orders/${id}/receive`, data).then(r => p<PurchaseOrder>(r)),

  cancelPO: (id: string) =>
    api.patch(`/inventory/v2/purchase-orders/${id}/cancel`).then(r => p<PurchaseOrder>(r)),

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
