import api from '@/lib/api';

export interface Shipment {
  id: string;
  orderId: string;
  courier: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED';
  estimatedAt?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    status: string;
    total: number;
    user?: { firstName: string; lastName: string; email: string };
    address?: { city: string; district: string };
  };
}

export const shipmentsApi = {
  getAll: (page = 1, limit = 20, status?: string) =>
    api.get('/shipments', { params: { page, limit, ...(status ? { status } : {}) } }).then(r => r.data.data),

  getOne: (id: string) =>
    api.get(`/shipments/${id}`).then(r => r.data.data),

  getMyShipment: (orderId: string) =>
    api.get(`/shipments/order/${orderId}`).then(r => r.data.data),

  create: (data: { orderId: string; courier: string; trackingNumber?: string; trackingUrl?: string; estimatedAt?: string; notes?: string }) =>
    api.post('/shipments', data).then(r => r.data.data),

  update: (id: string, data: { trackingNumber?: string; trackingUrl?: string; status?: string; estimatedAt?: string; notes?: string }) =>
    api.patch(`/shipments/${id}`, data).then(r => r.data.data),
};
