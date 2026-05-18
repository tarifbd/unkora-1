'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag, Loader2, Pencil, Trash2, Plus, X, Check, AlertTriangle, Search,
  ChevronDown, Star, Package, Globe, MoreVertical, Copy, Zap,
  SlidersHorizontal, Download, Move, Percent,
} from 'lucide-react';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  sortOrder?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isHot?: boolean;
  type?: string;
  _count?: { products: number };
}

interface FormState {
  name: string; slug: string; description: string;
  parentId: string; sortOrder: string; isActive: boolean;
  isFeatured: boolean; isHot: boolean; type: string;
  color: string; icon: string; imageUrl: string;
}

const EMPTY_FORM: FormState = {
  name: '', slug: '', description: '', parentId: '', sortOrder: '0',
  isActive: true, isFeatured: false, isHot: false, type: 'physical',
  color: '', icon: '', imageUrl: '',
};

const COLOR_PALETTE = [
  { value: 'bg-blue-100 text-blue-700', label: 'Blue' },
  { value: 'bg-pink-100 text-pink-700', label: 'Pink' },
  { value: 'bg-amber-100 text-amber-700', label: 'Amber' },
  { value: 'bg-green-100 text-green-700', label: 'Green' },
  { value: 'bg-purple-100 text-purple-700', label: 'Purple' },
  { value: 'bg-cyan-100 text-cyan-700', label: 'Cyan' },
  { value: 'bg-orange-100 text-orange-700', label: 'Orange' },
  { value: 'bg-red-100 text-red-700', label: 'Red' },
  { value: 'bg-indigo-100 text-indigo-700', label: 'Indigo' },
  { value: 'bg-teal-100 text-teal-700', label: 'Teal' },
  { value: 'bg-lime-100 text-lime-700', label: 'Lime' },
  { value: 'bg-gray-100 text-gray-600', label: 'Gray' },
];

const ICON_OPTIONS = [
  '📚','👶','👜','🌿','🎨','⚡','🛒','👗','🍎','🏠','🎮','🎵',
  '💄','🐾','🏋️','🖥️','📱','🧴','🍳','🌸','🎁','🔧','📷','✈️',
  '🧸','🪴','🕯️','🧶','🎯','🏷️',
];

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

function getCatColor(cat: Category) {
  return cat.color ?? CAT_COLORS[cat.slug] ?? 'bg-gray-100 text-gray-600';
}
function getCatIcon(cat: Category) {
  return cat.icon ?? CAT_EMOJI[cat.slug] ?? '🏷️';
}
function autoSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

