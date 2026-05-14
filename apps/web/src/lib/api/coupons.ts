import api from '@/lib/api';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
  minOrderValue?: string;
  maxDiscount?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface CouponValidation {
  valid: boolean;
  coupon: Coupon;
  discountAmount: number;
}

export const couponsApi = {
  validate: (code: string, orderTotal: number) =>
    api.post<{ data: CouponValidation }>('/coupons/validate', { code, orderTotal }).then(r => r.data.data),

  adminGetAll: () =>
    api.get('/coupons/admin').then(r => r.data.data),

  adminCreate: (data: Record<string, unknown>) =>
    api.post('/coupons/admin', data).then(r => r.data.data),

  adminToggle: (id: string) =>
    api.patch(`/coupons/admin/${id}/toggle`).then(r => r.data.data),

  adminDelete: (id: string) =>
    api.delete(`/coupons/admin/${id}`),
};
