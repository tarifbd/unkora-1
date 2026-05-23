import api from '@/lib/api';

export interface DashboardStats {
  revenue: { total: number; thisMonth: number; today: number };
  orders: { total: number; pending: number };
  products: { total: number; lowStock: number };
  customers: { total: number; newThisMonth: number };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: string | number;
    user: { firstName: string; lastName: string; email: string };
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    _sum: { quantity: number | null; totalPrice: string | null };
  }>;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
}

export const settingsApi = {
  getAnalytics: () => api.get('/settings/analytics').then(r => r.data.data as Record<string, string>),
  saveAnalytics: (data: Record<string, string>) => api.post('/settings/analytics', data).then(r => r.data.data),
};

export const adminApi = {
  getDashboardStats: (): Promise<DashboardStats> =>
    api.get('/admin/dashboard').then(r => r.data.data),
  getRevenueChart: (days = 30): Promise<RevenueChartPoint[]> =>
    api.get(`/admin/revenue-chart?days=${days}`).then(r => r.data.data),
  getUsers: (params?: Record<string, unknown>) =>
    api.get('/admin/users', { params }).then(r => r.data.data),
  getUserDetail: (id: string) =>
    api.get(`/admin/users/${id}`).then(r => r.data.data),
  updateUser: (id: string, data: { role?: string; status?: string }) =>
    api.patch(`/admin/users/${id}`, data).then(r => r.data.data),
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`).then(r => r.data.data),
  getOrdersByStatus: () =>
    api.get('/admin/analytics/orders-by-status').then(r => r.data.data as { status: string; count: number }[]),
  getCategorySales: () =>
    api.get('/admin/analytics/category-sales').then(r => r.data.data as { category: string; revenue: number }[]),
  getTopCustomers: () =>
    api.get('/admin/analytics/top-customers').then(r => r.data.data as { user: { id: string; firstName: string; lastName: string; email: string } | undefined; totalSpent: number; orderCount: number }[]),
};

// Refunds
export const refundsApi = {
  list: (params?: { status?: string; page?: number }) =>
    api.get('/refunds/admin', { params }).then(r => r.data.data),
  update: (id: string, data: { status: string; adminNote?: string }) =>
    api.patch(`/refunds/admin/${id}`, data).then(r => r.data.data),
};

// Flash Deals
export const flashDealsApi = {
  list: (params?: { page?: number }) =>
    api.get('/flash-deals/admin', { params }).then(r => r.data.data),
  create: (data: object) =>
    api.post('/flash-deals/admin', data).then(r => r.data.data),
  update: (id: string, data: object) =>
    api.patch(`/flash-deals/admin/${id}`, data).then(r => r.data.data),
  remove: (id: string) =>
    api.delete(`/flash-deals/admin/${id}`),
};

// Delivery Boys
export const deliveryBoysApi = {
  list: (params?: { status?: string; page?: number }) =>
    api.get('/delivery-boys', { params }).then(r => r.data.data),
  create: (data: object) =>
    api.post('/delivery-boys', data).then(r => r.data.data),
  update: (id: string, data: object) =>
    api.patch(`/delivery-boys/${id}`, data).then(r => r.data.data),
  remove: (id: string) =>
    api.delete(`/delivery-boys/${id}`),
  assignOrder: (id: string, orderId: string) =>
    api.post(`/delivery-boys/${id}/assign`, { orderId }).then(r => r.data.data),
};

// Blog
export const blogApi = {
  adminList: (params?: { status?: string; page?: number }) =>
    api.get('/blog/admin', { params }).then(r => r.data.data),
  create: (data: object) =>
    api.post('/blog/admin', data).then(r => r.data.data),
  update: (id: string, data: object) =>
    api.patch(`/blog/admin/${id}`, data).then(r => r.data.data),
  remove: (id: string) =>
    api.delete(`/blog/admin/${id}`),
};

// Wholesale
export const wholesaleApi = {
  get: (productId: string) =>
    api.get(`/products/${productId}/wholesale`).then(r => r.data.data),
  set: (productId: string, tiers: { minQty: number; price: number }[]) =>
    api.put(`/products/${productId}/wholesale`, { tiers }).then(r => r.data.data),
};
