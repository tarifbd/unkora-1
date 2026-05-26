import api from '@/lib/api';

export interface Referral {
  id: string;
  referralCodeId: string;
  referredUserId: string;
  referrerId: string;
  rewardAmount: string;
  isPaid: boolean;
  createdAt: string;
  paidAt?: string;
  referredUser?: { id: string; firstName: string; lastName: string; email: string };
  referrer?: { id: string; firstName: string; lastName: string; email: string };
  referralCode?: { code: string };
}

export interface ReferralStats {
  total: number;
  paid: number;
  unpaid: number;
  totalRewards: string | number;
}

export const referralsApi = {
  adminList: (params?: { page?: number; limit?: number }) =>
    api.get('/referrals/admin', { params }).then(r => r.data.data as { data: Referral[]; total: number }),

  adminStats: () =>
    api.get('/referrals/admin/stats').then(r => r.data.data as ReferralStats),

  markPaid: (id: string) =>
    api.patch(`/referrals/admin/${id}/pay`).then(r => r.data.data as Referral),

  getMyReferral: () =>
    api.get('/referrals/my').then(r => r.data.data),
};
