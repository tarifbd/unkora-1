import api from '@/lib/api';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type PrepaymentType = 'NONE' | 'FIXED_AMOUNT' | 'PERCENTAGE' | 'FULL_PAYMENT';
export type PreorderConfigStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'COMPLETED' | 'CANCELLED';
export type PreorderOrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'WAITING_FOR_STOCK'
  | 'READY_TO_FULFILL'
  | 'CONVERTED_TO_ORDER'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'COMPLETED';
export type PreorderPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';
export type PreorderEventType =
  | 'CREATED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'CONFIRMED'
  | 'STOCK_AVAILABLE'
  | 'READY_TO_FULFILL'
  | 'CONVERTED_TO_ORDER'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'CUSTOMER_NOTIFIED'
  | 'ADMIN_NOTE_ADDED'
  | 'STATUS_CHANGED';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PreorderConfig {
  id: string;
  productId: string;
  variantId: string | null;
  isEnabled: boolean;
  preorderTitle: string | null;
  preorderDescription: string | null;
  expectedReleaseDate: string | null;
  expectedDeliveryStart: string | null;
  expectedDeliveryEnd: string | null;
  preorderStartDate: string | null;
  preorderEndDate: string | null;
  stockLimit: number | null;
  maxQtyPerCustomer: number | null;
  prepaymentRequired: boolean;
  prepaymentType: PrepaymentType;
  prepaymentAmount: string | null;
  preorderPrice: string | null;
  allowCancellation: boolean;
  cancellationDeadline: string | null;
  autoConvertToOrder: boolean;
  status: PreorderConfigStatus;
  createdAt: string;
  updatedAt: string;
  product?: { name: string; images: { url: string }[]; sku: string };
  _count?: { preorderOrders: number };
}

export interface PreorderEvent {
  id: string;
  preorderOrderId: string;
  eventType: PreorderEventType;
  message: string;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

export interface PreorderNotification {
  id: string;
  preorderOrderId: string;
  channel: string;
  notifType: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface PreorderOrder {
  id: string;
  preorderNumber: string;
  customerId: string | null;
  productId: string;
  variantId: string | null;
  configId: string;
  orderId: string | null;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  prepaymentAmount: string;
  remainingAmount: string;
  paymentStatus: PreorderPaymentStatus;
  preorderStatus: PreorderOrderStatus;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  shippingAddress: Record<string, string> | null;
  note: string | null;
  expectedDeliveryDate: string | null;
  convertedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  config?: PreorderConfig & { product: { name: string; images: { url: string }[] } };
  events?: PreorderEvent[];
  notifications?: PreorderNotification[];
}

export interface PreorderDashboardStats {
  totalConfigs: number;
  activeConfigs: number;
  totalOrders: number;
  pendingPayment: number;
  confirmed: number;
  readyToFulfill: number;
  converted: number;
  cancelled: number;
  totalRevenue: number;
  prepaidRevenue: number;
}

export interface PreorderListResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const preordersApi = {
  // Dashboard
  getDashboard: () =>
    api.get('/preorders/admin/dashboard').then(r => r.data.data as { stats: PreorderDashboardStats; recentOrders: PreorderOrder[] }),

  // Configs
  listConfigs: (params?: { status?: PreorderConfigStatus; page?: number; limit?: number }) =>
    api.get('/preorders/admin/configs', { params }).then(r => r.data.data as PreorderListResult<PreorderConfig>),

  getConfig: (id: string) =>
    api.get(`/preorders/admin/configs/${id}`).then(r => r.data.data as PreorderConfig),

  createConfig: (data: Partial<PreorderConfig>) =>
    api.post('/preorders/admin/configs', data).then(r => r.data.data as PreorderConfig),

  updateConfig: (id: string, data: Partial<PreorderConfig>) =>
    api.put(`/preorders/admin/configs/${id}`, data).then(r => r.data.data as PreorderConfig),

  deleteConfig: (id: string) =>
    api.delete(`/preorders/admin/configs/${id}`).then(r => r.data),

  setConfigStatus: (id: string, status: PreorderConfigStatus) =>
    api.patch(`/preorders/admin/configs/${id}/status`, { status }).then(r => r.data.data as PreorderConfig),

  markStockAvailable: (id: string) =>
    api.post(`/preorders/admin/configs/${id}/mark-stock-available`).then(r => r.data.data as { notified: number }),

  bulkConvert: (id: string) =>
    api.post(`/preorders/admin/configs/${id}/bulk-convert`).then(r => r.data.data as { id: string; success: boolean; orderId?: string }[]),

  // Orders (admin)
  listOrders: (params?: { configId?: string; status?: PreorderOrderStatus; page?: number; limit?: number }) =>
    api.get('/preorders/admin/orders', { params }).then(r => r.data.data as PreorderListResult<PreorderOrder>),

  getOrder: (id: string) =>
    api.get(`/preorders/admin/orders/${id}`).then(r => r.data.data as PreorderOrder),

  updateOrderStatus: (id: string, status: PreorderOrderStatus, note?: string) =>
    api.patch(`/preorders/admin/orders/${id}/status`, { status, note }).then(r => r.data.data as PreorderOrder),

  addNote: (id: string, note: string) =>
    api.post(`/preorders/admin/orders/${id}/note`, { note }).then(r => r.data.data),

  recordPayment: (id: string, amount: number) =>
    api.post(`/preorders/admin/orders/${id}/payment`, { amount }).then(r => r.data.data as PreorderOrder),

  adminCancelOrder: (id: string, reason: string) =>
    api.post(`/preorders/admin/orders/${id}/cancel`, { reason }).then(r => r.data.data as PreorderOrder),

  convertToOrder: (id: string) =>
    api.post(`/preorders/admin/orders/${id}/convert`).then(r => r.data.data as { alreadyConverted: boolean; orderId: string; orderNumber?: string }),

  // Customer
  myPreorders: (page = 1, limit = 10) =>
    api.get('/preorders/my', { params: { page, limit } }).then(r => r.data.data as PreorderListResult<PreorderOrder>),

  myOrder: (id: string) =>
    api.get(`/preorders/my/${id}`).then(r => r.data.data as PreorderOrder),

  placePreorder: (data: { configId: string; quantity: number; customerName: string; customerEmail?: string; customerPhone: string; shippingAddress?: Record<string, string>; note?: string }) =>
    api.post('/preorders/place', data).then(r => r.data.data as PreorderOrder),

  cancelMyPreorder: (id: string, reason: string) =>
    api.post(`/preorders/my/${id}/cancel`, { reason }).then(r => r.data.data as PreorderOrder),

  // Public
  getPublicConfig: (productId: string) =>
    api.get(`/preorders/public/product/${productId}`).then(r => r.data.data as PreorderConfig),

  trackByNumber: (preorderNumber: string) =>
    api.get(`/preorders/track/${preorderNumber}`).then(r => r.data.data as PreorderOrder),
};
