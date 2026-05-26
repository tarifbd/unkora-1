'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Palette, Image, Layout, Plus, Pencil, Trash2, Check,
  ChevronUp, ChevronDown, Loader2, X, Zap, Star,
} from 'lucide-react';
import api from '@/lib/api';

// ─── API helpers ──────────────────────────────────────────────

const designApi = {
  getThemes:   () => api.get('/design/themes').then(r => r.data.data),
  createTheme: (d: any) => api.post('/design/themes', d).then(r => r.data.data),
  updateTheme: (id: string, d: any) => api.patch(`/design/themes/${id}`, d).then(r => r.data.data),
  deleteTheme: (id: string) => api.delete(`/design/themes/${id}`).then(r => r.data.data),
  activateTheme: (id: string) => api.patch(`/design/themes/${id}/activate`).then(r => r.data.data),

  getBanners:   () => api.get('/design/banners').then(r => r.data.data),
  createBanner: (d: any) => api.post('/design/banners', d).then(r => r.data.data),
  updateBanner: (id: string, d: any) => api.patch(`/design/banners/${id}`, d).then(r => r.data.data),
  deleteBanner: (id: string) => api.delete(`/design/banners/${id}`).then(r => r.data.data),

  getSections:    () => api.get('/design/sections').then(r => r.data.data),
  createSection:  (d: any) => api.post('/design/sections', d).then(r => r.data.data),
  updateSection:  (id: string, d: any) => api.patch(`/design/sections/${id}`, d).then(r => r.data.data),
  deleteSection:  (id: string) => api.delete(`/design/sections/${id}`).then(r => r.data.data),
  reorderSections: (items: any[]) => api.patch('/design/sections/reorder', { items }).then(r => r.data.data),
};

// ─── Types ────────────────────────────────────────────────────

interface Theme {
  id: string; name: string; primaryColor: string; accentColor: string;
  fontFamily: string; borderRadius: string; isActive: boolean;
}

interface Banner {
  id: string; title: string; imageUrl: string; linkUrl?: string;
  position: string; order: number; isActive: boolean;
  startsAt?: string; endsAt?: string;
}

interface Section {
  id: string; type: string; title?: string; subtitle?: string;
  order: number; isActive: boolean;
}

// ─── Shared UI ────────────────────────────────────────────────

const inp = 'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50';

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>{children}</span>;
}

// ─── Theme Modal ──────────────────────────────────────────────

function ThemeModal({ initial, onSave, onClose }: { initial?: Theme; onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name:         initial?.name         ?? '',
    primaryColor: initial?.primaryColor ?? '#2563eb',
    accentColor:  initial?.accentColor  ?? '#f59e0b',
    fontFamily:   initial?.fontFamily   ?? 'Inter',
    borderRadius: initial?.borderRadius ?? '0.5rem',
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-bold text-lg">{initial ? 'Edit Theme' : 'New Theme'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Theme Name</label>
            <input value={form.name} onChange={set('name')} className={inp} placeholder="My Custom Theme" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor} onChange={set('primaryColor')}
                  className="h-9 w-12 cursor-pointer rounded border bg-background p-1" />
                <input value={form.primaryColor} onChange={set('primaryColor')} className={inp + ' font-mono'} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.accentColor} onChange={set('accentColor')}
                  className="h-9 w-12 cursor-pointer rounded border bg-background p-1" />
                <input value={form.accentColor} onChange={set('accentColor')} className={inp + ' font-mono'} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Font Family</label>
              <select value={form.fontFamily} onChange={set('fontFamily')} className={inp}>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Poppins">Poppins</option>
                <option value="Lato">Lato</option>
                <option value="Nunito">Nunito</option>
                <option value="Hind Siliguri">Hind Siliguri</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Border Radius</label>
              <select value={form.borderRadius} onChange={set('borderRadius')} className={inp}>
                <option value="0">Sharp (0)</option>
                <option value="0.25rem">Small (0.25rem)</option>
                <option value="0.5rem">Medium (0.5rem)</option>
                <option value="0.75rem">Large (0.75rem)</option>
                <option value="1rem">XL (1rem)</option>
              </select>
            </div>
          </div>
          {/* Preview */}
          <div className="rounded-xl border p-3" style={{ borderRadius: form.borderRadius }}>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Preview</p>
            <div className="flex items-center gap-2">
              <button className="rounded px-3 py-1.5 text-sm font-semibold text-white"
                style={{ backgroundColor: form.primaryColor, borderRadius: form.borderRadius }}>
                Primary
              </button>
              <button className="rounded px-3 py-1.5 text-sm font-semibold text-white"
                style={{ backgroundColor: form.accentColor, borderRadius: form.borderRadius }}>
                Accent
              </button>
              <span className="text-sm" style={{ fontFamily: form.fontFamily }}>
                {form.fontFamily} font
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => onSave(form)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Check className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Themes Tab ───────────────────────────────────────────────

function ThemesTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Theme | null>(null);

  const { data: themes = [], isLoading } = useQuery<Theme[]>({
    queryKey: ['design-themes'],
    queryFn: designApi.getThemes,
  });

  const createMut = useMutation({ mutationFn: designApi.createTheme, onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-themes'] }); setModal(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => designApi.updateTheme(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-themes'] }); setModal(null); } });
  const deleteMut = useMutation({ mutationFn: designApi.deleteTheme, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-themes'] }) });
  const activateMut = useMutation({ mutationFn: designApi.activateTheme, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-themes'] }) });

  const handleSave = (data: any) => {
    if (typeof modal === 'object' && modal !== null) {
      updateMut.mutate({ id: (modal as Theme).id, data });
    } else {
      createMut.mutate(data);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{themes.length} themes</p>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Theme
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map(t => (
          <div key={t.id}
            className={`rounded-xl border p-4 transition-all ${t.isActive ? 'ring-2 ring-primary border-primary' : 'hover:shadow-sm'}`}>
            {/* Color swatches */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: t.primaryColor }} />
              <div className="h-8 w-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: t.accentColor }} />
              <div className="flex-1">
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.fontFamily} · r={t.borderRadius}</p>
              </div>
              {t.isActive && <Badge color="bg-primary/10 text-primary"><Zap className="h-3 w-3" /> Active</Badge>}
            </div>
            {/* Preview bar */}
            <div className="flex gap-1.5 mb-3">
              <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.primaryColor }} />
              <div className="h-2 w-8 rounded-full" style={{ backgroundColor: t.accentColor }} />
            </div>
            <div className="flex items-center gap-1.5">
              {!t.isActive && (
                <button onClick={() => activateMut.mutate(t.id)}
                  className="flex-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                  Activate
                </button>
              )}
              <button onClick={() => setModal(t)}
                className="rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:bg-accent">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {!t.isActive && (
                <button onClick={() => deleteMut.mutate(t.id)}
                  className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
        {themes.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No themes yet. Create your first theme.</p>
          </div>
        )}
      </div>

      {modal !== null && (
        <ThemeModal
          initial={typeof modal === 'object' ? modal as Theme : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Banner Modal ─────────────────────────────────────────────

function BannerModal({ initial, onSave, onClose }: { initial?: Banner; onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title:    initial?.title    ?? '',
    imageUrl: initial?.imageUrl ?? '',
    linkUrl:  initial?.linkUrl  ?? '',
    position: initial?.position ?? 'hero',
    order:    String(initial?.order ?? 0),
    isActive: initial?.isActive ?? true,
    startsAt: initial?.startsAt?.slice(0, 10) ?? '',
    endsAt:   initial?.endsAt?.slice(0, 10)   ?? '',
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="font-bold text-lg">{initial ? 'Edit Banner' : 'Add Banner'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Title</label>
            <input value={form.title} onChange={set('title')} className={inp} placeholder="Summer Sale Banner" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Image URL</label>
            <input type="url" value={form.imageUrl} onChange={set('imageUrl')} className={inp} placeholder="https://..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Link URL (optional)</label>
            <input type="url" value={form.linkUrl} onChange={set('linkUrl')} className={inp} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Position</label>
              <select value={form.position} onChange={set('position')} className={inp}>
                <option value="hero">Hero</option>
                <option value="top">Top</option>
                <option value="sidebar">Sidebar</option>
                <option value="bottom">Bottom</option>
                <option value="popup">Popup</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Sort Order</label>
              <input type="number" min="0" value={form.order} onChange={set('order')} className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Starts At</label>
              <input type="date" value={form.startsAt} onChange={set('startsAt')} className={inp} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Ends At</label>
              <input type="date" value={form.endsAt} onChange={set('endsAt')} className={inp} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border" />
            <span className="text-sm">Active</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => onSave({ ...form, order: parseInt(form.order, 10) })}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Check className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Banners Tab ──────────────────────────────────────────────

function BannersTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Banner | null>(null);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['design-banners'],
    queryFn: designApi.getBanners,
  });

  const createMut = useMutation({ mutationFn: designApi.createBanner, onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-banners'] }); setModal(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => designApi.updateBanner(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-banners'] }); setModal(null); } });
  const deleteMut = useMutation({ mutationFn: designApi.deleteBanner, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });

  const handleSave = (data: any) => {
    if (typeof modal === 'object' && modal !== null) {
      updateMut.mutate({ id: (modal as Banner).id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const positionColor: Record<string, string> = {
    hero:    'bg-blue-100 text-blue-700',
    top:     'bg-green-100 text-green-700',
    sidebar: 'bg-purple-100 text-purple-700',
    bottom:  'bg-orange-100 text-orange-700',
    popup:   'bg-red-100 text-red-700',
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{banners.length} banners</p>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Banner</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Position</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Schedule</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {banners.map(b => (
              <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {b.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.imageUrl} alt={b.title}
                        className="h-10 w-16 rounded object-cover flex-shrink-0 bg-muted"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div>
                      <p className="font-medium">{b.title}</p>
                      {b.linkUrl && <p className="text-xs text-muted-foreground truncate max-w-40">{b.linkUrl}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge color={positionColor[b.position] ?? 'bg-gray-100 text-gray-600'}>{b.position}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {b.startsAt ? `${new Date(b.startsAt).toLocaleDateString()}` : '—'}
                  {b.endsAt ? ` → ${new Date(b.endsAt).toLocaleDateString()}` : ''}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge color={b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setModal(b)}
                      className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-700">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteMut.mutate(b.id)}
                      className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No banners yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <BannerModal
          initial={typeof modal === 'object' ? modal as Banner : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Sections Tab ─────────────────────────────────────────────

function SectionsTab() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newSection, setNewSection] = useState({ type: 'banner', title: '', subtitle: '' });

  const { data: sections = [], isLoading } = useQuery<Section[]>({
    queryKey: ['design-sections'],
    queryFn: designApi.getSections,
  });

  const createMut = useMutation({
    mutationFn: designApi.createSection,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-sections'] }); setShowAdd(false); setNewSection({ type: 'banner', title: '', subtitle: '' }); },
  });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => designApi.updateSection(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['design-sections'] }) });
  const deleteMut = useMutation({ mutationFn: designApi.deleteSection, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-sections'] }) });
  const reorderMut = useMutation({ mutationFn: designApi.reorderSections, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-sections'] }) });

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    const items = newSections.map((s, i) => ({ id: s.id, order: i }));
    reorderMut.mutate(items);
  };

  const SECTION_TYPES = ['banner', 'featured-categories', 'new-arrivals', 'flash-deals', 'top-products', 'testimonials', 'newsletter', 'custom-html'];

  const typeColor: Record<string, string> = {
    'banner':              'bg-blue-100 text-blue-700',
    'featured-categories': 'bg-purple-100 text-purple-700',
    'new-arrivals':        'bg-green-100 text-green-700',
    'flash-deals':         'bg-red-100 text-red-700',
    'top-products':        'bg-orange-100 text-orange-700',
    'testimonials':        'bg-yellow-100 text-yellow-700',
    'newsletter':          'bg-teal-100 text-teal-700',
    'custom-html':         'bg-gray-100 text-gray-700',
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sections.length} homepage sections (drag to reorder)</p>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 rounded-xl border bg-card p-4 space-y-3">
          <p className="font-semibold text-sm">New Section</p>
          <div className="flex gap-3 flex-wrap">
            <select value={newSection.type}
              onChange={e => setNewSection(s => ({ ...s, type: e.target.value }))}
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={newSection.title}
              onChange={e => setNewSection(s => ({ ...s, title: e.target.value }))}
              placeholder="Section title (optional)" className={inp + ' flex-1 min-w-40'} />
            <input value={newSection.subtitle}
              onChange={e => setNewSection(s => ({ ...s, subtitle: e.target.value }))}
              placeholder="Subtitle (optional)" className={inp + ' flex-1 min-w-40'} />
            <button onClick={() => createMut.mutate({ ...newSection, order: sections.length })}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <Check className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sections.map((sec, i) => (
          <div key={sec.id}
            className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors ${!sec.isActive ? 'opacity-60' : ''}`}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveSection(i, 'up')} disabled={i === 0}
                className="rounded p-0.5 hover:bg-accent disabled:opacity-30">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => moveSection(i, 'down')} disabled={i === sections.length - 1}
                className="rounded p-0.5 hover:bg-accent disabled:opacity-30">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="w-5 text-xs font-bold text-muted-foreground text-center">{i + 1}</span>
            <Badge color={typeColor[sec.type] ?? 'bg-gray-100 text-gray-600'}>{sec.type}</Badge>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{sec.title || <span className="text-muted-foreground italic">No title</span>}</p>
              {sec.subtitle && <p className="text-xs text-muted-foreground truncate">{sec.subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateMut.mutate({ id: sec.id, data: { isActive: !sec.isActive } })}
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${sec.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {sec.isActive ? 'Visible' : 'Hidden'}
              </button>
              <button onClick={() => deleteMut.mutate(sec.id)}
                className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-700 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            <Layout className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No homepage sections yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function DesignPage() {
  const [tab, setTab] = useState<'themes' | 'banners' | 'sections'>('themes');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Design Studio</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Customize themes, banners, and homepage layout</p>
      </div>

      <div className="flex gap-1 border-b">
        {([
          { id: 'themes',   label: 'Themes',   icon: Palette },
          { id: 'banners',  label: 'Banners',  icon: Image },
          { id: 'sections', label: 'Sections', icon: Layout },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'themes'   && <ThemesTab />}
      {tab === 'banners'  && <BannersTab />}
      {tab === 'sections' && <SectionsTab />}
    </div>
  );
}
