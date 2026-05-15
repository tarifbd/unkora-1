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
};
