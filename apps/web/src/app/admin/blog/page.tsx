'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { blogApi } from '@/lib/api/admin';

interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  author?: { id: string; firstName: string; lastName: string } | string;
  authorName?: string;
  tags?: string[];
  status: string;
  publishedAt?: string;
  createdAt: string;
}

interface BlogData {
  data?: BlogPost[];
  posts?: BlogPost[];
  items?: BlogPost[];
  total?: number;
  totalPages?: number;
  page?: number;
  meta?: { total: number; totalPages: number; page: number };
}

type FilterTab = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700',
  DRAFT:     'bg-yellow-100 text-yellow-700',
  ARCHIVED:  'bg-gray-100 text-gray-600',
};

export default function AdminBlogPage() {
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string; page?: number } = { page };
      if (filter !== 'ALL') params.status = filter;
      const result = await blogApi.adminList(params);
      setData(result);
    } catch {
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { void load(); }, [load]);

  const posts: BlogPost[] = data?.data ?? data?.posts ?? data?.items ?? (Array.isArray(data) ? (data as BlogPost[]) : []);

  const total     = data?.meta?.total ?? data?.total ?? posts.length;
  const published = posts.filter(p => p.status === 'PUBLISHED').length;
  const draft     = posts.filter(p => p.status === 'DRAFT').length;
  const archived  = posts.filter(p => p.status === 'ARCHIVED').length;

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await blogApi.remove(id);
      setData(prev => {
        if (!prev) return prev;
        if (prev.data) return { ...prev, data: prev.data.filter(p => p.id !== id) };
        if (prev.posts) return { ...prev, posts: prev.posts.filter(p => p.id !== id) };
        if (prev.items) return { ...prev, items: prev.items.filter(p => p.id !== id) };
        return prev;
      });
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  };

  const tabs: FilterTab[] = ['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground">Manage your blog posts</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border p-4 bg-blue-50 border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{total}</p>
          <p className="text-xs font-medium text-blue-700 mt-0.5">Total Posts</p>
        </div>
        <div className="rounded-xl border p-4 bg-green-50 border-green-200">
          <p className="text-2xl font-bold text-green-700">{published}</p>
          <p className="text-xs font-medium text-green-700 mt-0.5">Published</p>
        </div>
        <div className="rounded-xl border p-4 bg-yellow-50 border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{draft}</p>
          <p className="text-xs font-medium text-yellow-700 mt-0.5">Draft</p>
        </div>
        <div className="rounded-xl border p-4 bg-gray-50 border-gray-200">
          <p className="text-2xl font-bold text-gray-600">{archived}</p>
          <p className="text-xs font-medium text-gray-600 mt-0.5">Archived</p>
        </div>
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
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-destructive">{error}</div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-semibold">No posts found</p>
            <p className="text-sm text-muted-foreground">Create your first blog post</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Post</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground lg:table-cell">Excerpt</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Author</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground md:table-cell">Tags</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-muted-foreground sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {posts.map(post => {
                  const badgeCls = STATUS_BADGE[post.status] ?? 'bg-muted text-muted-foreground';
                  const dateStr = post.publishedAt ?? post.createdAt;
                  const date = new Date(dateStr).toLocaleDateString('en-BD', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  });
                  const authorName = post.authorName ??
                    (post.author && typeof post.author === 'object'
                      ? `${post.author.firstName} ${post.author.lastName}`
                      : (post.author as string | undefined)) ??
                    '—';
                  return (
                    <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {post.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="h-10 w-14 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-14 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                          <p className="font-medium line-clamp-2 max-w-[200px]">{post.title}</p>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground max-w-[220px] lg:table-cell">
                        <p className="line-clamp-2">{post.excerpt ?? '—'}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{authorName}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {post.tags && post.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {post.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{post.tags.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
                          {post.status.charAt(0) + post.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-muted-foreground whitespace-nowrap sm:table-cell">
                        {date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/blog/${post.id}/edit`}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            disabled={deletingId === post.id}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === post.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
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
      {data && ((data.meta?.totalPages ?? data.totalPages ?? 1) > 1) && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Page {page} of {data.meta?.totalPages ?? data.totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, data.meta?.totalPages ?? data.totalPages ?? 1))}
              disabled={page >= (data.meta?.totalPages ?? data.totalPages ?? 1)}
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
