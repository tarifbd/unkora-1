'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { reviewsApi } from '@/lib/api/reviews';
import { useAuthStore } from '@/store/auth.store';

interface ProductReviewsProps {
  productId: string;
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'fill-brand-500 text-brand-500' : 'fill-muted text-muted-foreground'}`}
        />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const starVal = i + 1;
        const active = hovered ? starVal <= hovered : starVal <= value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starVal)}
            onMouseEnter={() => setHovered(starVal)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
          >
            <Star className={`h-6 w-6 ${active ? 'fill-brand-500 text-brand-500' : 'fill-muted text-muted-foreground'}`} />
          </button>
        );
      })}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="animate-pulse space-y-2 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-3/4 rounded bg-muted" />
    </div>
  );
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.getByProduct(productId),
  });

  const { data: myReview, isLoading: myReviewLoading } = useQuery({
    queryKey: ['my-review', productId],
    queryFn: () => reviewsApi.getMyReview(productId),
    enabled: isAuthenticated,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['reviews', productId] });
    void qc.invalidateQueries({ queryKey: ['my-review', productId] });
  };

  const createMutation = useMutation({
    mutationFn: reviewsApi.create,
    onSuccess: () => { invalidate(); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { rating?: number; title?: string; body?: string } }) =>
      reviewsApi.update(id, data),
    onSuccess: () => { invalidate(); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: reviewsApi.delete,
    onSuccess: invalidate,
  });

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormRating(5);
    setFormTitle('');
    setFormBody('');
  };

  const startEdit = (review: NonNullable<typeof myReview>) => {
    setEditId(review.id);
    setFormRating(review.rating);
    setFormTitle(review.title ?? '');
    setFormBody(review.body ?? '');
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, data: { rating: formRating, title: formTitle, body: formBody } });
    } else {
      createMutation.mutate({ productId, rating: formRating, title: formTitle, body: formBody });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const showForm = isAuthenticated && !myReviewLoading && (!myReview || isEditing);

  return (
    <div className="mt-10 border-t pt-8">
      <h2 className="mb-6 font-serif text-xl font-bold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" /> Customer Reviews
      </h2>

      {/* Summary */}
      {!isLoading && summary && (
        <div className="mb-6 flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-brand-600">{summary.averageRating.toFixed(1)}</p>
            <StarRating rating={Math.round(summary.averageRating)} />
            <p className="mt-1 text-xs text-muted-foreground">{summary.totalCount} review{summary.totalCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* My Review (display mode) */}
      {isAuthenticated && !myReviewLoading && myReview && !isEditing && (
        <div className="mb-6 rounded-xl border-2 border-brand-200 bg-brand-50/30 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-700">Your Review</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(myReview)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-accent transition-colors"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => { if (confirm('Delete your review?')) deleteMutation.mutate(myReview.id); }}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>
          <StarRating rating={myReview.rating} />
          {myReview.title && <p className="mt-2 font-medium text-sm">{myReview.title}</p>}
          {myReview.body && <p className="mt-1 text-sm text-muted-foreground">{myReview.body}</p>}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm">{editId ? 'Edit Your Review' : 'Write a Review'}</h3>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Rating</label>
            <StarPicker value={formRating} onChange={setFormRating} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Title <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Review <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea
              value={formBody}
              onChange={e => setFormBody(e.target.value)}
              rows={4}
              placeholder="Share your thoughts about this product..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editId ? 'Update Review' : 'Submit Review'}
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="rounded-md px-4 py-2 text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {!isAuthenticated && (
        <div className="mb-6 rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          <a href="/login" className="text-brand-600 font-medium hover:underline">Sign in</a> to leave a review
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          <ReviewSkeleton />
          <ReviewSkeleton />
        </div>
      ) : summary && summary.reviews.length > 0 ? (
        <div className="space-y-4">
          {summary.reviews.map(review => (
            <div key={review.id} className="rounded-lg border bg-card p-4">
              <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {review.user.firstName[0]}{review.user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.user.firstName} {review.user.lastName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>
              {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
              {review.body && <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
        </div>
      )}
    </div>
  );
}
