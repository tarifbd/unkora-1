'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { blogApi } from '@/lib/api/admin';

interface FormState {
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  status: 'DRAFT' | 'PUBLISHED';
  tags: string;
  metaTitle: string;
  metaDescription: string;
}

const defaultForm: FormState = {
  title: '',
  content: '',
  excerpt: '',
  coverImage: '',
  status: 'DRAFT',
  tags: '',
  metaTitle: '',
  metaDescription: '',
};

const inputCls = 'w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.content.trim()) { setError('Content is required'); return; }

    setSaving(true);
    setError(null);
    try {
      const tags = form.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await blogApi.create({
        title: form.title.trim(),
        content: form.content.trim(),
        excerpt: form.excerpt.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
        status: form.status,
        tags: tags.length > 0 ? tags : undefined,
        metaTitle: form.metaTitle.trim() || undefined,
        metaDescription: form.metaDescription.trim() || undefined,
      });
      router.push('/admin/blog');
    } catch {
      setError('Failed to save post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/blog"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold">New Blog Post</h1>
          <p className="text-sm text-muted-foreground">Create a new blog post</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Enter post title…"
            className={`${inputCls} text-lg font-semibold`}
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Excerpt</label>
          <input
            value={form.excerpt}
            onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
            placeholder="Short summary shown in listings…"
            className={inputCls}
          />
        </div>

        {/* Content */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Content <span className="text-destructive">*</span>
          </label>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write your blog post content here…"
            rows={18}
            style={{ minHeight: '400px' }}
            className={`${inputCls} resize-y`}
          />
        </div>

        {/* Cover Image + Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Cover Image URL</label>
            <input
              value={form.coverImage}
              onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))}
              className={inputCls}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Tags</label>
          <input
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            placeholder="fashion, tips, lifestyle (comma-separated)"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-muted-foreground">Separate tags with commas</p>
        </div>

        {/* SEO */}
        <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">SEO</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Meta Title</label>
            <input
              value={form.metaTitle}
              onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
              placeholder="SEO title (defaults to post title)"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Meta Description</label>
            <textarea
              value={form.metaDescription}
              onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
              placeholder="SEO description (150–160 characters recommended)"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t">
          <Link
            href="/admin/blog"
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Save Post
          </button>
        </div>
      </div>
    </div>
  );
}
