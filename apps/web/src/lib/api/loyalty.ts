import api from '@/lib/api';

export interface LoyaltyConfig {
  id: string;
  pointsPerTaka: number;
  pointValue: string;
  minRedeemPoints: number;
  maxRedeemPercent: number;
  expiryDays?: number;
  isActive: boolean;
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS' | 'REFERRAL' | 'ADJUSTED';
  points: number;
  balance: number;
  description?: string;
  orderId?: string;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
}

export interface LoyaltyStats {
  totalIssued: number;
  totalRedeemed: number;
  outstanding: number;
}

export const loyaltyApi = {
  getConfig: () =>
    api.get('/loyalty/config').then(r => r.data.data as LoyaltyConfig),

  updateConfig: (data: Partial<LoyaltyConfig>) =>
    api.patch('/loyalty/config', data).then(r => r.data.data as LoyaltyConfig),

  getTransactions: (params?: { page?: number; limit?: number }) =>
    api.get('/loyalty/transactions', { params }).then(r => r.data.data as { data: PointTransaction[]; total: number; page: number }),

  getStats: () =>
    api.get('/loyalty/stats').then(r => r.data.data as LoyaltyStats),

  getUserPoints: (userId: string) =>
    api.get(`/loyalty/users/${userId}/points`).then(r => r.data.data),

  adminAdjust: (data: { userId: string; points: number; description?: string }) =>
    api.post('/loyalty/admin/adjust', data).then(r => r.data.data),
};