function Toggle({ value, onChange, color = 'bg-green-500', disabled }: {
  value: boolean; onChange: (v: boolean) => void; color?: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 ${value ? color : 'bg-gray-200'}`}
    >
      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

function KebabMenu({ cat, onEdit, onDelete, onAddSub, onDuplicate }: {
  cat: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onAddSub: (c: Category) => void;
  onDuplicate: (c: Category) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border bg-white shadow-xl py-1.5 text-sm">
          <button onClick={() => { onEdit(cat); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-gray-50 text-gray-700">
            <Pencil className="w-3.5 h-3.5 text-gray-400" /> Edit
          </button>
          <button onClick={() => { onAddSub(cat); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-gray-50 text-gray-700">
            <Plus className="w-3.5 h-3.5 text-gray-400" /> Add Sub-category
          </button>
          <button onClick={() => { onDuplicate(cat); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-gray-50 text-gray-700">
            <Copy className="w-3.5 h-3.5 text-gray-400" /> Duplicate
          </button>
          <div className="my-1 border-t" />
          <button onClick={() => { onDelete(cat); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 text-red-600">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function DeleteModal({ name, onConfirm, onClose, loading }: {
  name: string; onConfirm: () => void; onClose: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Delete Category</h3>
            <p className="text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-5">
          Delete <span className="font-bold">"{name}"</span>? Sub-categories and product associations will be removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border rounded-xl py-2.5 text-sm font-bold hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkActionMenu({ selected, onBulkAction }: {
  selected: string[];
  onBulkAction: (action: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    { key: 'activate', label: 'Activate Selected' },
    { key: 'deactivate', label: 'Deactivate Selected' },
    { key: 'feature', label: 'Set as Featured' },
    { key: 'unfeature', label: 'Remove Featured' },
    { key: 'hot', label: 'Set as Hot' },
    { key: 'unhot', label: 'Remove Hot' },
    { key: 'delete', label: 'Delete Selected', danger: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={selected.length === 0}
        className="flex items-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Bulk Action {selected.length > 0 && <span className="bg-primary text-white text-xs rounded-full px-1.5 py-0.5">{selected.length}</span>}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border bg-white shadow-xl py-1.5 text-sm">
          {actions.map((a, i) => (
            <div key={a.key}>
              {a.key === 'delete' && <div className="my-1 border-t" />}
              <button
                onClick={() => { onBulkAction(a.key); setOpen(false); }}
                className={`w-full flex items-center px-3.5 py-2 transition-colors ${a.danger ? 'hover:bg-red-50 text-red-600' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                {a.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const [typeTab, setTypeTab] = useState<'all' | 'physical' | 'digital'>('all');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'sortOrder' | 'name' | 'products'>('sortOrder');

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories-admin-all'],
    queryFn: () => api.get('/categories/all?includeInactive=true').then(r => r.data.data as Category[]),
  });

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editingId ? api.patch(`/categories/${editingId}`, payload) : api.post('/categories', payload),
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

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/categories/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-admin-all'] });
      qc.invalidateQueries({ queryKey: ['categories-all'] });
    },
  });

  function resetForm() {
    setForm(EMPTY_FORM); setEditingId(null); setSlugTouched(false);
    setShowIconPicker(false); setShowForm(false);
  }

  function startEdit(cat: Category) {
    if (!cat.id) {
      setEditingId(null); setSlugTouched(false);
      setForm({ ...EMPTY_FORM, parentId: cat.parentId ?? '' });
      setShowForm(true);
      return;
    }
    setEditingId(cat.id); setSlugTouched(true);
    setForm({
      name: cat.name, slug: cat.slug, description: cat.description ?? '',
      parentId: cat.parentId ?? '', sortOrder: String(cat.sortOrder ?? 0),
      isActive: cat.isActive ?? true, isFeatured: cat.isFeatured ?? false,
      isHot: cat.isHot ?? false, type: cat.type ?? 'physical',
      color: cat.color ?? '', icon: cat.icon ?? '', imageUrl: cat.imageUrl ?? '',
    });
    setShowForm(true);
  }

  function startDuplicate(cat: Category) {
    setEditingId(null); setSlugTouched(false);
    setForm({
      name: `${cat.name} (Copy)`, slug: autoSlug(`${cat.name} copy`),
      description: cat.description ?? '', parentId: cat.parentId ?? '',
      sortOrder: String((cat.sortOrder ?? 0) + 1), isActive: false,
      isFeatured: false, isHot: false, type: cat.type ?? 'physical',
      color: cat.color ?? '', icon: cat.icon ?? '', imageUrl: cat.imageUrl ?? '',
    });
    setShowForm(true);
  }

  function handleBulkAction(action: string) {
    if (action === 'delete') {
      Promise.all(selected.map(id => deleteMutation.mutateAsync(id))).then(() => {
        setSelected([]);
        qc.invalidateQueries({ queryKey: ['categories-admin-all'] });
      });
      return;
    }
    const dataMap: Record<string, Record<string, unknown>> = {
      activate: { isActive: true }, deactivate: { isActive: false },
      feature: { isFeatured: true }, unfeature: { isFeatured: false },
      hot: { isHot: true }, unhot: { isHot: false },
    };
    const data = dataMap[action];
    if (data) {
      Promise.all(selected.map(id => patchMutation.mutateAsync({ id, data }))).then(() => {
        setSelected([]);
        qc.invalidateQueries({ queryKey: ['categories-admin-all'] });
      });
    }
  }

  const parentMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach(c => { if (c.id) m[c.id] = c.name; });
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    let list = [...categories];
    if (typeTab !== 'all') list = list.filter(c => (c.type ?? 'physical') === typeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) || c.slug.includes(q) ||
        (parentMap[c.parentId ?? ''] ?? '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'products') return (b._count?.products ?? 0) - (a._count?.products ?? 0);
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
    return list;
  }, [categories, typeTab, search, sortBy, parentMap]);

  const getCatLevel = (cat: Category): number => {
    if (!cat.parentId) return 0;
    const parent = categories.find(c => c.id === cat.parentId);
    if (!parent) return 1;
    return 1 + getCatLevel(parent);
  };

  const parentOptions = categories.filter(c => !c.parentId && c.id !== editingId);

  // Stats
  const totalCount = categories.length;
  const activeCount = categories.filter(c => c.isActive).length;
  const featuredCount = categories.filter(c => c.isFeatured).length;
  const hotCount = categories.filter(c => c.isHot).length;
  const physicalCount = categories.filter(c => (c.type ?? 'physical') === 'physical').length;
  const digitalCount = categories.filter(c => c.type === 'digital').length;

  const allSelected = filtered.length > 0 && filtered.every(c => selected.includes(c.id));
  const previewColor = form.color || 'bg-gray-100 text-gray-600';
  const previewIcon = form.icon || '🏷️';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">{totalCount} total · {activeCount} active</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Category
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total', value: totalCount, color: 'bg-gray-900', icon: Tag },
          { label: 'Active', value: activeCount, color: 'bg-green-600', icon: Check },
          { label: 'Featured', value: featuredCount, color: 'bg-yellow-500', icon: Star },
          { label: 'Hot', value: hotCount, color: 'bg-orange-500', icon: Zap },
          { label: 'Physical', value: physicalCount, color: 'bg-blue-600', icon: Package },
          { label: 'Digital', value: digitalCount, color: 'bg-purple-600', icon: Globe },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-3 flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-lg ${s.color} flex-shrink-0`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
              <p className="text-[11px] text-gray-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap">
          {/* Type tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(['all', 'physical', 'digital'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTypeTab(t); setSelected([]); }}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${typeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'all' ? `All (${totalCount})` : t === 'physical' ? `Physical (${physicalCount})` : `Digital (${digitalCount})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="border rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="sortOrder">Sort: Order Level</option>
              <option value="name">Sort: Name</option>
              <option value="products">Sort: Products</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search categories…"
                className="w-52 border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            <BulkActionMenu selected={selected} onBulkAction={handleBulkAction} />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Tag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">
              {search ? `No results for "${search}"` : 'No categories yet'}
            </p>
            {!search && (
              <button onClick={() => { resetForm(); setShowForm(true); }}
                className="mt-3 text-sm text-primary hover:underline">
                Create your first category →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={e => setSelected(e.target.checked ? filtered.map(c => c.id) : [])}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide w-16">Icon</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Parent</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Order</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Level</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide hidden md:table-cell">Products</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Featured</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Hot</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(cat => {
                  const level = getCatLevel(cat);
                  const parentName = cat.parentId ? (parentMap[cat.parentId] ?? '—') : '—';
                  const isChecked = selected.includes(cat.id);
                  const color = getCatColor(cat);
                  const icon = getCatIcon(cat);

                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-blue-50/30 transition-colors ${isChecked ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => setSelected(s => e.target.checked ? [...s, cat.id] : s.filter(i => i !== cat.id))}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${color} ${!cat.isActive ? 'opacity-40' : ''}`}>
                          {icon}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <p className={`font-semibold ${cat.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                            {cat.name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono">/{cat.slug}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-500">{parentName}</span>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${(cat.type ?? 'physical') === 'digital' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {(cat.type ?? 'physical') === 'digital'
                            ? <><Globe className="w-3 h-3" /> Digital</>
                            : <><Package className="w-3 h-3" /> Physical</>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        <span className="text-sm font-semibold text-gray-700">{cat.sortOrder ?? 0}</span>
                      </td>
                      <td className="px-3 py-3 text-center hidden lg:table-cell">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${level === 0 ? 'bg-gray-100 text-gray-600' : 'bg-indigo-100 text-indigo-700'}`}>
                          {level}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                          <Package className="w-3 h-3" /> {cat._count?.products ?? 0}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            value={cat.isFeatured ?? false}
                            onChange={v => patchMutation.mutate({ id: cat.id, data: { isFeatured: v } })}
                            color="bg-yellow-400"
                            disabled={patchMutation.isPending}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            value={cat.isHot ?? false}
                            onChange={v => patchMutation.mutate({ id: cat.id, data: { isHot: v } })}
                            color="bg-orange-500"
                            disabled={patchMutation.isPending}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            value={cat.isActive ?? true}
                            onChange={v => patchMutation.mutate({ id: cat.id, data: { isActive: v } })}
                            color="bg-green-500"
                            disabled={patchMutation.isPending}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(cat)}
                            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <KebabMenu
                            cat={cat}
                            onEdit={startEdit}
                            onDelete={setDeleteTarget}
                            onAddSub={c => startEdit({ id: '', name: '', slug: '', parentId: c.id, isActive: true } as Category)}
                            onDuplicate={startDuplicate}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50 text-xs text-gray-500">
              <span>Showing {filtered.length} of {categories.length} categories{selected.length > 0 ? ` · ${selected.length} selected` : ''}</span>
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="text-primary hover:underline font-medium">
                  Clear selection
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Form Panel */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={resetForm} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div>
                <h2 className="font-black text-gray-900 text-lg">{editingId ? 'Edit Category' : 'New Category'}</h2>
                {form.parentId && (
                  <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                    <Move className="w-3 h-3" /> Sub of: {parentMap[form.parentId] ?? ''}
                  </p>
                )}
              </div>
              <button onClick={resetForm} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Preview */}
              <div className="mb-5 flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${previewColor}`}>
                  {previewIcon}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{form.name || 'Category Name'}</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">/{form.slug || 'slug'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${form.type === 'digital' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {form.type === 'digital' ? 'Digital' : 'Physical'}
                    </span>
                    {form.isFeatured && <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-yellow-100 text-yellow-700">Featured</span>}
                    {form.isHot && <span className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-orange-100 text-orange-700">Hot</span>}
                  </div>
                </div>
              </div>

              <form
                id="cat-form"
                onSubmit={e => {
                  e.preventDefault();
                  save.mutate({
                    name: form.name.trim(), slug: form.slug.trim(),
                    description: form.description || undefined,
                    parentId: form.parentId || undefined,
                    sortOrder: Number(form.sortOrder) || 0,
                    isActive: form.isActive, isFeatured: form.isFeatured,
                    isHot: form.isHot, type: form.type,
                    color: form.color || undefined,
                    icon: form.icon || undefined,
                    imageUrl: form.imageUrl || undefined,
                  });
                }}
                className="space-y-4"
              >
                {/* Type */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Category Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['physical', 'digital'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all capitalize ${form.type === t ? (t === 'digital' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-blue-500 bg-blue-50 text-blue-700') : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        {t === 'digital' ? <Globe className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Name <span className="text-red-500">*</span></label>
                  <input
                    required value={form.name}
                    onChange={e => { const v = e.target.value; setForm(f => ({ ...f, name: v, slug: slugTouched ? f.slug : autoSlug(v) })); }}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="e.g. Fiction Books"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 flex justify-between">
                    Slug <span className="text-red-500">*</span>
                    <span className="text-[10px] text-gray-400 font-normal">Auto-generated from name</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">/</span>
                    <input
                      required value={form.slug}
                      onChange={e => { setSlugTouched(true); setForm(f => ({ ...f, slug: e.target.value })); }}
                      className="w-full border rounded-xl pl-6 pr-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      placeholder="fiction-books" pattern="[a-z0-9-]+"
                    />
                  </div>
                </div>

                {/* Icon */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Icon / Emoji</label>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(p => !p)}
                    className="flex items-center gap-2 border rounded-xl px-3.5 py-2 text-sm w-full hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xl">{previewIcon}</span>
                    <span className="text-gray-500">{form.icon ? 'Change icon' : 'Pick an icon'}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                  {showIconPicker && (
                    <div className="mt-1 border rounded-xl p-3 bg-white shadow-sm">
                      <div className="grid grid-cols-10 gap-1">
                        {ICON_OPTIONS.map(ic => (
                          <button
                            key={ic} type="button"
                            onClick={() => { setForm(f => ({ ...f, icon: ic })); setShowIconPicker(false); }}
                            className={`text-xl h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors ${form.icon === ic ? 'bg-primary/10 ring-2 ring-primary' : ''}`}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                      {form.icon && (
                        <button
                          type="button"
                          onClick={() => { setForm(f => ({ ...f, icon: '' })); setShowIconPicker(false); }}
                          className="mt-2 text-xs text-red-500 hover:underline w-full text-center"
                        >
                          Clear icon
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Color Theme</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLOR_PALETTE.map(c => (
                      <button
                        key={c.value} type="button"
                        onClick={() => setForm(f => ({ ...f, color: f.color === c.value ? '' : c.value }))}
                        title={c.label}
                        className={`h-8 rounded-xl text-xs font-bold transition-all ${c.value} ${form.color === c.value ? 'ring-2 ring-offset-1 ring-gray-900 scale-110' : 'hover:scale-105'}`}
                      >
                        {c.label.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    placeholder="Optional description…"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Image URL</label>
                  <input
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="https://..."
                  />
                </div>

                {/* Parent + Sort */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Parent Category</label>
                    <select
                      value={form.parentId}
                      onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                      className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                    >
                      <option value="">None (top-level)</option>
                      {parentOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Order Level</label>
                    <input
                      type="number" min="0" value={form.sortOrder}
                      onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                      className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="rounded-xl border p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Settings</p>
                  {[
                    { key: 'isActive', label: 'Active', desc: 'Visible to customers', color: 'bg-green-500' },
                    { key: 'isFeatured', label: 'Featured', desc: 'Shown in featured sections', color: 'bg-yellow-400' },
                    { key: 'isHot', label: 'Hot Category', desc: 'Highlighted as trending', color: 'bg-orange-500' },
                  ].map(s => (
                    <div key={s.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{s.label}</p>
                        <p className="text-xs text-gray-400">{s.desc}</p>
                      </div>
                      <Toggle
                        value={form[s.key as keyof FormState] as boolean}
                        onChange={v => setForm(f => ({ ...f, [s.key]: v }))}
                        color={s.color}
                      />
                    </div>
                  ))}
                </div>

                {save.isError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Failed to save. Slug may already be taken.
                  </p>
                )}
              </form>
            </div>

            {/* Panel footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
              <button
                form="cat-form"
                type="submit"
                disabled={save.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? 'Update Category' : 'Create Category'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(categories.find(c => c.id === editingId) ?? null)}
                  className="px-4 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={resetForm}
                className="px-4 border rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
