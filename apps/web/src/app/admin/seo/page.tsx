'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, CheckCircle, XCircle, Edit2, Save, X, Globe } from 'lucide-react';
import api from '@/lib/api';

interface SeoProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  isActive: boolean;
  metaTitle: string | null;
  metaDesc: string | null;
  metaKeywords: string | null;
  hasMetaTitle: boolean;
  hasMetaDesc: boolean;
  keywordCount: number;
  category: { id: string; name: string };
}

interface SeoStats {
  totalProducts: number;
  productsWithMetaTitle: number;
  productsWithoutMetaTitle: number;
  productsWithMetaDesc: number;
  productsWithoutMetaDesc: number;
  productsWithKeywords: number;
  totalCategories: number;
  categoriesWithDesc: number;
  categoriesWithoutDesc: number;
  metaTitlePct: number;
  metaDescPct: number;
  keywordsPct: number;
}

interface SitemapInfo {
  products: { total: number; active: number; inactive: number };
  categories: { total: number; active: number; inactive: number };
  estimatedUrls: number;
}

interface EditRow {
  metaTitle: string;
  metaDesc: string;
  metaKeywords: string;
}

const inputCls =
  'w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring';

export default function SeoPage() {
  const [products, setProducts] = useState<SeoProduct[]>([]);
  const [stats, setStats] = useState<SeoStats | null>(null);
  const [sitemapInfo, setSitemapInfo] = useState<SitemapInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [missingOnly, setMissingOnly] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<EditRow>({ metaTitle: '', metaDesc: '', metaKeywords: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page };
      if (missingOnly) params.missingMeta = 'true';

      const [productsRes, statsRes, sitemapRes] = await Promise.all([
        api.get('/seo/products', { params }).then(r => r.data.data),
        api.get('/seo/stats').then(r => r.data.data),
        api.get('/seo/sitemap-info').then(r => r.data.data),
      ]);

      setProducts(Array.isArray(productsRes?.data) ? productsRes.data : []);
      setTotalPages(productsRes?.meta?.totalPages ?? 1);
      if (statsRes) setStats(statsRes);
      if (sitemapRes) setSitemapInfo(sitemapRes);
    } catch {
      setError('Failed to load SEO data');
    } finally {
      setLoading(false);
    }
  }, [page, missingOnly]);

  useEffect(() => { void loadData(); }, [loadData]);

  const startEdit = (p: SeoProduct) => {
    setEditingId(p.id);
    setEditRow({
      metaTitle: p.metaTitle ?? '',
      metaDesc: p.metaDesc ?? '',
      metaKeywords: p.metaKeywords ?? '',
    });
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
      setProducts(prev =>
        prev.map(p =>
          p.id === id
            ? {
                ...p,
                metaTitle: editRow.metaTitle || null,
                metaDesc: editRow.metaDesc || null,
                metaKeywords: editRow.metaKeywords || null,
                hasMetaTitle: Boolean(editRow.metaTitle),
                hasMetaDesc: Boolean(editRow.metaDesc),
                keywordCount: editRow.metaKeywords
                  ? editRow.metaKeywords.split(',').filter(Boolean).length
                  : 0,
              }
            : p,
        ),
      );
      setEditingId(null);
    } catch {
      setSaveError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const healthCards = stats
    ? [
        {
          label: 'Meta Title Coverage',
          value: `${stats.metaTitlePct}%`,
          sub: `${stats.productsWithMetaTitle} / ${stats.totalProducts} products`,
          color: stats.metaTitlePct >= 80 ? 'bg-green-50 text-green-700 border-green-200' : stats.metaTitlePct >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200',
        },
        {
          label: 'Meta Description Coverage',
          value: `${stats.metaDescPct}%`,
          sub: `${stats.productsWithMetaDesc} / ${stats.totalProducts} products`,
          color: stats.metaDescPct >= 80 ? 'bg-green-50 text-green-700 border-green-200' : stats.metaDescPct >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200',
        },
        {
          label: 'Keywords Coverage',
          value: `${stats.keywordsPct}%`,
          sub: `${stats.productsWithKeywords} / ${stats.totalProducts} products`,
          color: stats.keywordsPct >= 80 ? 'bg-green-50 text-green-700 border-green-200' : stats.keywordsPct >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200',
        },
        {
          label: 'Categories w/ Description',
          value: `${stats.categoriesWithDesc}`,
          sub: `${stats.categoriesWithoutDesc} missing`,
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold">SEO Tools</h1>
        <p className="text-sm text-muted-foreground">Manage product SEO metadata and monitor coverage</p>
      </div>

      {/* SEO Health Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {healthCards.map(card => (
            <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs font-semibold mt-0.5">{card.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sitemap Info Card */}
      {sitemapInfo && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Sitemap Overview</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Active Products</p>
              <p className="font-bold text-lg">{sitemapInfo.products.active}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Active Categories</p>
              <p className="font-bold text-lg">{sitemapInfo.categories.active}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Est. Sitemap URLs</p>
              <p className="font-bold text-lg">{sitemapInfo.estimatedUrls}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={missingOnly}
            onChange={e => { setMissingOnly(e.target.checked); setPage(1); }}
            className="h-4 w-4 rounded border"
          />
          Show only products missing SEO data
        </label>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-destructive">{error}</div>
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
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    {editingId === p.id ? (
                      /* Inline Edit Row */
                      <td colSpan={6} className="px-4 py-3">
                        <div className="space-y-2">
                          <p className="font-medium text-sm">{p.name}</p>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div>
                              <label className="mb-1 block text-xs text-muted-foreground">Meta Title</label>
                              <input
                                type="text"
                                value={editRow.metaTitle}
                                onChange={e => setEditRow(r => ({ ...r, metaTitle: e.target.value }))}
                                placeholder="Meta title..."
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-muted-foreground">Meta Description</label>
                              <input
                                type="text"
                                value={editRow.metaDesc}
                                onChange={e => setEditRow(r => ({ ...r, metaDesc: e.target.value }))}
                                placeholder="Meta description..."
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-muted-foreground">Keywords (comma-separated)</label>
                              <input
                                type="text"
                                value={editRow.metaKeywords}
                                onChange={e => setEditRow(r => ({ ...r, metaKeywords: e.target.value }))}
                                placeholder="keyword1, keyword2..."
                                className={inputCls}
                              />
                            </div>
                          </div>
                          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(p.id)}
                              disabled={saving}
                              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <p className="font-medium max-w-[200px] truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.category.name}</p>
                        </td>
                        <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground max-w-[180px] md:table-cell">
                          <p className="truncate">{p.slug}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.hasMetaTitle ? (
                            <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-red-400" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.hasMetaDesc ? (
                            <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="mx-auto h-4 w-4 text-red-400" />
                          )}
                        </td>
                        <td className="hidden px-4 py-3 text-center text-xs sm:table-cell">
                          {p.keywordCount > 0 ? (
                            <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
                              {p.keywordCount}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => startEdit(p)}
                            className="flex items-center gap-1.5 ml-auto rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit SEO
                          </button>
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

      {/* Pagination */}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1 || loading}
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        <span className="px-2 text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= totalPages || loading}
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
