import api from '@/lib/api';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body?: string;
  isPublished: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

export interface ReviewSummary {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
}

export const reviewsApi = {
  getByProduct: (productId: string) =>
    api.get<{ data: ReviewSummary }>(`/reviews/product/${productId}`).then(r => r.data.data),

  getMyReview: (productId: string) =>
    api.get<{ data: Review | null }>(`/reviews/my/${productId}`).then(r => r.data.data),

  create: (data: { productId: string; rating: number; title?: string; body?: string }) =>
    api.post<{ data: Review }>('/reviews', data).then(r => r.data.data),

  update: (id: string, data: { rating?: number; title?: string; body?: string }) =>
    api.patch<{ data: Review }>(`/reviews/${id}`, data).then(r => r.data.data),

  delete: (id: string) =>
    api.delete(`/reviews/${id}`),

  adminGetAll: (params?: { page?: number; limit?: number }) =>
    api.get('/reviews/admin', { params }).then(r => r.data.data),

  adminPublish: (id: string, isPublished: boolean) =>
    api.patch(`/reviews/admin/${id}/publish`, { isPublished }).then(r => r.data.data),
};
