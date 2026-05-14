import api from '@/lib/api';

export const adminApi = {
  getDashboardStats: () => api.get('/admin/stats').then(r => r.data.data),
  getRevenueChart: (days = 30) => api.get(`/admin/revenue-chart?days=${days}`).then(r => r.data.data),
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }).then(r => r.data.data),
};
