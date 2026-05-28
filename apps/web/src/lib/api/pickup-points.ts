import api from '@/lib/api';

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone?: string;
  openHours?: string;
  mapUrl?: string;
  isActive: boolean;
  sortOrder?: number;
}

export const pickupPointsApi = {
  getActive: () => api.get('/pickup-points').then(r => r.data.data as PickupPoint[]),
};
