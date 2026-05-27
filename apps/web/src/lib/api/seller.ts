import api from '@/lib/api';

export interface SellerProfile {
  id: string;
  userId: string;
  shopName: string;
  shopSlug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  phone?: string;
  address?: string;
  nidNumber?: string;
  bankAccount?: string;
  bankName?: string;
  commissionRate: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  isVerified: boolean;
  totalSales: string;
  totalOrders: number;
  rating: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}

export interface SellerEarnings {
  commissionRate: number;
  totalGross: number;
  totalEarned: number;
  withdrawn: number;
  pendingWithdrawal: number;
  available: number;
  deliveredOrders: number;
  pendingOrders: number;
  totalProducts: number;
}

export interface SellerWithdrawal {
  id: string;
  sellerId: string;
  amount: string;
  method: string;
  status: string;
  note?: string;
  processedAt?: string;
  createdAt: string;
}

export interface BookSubmissionWithProduct {
  id: string;
  userId: string;
  title: string;
  authorName: string;
  publisherName?: string;
  language: string;
  suggestedPrice: string;
  royaltyPercent: number;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  adminNote?: string;
  productId?: string;
  createdAt: string;
  product?: {
    id: string; name: string; slug: string;
    stockQuantity: number; isActive: boolean;
    images: { url: string }[];
  };
}

export const sellerApi = {
  /** Check own seller status (no throw) */
  myStatus: () =>
    api.get('/sellers/me/status').then(r => r.data.data as SellerProfile | null),

  /** Get full seller profile */
  getMe: () =>
    api.get('/sellers/me').then(r => r.data.data as SellerProfile),

  /** Update own profile */
  updateMe: (data: Partial<SellerProfile>) =>
    api.patch('/sellers/me', data).then(r => r.data.data as SellerProfile),

  /** Apply to become a seller */
  apply: (data: {
    shopName: string; shopSlug: string; description?: string;
    phone?: string; address?: string; nidNumber?: string;
    bankAccount?: string; bankName?: string;
  }) => api.post('/sellers/apply', data).then(r => r.data.data as SellerProfile),

  /** My submitted books */
  mySubmissions: (page = 1) =>
    api.get('/sellers/me/submissions', { params: { page } }).then(r => r.data.data as {
      data: BookSubmissionWithProduct[];
      meta: { total: number; page: number; totalPages: number };
    }),

  /** Orders for my products */
  myOrders: (page = 1) =>
    api.get('/sellers/me/orders', { params: { page } }).then(r => r.data.data as {
      data: any[];
      meta: { total: number; page: number; totalPages: number };
    }),

  /** Earnings breakdown */
  myEarnings: () =>
    api.get('/sellers/me/earnings').then(r => r.data.data as SellerEarnings),

  /** My withdrawals */
  myWithdrawals: (page = 1) =>
    api.get('/sellers/me/withdrawals', { params: { page } }).then(r => r.data.data as {
      data: SellerWithdrawal[];
      meta: { total: number; page: number; totalPages: number };
    }),

  /** Request withdrawal */
  requestWithdrawal: (data: { amount: number; method: string; note?: string }) =>
    api.post('/sellers/me/withdrawals', data).then(r => r.data.data as SellerWithdrawal),
};
