'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag, Loader2, Pencil, Trash2, Plus, ChevronRight, ChevronDown,
  FolderOpen, Folder, X, Check, AlertTriangle, Search, Move,
} from 'lucide-react';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  _count?: { products: number };
}

interface FormState {
  name: string; slug: string; description: string;
  parentId: string; sortOrder: string; isActive: boolean;
}

const EMPTY_FORM: FormState = { name: '', slug: '', description: '', parentId: '', sortOrder: '0', isActive: true };

function autoSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

const CAT_COLORS: Record<string, string> = {
  books: 'bg-blue-100 text-blue-700', 'baby-products': 'bg-pink-100 text-pink-700',
  'leather-products': 'bg-amber-100 text-amber-700', 'organic-foods': 'bg-green-100 text-green-700',
  handicrafts: 'bg-purple-100 text-purple-700', electronics: 'bg-cyan-100 text-cyan-700',
  'daily-needs': 'bg-orange-100 text-orange-700',
};
const CAT_EMOJI: Record<string, string> = {
  books: '📚', 'baby-products': '👶', 'leather-products': '👜',
  'organic-foods': '🌿', handicrafts: '🎨', electronics: '⚡', 'daily-needs': '🛒',
};

function DeleteModal({ name, onConfirm, onClose, loading }: { name: string; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Delete Category</h3>
            <p className="text-sm text-gray-500">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-5">
          Delete <span className="font-bold">"{name}"</span>? Sub-categories and product links will be removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border rounded-xl py-2.5 text-sm font-bold hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({ cat, depth, allCats, onEdit, onDelete }: {
  cat: Category; depth: number; allCats: Category[];
  onEdit: (c: Category) => void; onDelete: (c: Category) => void;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(depth === 0);
  const children = allCats.filter(c => c.parentId === cat.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const hasChildren = children.length > 0;
  const emoji = CAT_EMOJI[cat.slug] ?? '🏷️';
  const color = CAT_COLORS[cat.slug] ?? 'bg-gray-100 text-gray-600';

  const toggleActive = useMutation({
    mutationFn: () => api.patch(`/categories/${cat.id}`, { isActive: !cat.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-admin-all'] });
      qc.invalidateQueries({ queryKey: ['categories-all'] });
    },
  });

  return (
    <>
      <div
        className={`flex items-center gap-3 py-2.5 pr-4 hover:bg-gray-50 transition-colors group border-b border-gray-50/80 ${depth > 0 ? 'bg-gray-50/30' : ''}`}
        style={{ paddingLeft: `${16 + depth * 28}px` }}
      >
        {/* Expand toggle */}
        <button onClick={() => setExpanded(e => !e)}
          className={`w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0 ${!hasChildren ? 'invisible' : ''}`}>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Icon */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${color} ${!cat.isActive ? 'opacity-40' : ''}`}>
          {expanded && hasChildren ? <FolderOpen className="w-4 h-4" /> : hasChildren ? <Folder className="w-4 h-4" /> : emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold truncate ${!cat.isActive ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{cat.name}</p>
            {!cat.isActive && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-bold">INACTIVE</span>}
            {hasChildren && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">{children.length} sub</span>}
            {(cat._count?.products ?? 0) > 0 && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-bold">{cat._count?.products} items</span>}
          </div>
          <p className="text-[11px] text-gray-400 font-mono">/{cat.slug}</p>
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => onEdit({ id: '', name: '', slug: '', parentId: cat.id, isActive: true } as Category)}
            title="Add sub-category"
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onEdit(cat)} title="Edit"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(cat)} title="Delete"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active toggle */}
        <button onClick={() => toggleActive.mutate()} disabled={toggleActive.isPending}
          className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${cat.isActive ? 'bg-primary' : 'bg-gray-200'}`}>
          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${cat.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {expanded && hasChildren && children.map(child => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} allCats={allCats} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [search, setSearch] = useState('');

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories-admin-all'],
    queryFn: () => api.get('/categories/all?includeInactive=true').then(r => r.data.data as Category[]),
  });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editingId
        ? api.patch(`/categories/${editingId}`, payload)
        : api.post('/categories', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-admin-all'] });
      qc.invalidateQueries({ queryKey: ['categories-all'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-admin-all'] });
      qc.invalidateQueries({ queryKey: ['categories-all'] });
      setDeleteTarget(null);
      if (editingId) resetForm();
    },
  });

  function resetForm() { setForm(EMPTY_FORM); setEditingId(null); setSlugTouched(false); }

  function startEdit(cat: Category) {
    if (!cat.id) {
      setEditingId(null); setSlugTouched(false);
      setForm({ ...EMPTY_FORM, parentId: cat.parentId ?? '' });
      return;
    }
    setEditingId(cat.id); setSlugTouched(true);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? '', parentId: cat.parentId ?? '', sortOrder: String(cat.sortOrder ?? 0), isActive: cat.isActive ?? true });
  }

  const roots = categories.filter(c => !c.parentId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const filtered = search ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.includes(search.toLowerCase())) : null;
  const parentOptions = categories.filter(c => !c.parentId && c.id !== editingId);
  const activeCount = categories.filter(c => c.isActive).length;
  const subCount = categories.filter(c => c.parentId).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">{categories.length} total · {activeCount} active · {subCount} sub-categories</p>
        </div>
        <button onClick={resetForm}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> New Category
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Tree panel */}
        <div className="xl:col-span-3 rounded-2xl border bg-white overflow-hidden shadow-sm">
          {/* Search bar */}
          <div className="border-b bg-gray-50 px-4 py-3 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or slug…"
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            {search && <button onClick={() => setSearch('')}><X className="w-4 h-4 text-gray-400" /></button>}
          </div>

          {isLoading && <div className="flex justify-center py-14"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>}

          {/* Search results */}
          {search && filtered && (
            <div className="divide-y">
              {filtered.length === 0 && <p className="py-10 text-center text-sm text-gray-400">No results for "{search}"</p>}
              {filtered.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${CAT_COLORS[cat.slug] ?? 'bg-gray-100 text-gray-500'}`}>
                    {CAT_EMOJI[cat.slug] ?? '🏷️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{cat.name}</p>
                    <p className="text-[11px] text-gray-400 font-mono">/{cat.slug} · {cat._count?.products ?? 0} products{cat.parentId ? ' · sub' : ''}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteTarget(cat)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tree */}
          {!search && (
            <>
              {roots.map(cat => (
                <CategoryRow key={cat.id} cat={cat} depth={0} allCats={categories} onEdit={startEdit} onDelete={setDeleteTarget} />
              ))}
              {!isLoading && roots.length === 0 && (
                <div className="py-16 text-center">
                  <Tag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">No categories yet</p>
                  <p className="text-gray-400 text-sm mt-1">Use the form to create your first category →</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Form panel */}
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm sticky top-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-gray-900 text-lg">{editingId ? 'Edit Category' : 'New Category'}</h2>
                {form.parentId && (
                  <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                    <Move className="w-3 h-3" /> Sub of: {categories.find(c => c.id === form.parentId)?.name}
                  </p>
                )}
              </div>
              {(editingId || form.parentId) && (
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              )}
            </div>

            <form onSubmit={e => {
              e.preventDefault();
              save.mutate({ name: form.name.trim(), slug: form.slug.trim(), description: form.description || undefined, parentId: form.parentId || undefined, sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive });
            }} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Name <span className="text-red-500">*</span></label>
                <input required value={form.name}
                  onChange={e => { const v = e.target.value; setForm(f => ({ ...f, name: v, slug: slugTouched ? f.slug : autoSlug(v) })); }}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="e.g. Fiction Books" />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 flex justify-between">
                  Slug <span className="text-red-500">*</span>
                  <span className="text-[10px] text-gray-400 font-normal">Auto-generated</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">/</span>
                  <input required value={form.slug}
                    onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: e.target.value })); }}
                    className="w-full border rounded-xl pl-6 pr-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="fiction-books" pattern="[a-z0-9-]+" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Description</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Optional…" />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Parent Category</label>
                <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
                  <option value="">None (top-level)</option>
                  {parentOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Sort Order</label>
                  <input type="number" min="0" value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <label className="flex items-center gap-2 pb-2.5 cursor-pointer select-none">
                  <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button type="submit" disabled={save.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 disabled:opacity-50">
                  {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingId ? 'Update' : 'Create Category'}
                </button>
                {editingId && <button type="button" onClick={resetForm} className="px-4 border rounded-xl text-sm font-bold hover:bg-gray-50">Cancel</button>}
              </div>

              {save.isError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  Failed to save. Slug may already be taken.
                </p>
              )}
            </form>

            {editingId && (
              <div className="mt-4 pt-4 border-t">
                <button onClick={() => setDeleteTarget(categories.find(c => c.id === editingId) ?? null)}
                  className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-200 rounded-xl py-2 text-sm font-bold hover:bg-red-50">
                  <Trash2 className="w-4 h-4" /> Delete this category
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Stats</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[['Total', categories.length, 'text-gray-900'], ['Active', activeCount, 'text-green-600'], ['Sub-cats', subCount, 'text-blue-600']].map(([l, v, c]) => (
                <div key={String(l)}>
                  <p className={`text-2xl font-black ${c}`}>{v}</p>
                  <p className="text-[11px] text-gray-400">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <DeleteModal name={deleteTarget.name} loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
