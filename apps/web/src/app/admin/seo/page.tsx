'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Loader2, CheckCircle, XCircle, Edit2, Save, X,
  Globe, Package, Tag, ArrowRight, Shield, Sliders, Map, AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { seoApi } from '@/lib/api/seo-advanced';

interface SeoProduct {
  id: string; name: string; slug: string; sku: string; isActive: boolean;
  metaTitle: string | null; metaDesc: string | null; metaKeywords: string | null;
  hasMetaTitle: boolean; hasMetaDesc: boolean; keywordCount: number;
  category: { id: string; name: string };
}

interface EditRow { metaTitle: string; metaDesc: string; metaKeywords: string; }

const inputCls = 'w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring';

const QUICK_ACTIONS = [
  { href: '/admin/seo/products', label: 'Product SEO', desc: 'Manage SEO for all products', icon: Package, color: '#8b5cf6' },
  { href: '/admin/seo/categories', label: 'Category SEO', desc: 'SEO for category pages', icon: Tag, color: '#06b6d4' },
  { href: '/admin/seo/redirects', label: 'Redirect Manager', desc: 'Manage 301/302 redirects', icon: ArrowRight, color: '#f59e0b' },
  { href: '/admin/seo/sitemap', label: 'Sitemap Manager', desc: 'Control sitemap entries', icon: Globe, color: '#10b981' },
  { href: '/admin/seo/robots', label: 'Robots.txt', desc: 'Configure crawler rules', icon: Shield, color: '#ef4444' },
  { href: '/admin/seo/settings', label: 'SEO Settings', desc: 'Global SEO configuration', icon: Sliders, color: '#6366f1' },
];

