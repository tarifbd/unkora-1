'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2 } from 'lucide-react';
import { wishlistApi } from '@/lib/api/wishlist';
import { useAuthStore } from '@/store/auth.store';
import { useGuestWishlist } from '@/store/guest-wishlist.store';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const guestWishlist = useGuestWishlist();

  // Server wishlist for authenticated users
  const { data } = useQuery({
    queryKey: ['wishlist-check', productId],
    queryFn: () => wishlistApi.check(productId),
    enabled: isAuthenticated,
  });

  const toggle = useMutation({
    mutationFn: () => wishlistApi.toggle(productId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['wishlist-check', productId] });
      const prev = qc.getQueryData<{ wishlisted: boolean }>(['wishlist-check', productId]);
      qc.setQueryData(['wishlist-check', productId], { wishlisted: !prev?.wishlisted });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['wishlist-check', productId], ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['wishlist-check', productId] });
      void qc.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      toggle.mutate();
    } else {
      guestWishlist.toggle(productId);
    }
  };

  const wishlisted = isAuthenticated
    ? (data?.wishlisted ?? false)
    : guestWishlist.isWishlisted(productId);

  const pending = toggle.isPending;

  return (
    <button
      onClick={handleClick}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className={cn('flex items-center justify-center rounded-full transition-all', pending && 'opacity-50 cursor-not-allowed', className)}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart className={cn('h-5 w-5 transition-colors', wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400')} />
      )}
    </button>
  );
}
