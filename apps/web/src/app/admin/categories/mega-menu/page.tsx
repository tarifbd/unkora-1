'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, ChevronUp, ChevronDown, Eye, EyeOff, Save, LayoutGrid,
} from 'lucide-react';
import api from '@/lib/api';
import { categoriesApi, type Category } from '@/lib/api/products';
import { toast } from 'sonner';

const ICON_OPTIONS = ['📚', '👶', '👜', '🌿', '🎨', '⚡', '🛒', '🍳', '💄', '🏏', '🎵', '🖥️', '🧴', '🏠', '🌸'];

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  isFeatured: boolean;
  sortOrder: number;
  icon?: string;
  imageUrl?: string;
  color?: string;
}

export default function MegaMenuPage() {
  const qc = useQueryClient();
  const [iconPickerFor, setIconPickerFor] = useState<string | null>(null);

  const { data: allCategories = [], isLoading } = useQuery<(Category & { children?: Category[] })[]>({
    queryKey: ['categories-all-admin'],
    queryFn: () => categoriesApi.getAll(true),
  });

  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [synced, setSynced] = useState(false);

  if (allCategories.length > 0 && !synced) {
    setSynced(true);
    setRows(
      [...allCategories]
        .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
        .map((c, i) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          isFeatured: c.isFeatured ?? false,
          sortOrder: c.sortOrder ?? i,
          icon: c.icon,
          imageUrl: c.imageUrl,
          color: c.color,
        }))
    );
  }

  const updateMut = useMutation({
    mutationFn: (row: CategoryRow) =>
      api.patch(`/categories/${row.id}`, {
        isFeatured: row.isFeatured,
        sortOrder: row.sortOrder,
        icon: row.icon,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories-all-admin'] }),
  });

  const handleSaveAll = async () => {
    try {
      await Promise.all(rows.map(r => updateMut.mutateAsync(r)));
      toast.success('Mega menu saved');
    } catch {
      toast.error('Failed to save some categories');
    }
  };

  const move = (idx: number, dir: 'up' | 'down') => {
    setRows(prev => {
      const next = [...prev];
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      const tmp = next[idx]!; next[idx] = next[swapIdx]!; next[swapIdx] = tmp;
      return next.map((r, i) => ({ ...r, sortOrder: i }));
    });
  };

  const toggleFeatured = (id: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, isFeatured: !r.isFeatured } : r));
  };

  const setIcon = (id: string, icon: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, icon } : r));
    setIconPickerFor(null);
  };

  const featured = rows.filter(r => r.isFeatured);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Mega Menu Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose which categories appear in the navigation and set their order</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={updateMut.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Menu
        </button>
      </div>

      {/* Live preview strip */}
      {featured.length > 0 && (
        <div className="rounded-xl border p-4 bg-gray-900">
          <p className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider">Live Nav Preview</p>
          <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
            {featured.map(r => (
              <div key={r.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
                  {r.icon ?? '📦'}
                </div>
                <span className="text-[10px] text-white/70 font-medium truncate w-14 text-center">{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-green-600" /> Shown in nav</span>
        <span className="flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5 text-gray-400" /> Hidden</span>
        <span className="flex items-center gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> {featured.length} of {rows.length} categories visible</span>
      </div>

      {/* Category rows */}
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-muted/50 border-b px-4 py-2.5 grid grid-cols-[2rem_1fr_auto_auto_auto] gap-3 items-center text-xs font-semibold text-muted-foreground">
          <span>Order</span>
          <span>Category</span>
          <span>Icon</span>
          <span className="text-center">In Nav</span>
          <span className="w-16" />
        </div>
        {rows.map((row, idx) => (
          <div
            key={row.id}
            className={`px-4 py-3 grid grid-cols-[2rem_1fr_auto_auto_auto] gap-3 items-center border-b last:border-0 transition-colors ${row.isFeatured ? 'bg-green-50/50' : 'hover:bg-muted/20'}`}
          >
            {/* Sort order number */}
            <span className="text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}</span>

            {/* Name */}
            <div>
              <p className="font-semibold text-sm">{row.name}</p>
              <p className="text-xs text-muted-foreground">/categories/{row.slug}</p>
            </div>

            {/* Icon picker */}
            <div className="relative">
              <button
                onClick={() => setIconPickerFor(iconPickerFor === row.id ? null : row.id)}
                className="w-9 h-9 rounded-lg border text-xl flex items-center justify-center hover:bg-accent transition-colors"
                title="Change icon"
              >
                {row.icon ?? '📦'}
              </button>
              {iconPickerFor === row.id && (
                <div className="absolute left-0 top-10 z-20 bg-background border rounded-xl shadow-xl p-3 grid grid-cols-5 gap-1.5 w-44">
                  {ICON_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(row.id, emoji)}
                      className="w-8 h-8 rounded-lg hover:bg-accent text-lg flex items-center justify-center transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Featured toggle */}
            <div className="flex justify-center">
              <button
                onClick={() => toggleFeatured(row.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${row.isFeatured ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${row.isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Move up/down */}
            <div className="flex gap-1 w-16 justify-end">
              <button
                onClick={() => move(idx, 'up')}
                disabled={idx === 0}
                className="p-1 rounded hover:bg-accent disabled:opacity-20 transition-colors">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => move(idx, 'down')}
                disabled={idx === rows.length - 1}
                className="p-1 rounded hover:bg-accent disabled:opacity-20 transition-colors">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <LayoutGrid className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No categories found. Add categories first.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={updateMut.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Mega Menu
        </button>
      </div>
    </div>
  );
}
