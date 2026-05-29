'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { Loader2, Star, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  isPublished: boolean;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  product: { id: string; name: string; images?: { url: string }[] } | null;
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  totalPages: number;
}

type FilterTab = 'ALL' | 'PUBLISHED' | 'UNPUBLISHED';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const queryClient = useQueryClient();

  const filterParam =
    filter === 'PUBLISHED' ? true : filter === 'UNPUBLISHED' ? false : undefined;

  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['admin-reviews', page, filter],
    queryFn: () =>
      api
        .get('/reviews/admin', {
          params: {
            page,
            limit: 20,
            ...(filterParam !== undefined && { isPublished: filterParam }),
          },
        })
        .then(r => r.data.data),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) =>
      api.patch(`/reviews/admin/${id}/publish`, { isPublished: !current }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reviews/admin/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const tabs: FilterTab[] = ['ALL', 'PUBLISHED', 'UNPUBLISHED'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-muted-foreground">Moderate customer reviews</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => { setFilter(tab); setPage(1); }}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === tab
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.reviews?.length ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No reviews found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Reviewer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground min-w-[200px]">Review</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.reviews.map(review => {
                  const productName = review.product?.name ?? 'Unknown Product';
                  const productImg = review.product?.images?.[0]?.url;
                  const reviewerName = review.user
                    ? `${review.user.firstName} ${review.user.lastName}`.trim()
                    : 'Unknown';
                  const date = new Date(review.createdAt).toLocaleDateString('en-BD', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const isPending =
                    togglePublishMutation.isPending &&
                    (togglePublishMutation.variables as { id: string })?.id === review.id;
                  const isDeleting =
                    deleteMutation.isPending &&
                    deleteMutation.variables === review.id;

                  return (
                    <tr key={review.id} className="hover:bg-muted/20 transition-colors">
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {productImg ? (
                            <img
                              src={productImg}
                              alt={productName}
                              className="h-8 w-8 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex-shrink-0" />
                          )}
                          <span className="font-medium line-clamp-1 max-w-[120px]" title={productName}>
                            {productName}
                          </span>
                        </div>
                      </td>

                      {/* Reviewer */}
                      <td className="px-4 py-3">
                        <p className="font-medium">{reviewerName}</p>
                        <p className="text-xs text-muted-foreground">{review.user?.email}</p>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3">
                        <StarRating rating={review.rating} />
                      </td>

                      {/* Review text */}
                      <td className="px-4 py-3 text-muted-foreground max-w-[240px]">
                        <p className="line-clamp-2 text-xs">{review.comment}</p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {date}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            review.isPublished
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {review.isPublished ? 'Published' : 'Unpublished'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              togglePublishMutation.mutate({ id: review.id, current: review.isPublished })
                            }
                            disabled={isPending}
                            title={review.isPublished ? 'Unpublish' : 'Publish'}
                            className={`rounded-md p-1.5 transition-colors ${
                              review.isPublished
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : review.isPublished ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this review?')) {
                                deleteMutation.mutate(review.id);
                              }
                            }}
                            disabled={isDeleting}
                            title="Delete review"
                            className="rounded-md p-1.5 text-destructive transition-colors hover:bg-destructive/10"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {data.page} of {data.totalPages} &mdash; {data.total} reviews
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, data.totalPages))}
              disabled={page >= data.totalPages}
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