export default function SeoPage() {
  const [products, setProducts] = useState<SeoProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [missingOnly, setMissingOnly] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<EditRow>({ metaTitle: '', metaDesc: '', metaKeywords: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['seo-stats'],
    queryFn: seoApi.getStats,
    retry: 1,
  });

  const loadProducts = useCallback(async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      const params: Record<string, unknown> = { page };
      if (missingOnly) params.missingMeta = 'true';
      const res = await api.get('/seo/products', { params }).then(r => r.data.data);
      setProducts(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(res?.meta?.totalPages ?? 1);
    } catch {
      setTableError('Failed to load products');
    } finally {
      setTableLoading(false);
    }
  }, [page, missingOnly]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const startEdit = (p: SeoProduct) => {
    setEditingId(p.id);
    setEditRow({ metaTitle: p.metaTitle ?? '', metaDesc: p.metaDesc ?? '', metaKeywords: p.metaKeywords ?? '' });
    setSaveError(null);
  };

  const cancelEdit = () => { setEditingId(null); setSaveError(null); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.patch(`/seo/products/${id}`, {
        metaTitle: editRow.metaTitle || null,
        metaDesc: editRow.metaDesc || null,
        metaKeywords: editRow.metaKeywords || null,
      });
      setProducts(prev => prev.map(p => p.id === id ? {
        ...p,
        metaTitle: editRow.metaTitle || null, metaDesc: editRow.metaDesc || null,
        metaKeywords: editRow.metaKeywords || null,
        hasMetaTitle: Boolean(editRow.metaTitle), hasMetaDesc: Boolean(editRow.metaDesc),
        keywordCount: editRow.metaKeywords ? editRow.metaKeywords.split(',').filter(Boolean).length : 0,
      } : p));
      setEditingId(null);
    } catch { setSaveError('Failed to save'); }
    finally { setSaving(false); }
  };

  const s = stats as (typeof stats & { productsWithKeywords?: number; keywordsPct?: number; categoriesWithDesc?: number; categoriesWithoutDesc?: number }) | undefined;

  const statCards = s ? [
    {
      label: 'Meta Title Coverage',
      value: `${s.metaTitlePct ?? 0}%`,
      sub: `${s.productsWithMetaTitle ?? 0} / ${s.totalProducts ?? 0} products`,
      missing: s.productsWithoutMetaTitle ?? 0,
      pct: s.metaTitlePct ?? 0,
    },
    {
      label: 'Meta Description',
      value: `${s.metaDescPct ?? 0}%`,
      sub: `${s.productsWithMetaDesc ?? 0} / ${s.totalProducts ?? 0} products`,
      missing: s.productsWithoutMetaDesc ?? 0,
      pct: s.metaDescPct ?? 0,
    },
    {
      label: 'Keywords Coverage',
      value: `${s.keywordsPct ?? 0}%`,
      sub: `${s.productsWithKeywords ?? 0} / ${s.totalProducts ?? 0} products`,
      missing: 0,
      pct: s.keywordsPct ?? 0,
    },
    {
      label: 'Total Categories',
      value: `${s.totalCategories ?? 0}`,
      sub: `${s.categoriesWithDesc ?? 0} with descriptions`,
      missing: 0,
      pct: 100,
    },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold">Advanced SEO</h1>
        <p className="text-sm text-muted-foreground">Manage SEO across your entire store</p>
      </div>

      {/* Stats */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map(card => (
            <div key={card.label} className={`rounded-xl border p-4 ${card.pct >= 80 ? 'bg-green-50 border-green-200 text-green-700' : card.pct >= 50 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs font-semibold mt-0.5">{card.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">SEO Tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map(action => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl border bg-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4"
            >
              <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: action.color + '15' }}>
                <action.icon className="h-5 w-5" style={{ color: action.color }} />
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* SEO Health Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">SEO Health — Products</h2>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={missingOnly} onChange={e => { setMissingOnly(e.target.checked); setPage(1); }} className="h-4 w-4 rounded border" />
            Missing meta only
          </label>
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          {tableLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tableError ? (
            <div className="py-10 text-center text-sm text-destructive flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" /> {tableError}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              No products found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Product</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Slug</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Desc</th>
                    <th className="hidden px-4 py-3 text-center text-xs font-semibold text-muted-foreground sm:table-cell">Keywords</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      {editingId === p.id ? (
                        <td colSpan={6} className="px-4 py-3">
                          <div className="space-y-2">
                            <p className="font-medium text-sm">{p.name}</p>
                            <div className="grid gap-2 sm:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">Meta Title</label>
                                <input type="text" value={editRow.metaTitle} onChange={e => setEditRow(r => ({ ...r, metaTitle: e.target.value }))} placeholder="Meta title..." className={inputCls} />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">Meta Description</label>
                                <input type="text" value={editRow.metaDesc} onChange={e => setEditRow(r => ({ ...r, metaDesc: e.target.value }))} placeholder="Meta description..." className={inputCls} />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-muted-foreground">Keywords</label>
                                <input type="text" value={editRow.metaKeywords} onChange={e => setEditRow(r => ({ ...r, metaKeywords: e.target.value }))} placeholder="kw1, kw2..." className={inputCls} />
                              </div>
                            </div>
                            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(p.id)} disabled={saving} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                              </button>
                              <button onClick={cancelEdit} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                                <X className="h-3 w-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <p className="font-medium max-w-[200px] truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.category?.name}</p>
                          </td>
                          <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground max-w-[180px] md:table-cell">
                            <p className="truncate">{p.slug}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.hasMetaTitle ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-red-400" />}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.hasMetaDesc ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" /> : <XCircle className="mx-auto h-4 w-4 text-red-400" />}
                          </td>
                          <td className="hidden px-4 py-3 text-center text-xs sm:table-cell">
                            {p.keywordCount > 0 ? (
                              <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">{p.keywordCount}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button onClick={() => startEdit(p)} className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                                <Edit2 className="h-3 w-3" /> Edit
                              </button>
                              <Link href={`/admin/seo/products/${p.id}`} className="flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                                <Map className="h-3 w-3" /> Full Edit
                              </Link>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-1 mt-3">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1 || tableLoading} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 transition-colors">Prev</button>
          <span className="px-2 text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages || tableLoading} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
