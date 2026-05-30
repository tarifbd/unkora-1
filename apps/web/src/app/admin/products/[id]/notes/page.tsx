'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, ArrowLeft, StickyNote } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface ProductNote {
  id: string;
  note: string;
  createdBy?: string;
  createdAt: string;
}

interface ProductInfo { id: string; name: string; }

export default function ProductNotesPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  const { user } = useAuthStore();

  const [noteText, setNoteText] = useState('');
  const qc = useQueryClient();

  const { data: product } = useQuery<ProductInfo>({
    queryKey: ['product-basic', productId],
    queryFn: () => api.get<ProductInfo>(`/products/${productId}`).then(r => r.data),
    enabled: !!productId,
  });

  const { data: notes = [], isLoading } = useQuery<ProductNote[]>({
    queryKey: ['product-notes', productId],
    queryFn: () => api.get<ProductNote[]>(`/product-notes/product/${productId}`).then(r => r.data),
    enabled: !!productId,
  });

  const add = useMutation({
    mutationFn: (note: string) =>
      api.post(`/product-notes/product/${productId}`, {
        note,
        createdBy: user ? `${user.firstName} ${user.lastName}`.trim() : 'Admin',
      }).then(r => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['product-notes', productId] });
      setNoteText('');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/product-notes/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['product-notes', productId] }),
  });

  useEffect(() => { if (!productId) router.push('/admin/products'); }, [productId, router]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/admin/products/${productId}/edit`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold">Product Notes</h1>
          {product?.name && <p className="text-sm text-muted-foreground">{product.name}</p>}
        </div>
      </div>

      {/* Add note */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <label className="block text-sm font-semibold">Add Internal Note</label>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          rows={3}
          placeholder="Internal note visible only to admins…"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={() => add.mutate(noteText)}
            disabled={!noteText.trim() || add.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center">
          <StickyNote className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className="rounded-xl border bg-card p-4 flex gap-3">
              <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {n.createdBy && <span className="font-medium">{n.createdBy} · </span>}
                  {new Date(n.createdAt).toLocaleString('en-BD')}
                </p>
              </div>
              <button
                onClick={() => remove.mutate(n.id)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
