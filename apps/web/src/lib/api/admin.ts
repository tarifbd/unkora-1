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
