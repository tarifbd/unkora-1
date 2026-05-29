import api from '@/lib/api';

export type PaymentMethod = 'BKASH' | 'NAGAD' | 'COD' | 'CARD' | 'BANK_TRANSFER';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface OrderItem {
  id: string; productId: string; quantity: number;
  price: string; productName: string;
  product?: { name?: string; slug?: string; images?: Array<{ url: string }>; bookDetail?: { author?: string } };
}
export interface Order {
  id: string; orderNumber: string; status: OrderStatus;
  paymentStatus: string; paymentMethod: PaymentMethod;
  subtotal: string; shippingCost: string; discount: string; total: string;
  shippingAddress: Record<string, string>; notes?: string;
  items: OrderItem[]; createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  customer?: { name?: string; email?: string };
  timeline?: { status: OrderStatus; note?: string; createdAt: string }[];
}
export interface PaginatedOrders {
  data: Order[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const ordersApi = {
  create: (data: { addressId: string; paymentMethod: PaymentMethod; notes?: string; couponCode?: string }) =>
    api.post('/orders', data).then(r => r.data.data as Order),

  createGuest: (data: {
    items: { productId: string; quantity: number }[];
    shippingAddress: Record<string, unknown>;
    paymentMethod: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    notes?: string;
    deviceFingerprint?: string;
    geoLat?: number;
    geoLng?: number;
  }) => api.post('/orders/guest', data).then(r => r.data.data as Order),

  getMyOrders: (params: { page?: number; limit?: number } = {}) =>
    api.get('/orders/my', { params }).then(r => r.data.data as PaginatedOrders),

  getById: (id: string) =>
    api.get(`/orders/my/${id}`).then(r => r.data.data as Order),

  cancel: (id: string, reason?: string) =>
    api.patch(`/orders/my/${id}/cancel`, { reason }).then(r => r.data.data as Order),

  adminGetAll: (params: { page?: number; limit?: number; status?: string; search?: string; dateFrom?: string; dateTo?: string } = {}) =>
    api.get('/orders/admin/all', { params }).then(r => r.data.data as PaginatedOrders),

  adminGetById: (id: string) =>
    api.get(`/orders/admin/${id}`).then(r => r.data.data as Order),

  adminUpdateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/orders/admin/${id}/status`, { status, note }).then(r => r.data.data as Order),

  trackPublic: (orderNumber: string, phone: string) =>
    api.get('/orders/track', { params: { orderNumber, phone } }).then(r => r.data.data),

  initiateBkash: (orderId: string) => api.post(`/payments/${orderId}/bkash`),
  initiateNagad: (orderId: string) => api.post(`/payments/${orderId}/nagad`),
  confirmCOD: (orderId: string) => api.post(`/payments/${orderId}/cod`),
};
