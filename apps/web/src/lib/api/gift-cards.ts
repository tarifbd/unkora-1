import api from '@/lib/api';

export interface GiftCard {
  id: string;
  code: string;
  amount: string;
  balance: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'DISABLED';
  purchasedBy?: string;
  purchasedAt?: string;
  expiresAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  purchaser?: { id: string; firstName: string; lastName: string; email: string };
  _count?: { redemptions: number };
}

export interface GiftCardStats {
  total: number;
  active: number;
  totalValue: number;
  usedValue: number;
}

export const giftCardsApi = {
  adminList: (status?: string) =>
    api.get('/gift-cards/admin', { params: status ? { status } : undefined }).then(r => r.data.data as GiftCard[]),

  adminStats: () =>
    api.get('/gift-cards/admin/stats').then(r => r.data.data as GiftCardStats),

  adminCreate: (data: { code: string; amount: number; expiresAt?: string; note?: string }) =>
    api.post('/gift-cards/admin', data).then(r => r.data.data as GiftCard),

  adminUpdate: (id: string, data: { status?: string; note?: string }) =>
    api.patch(`/gift-cards/admin/${id}`, data).then(r => r.data.data as GiftCard),

  adminDelete: (id: string) =>
    api.delete(`/gift-cards/admin/${id}`),

  validate: (code: string) =>
    api.post('/gift-cards/validate', { code }).then(r => r.data.data),
};
