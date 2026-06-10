'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Palette, Image as ImageIcon, Layout, Plus, Pencil, Trash2, Check,
  ChevronUp, ChevronDown, Loader2, X, Zap, Type, Megaphone, Gift,
} from 'lucide-react';
import api from '@/lib/api';

// ─── API helpers ──────────────────────────────────────────────

const designApi = {
  getThemes:   () => api.get('/design/themes').then(r => r.data.data),
  createTheme: (d: ThemeFormData) => api.post('/design/themes', d).then(r => r.data.data),
  updateTheme: (id: string, d: Partial<ThemeFormData>) => api.patch(`/design/themes/${id}`, d).then(r => r.data.data),
  deleteTheme: (id: string) => api.delete(`/design/themes/${id}`).then(r => r.data.data),
  activateTheme: (id: string) => api.patch(`/design/themes/${id}/activate`).then(r => r.data.data),

  getBanners:   () => api.get('/design/banners').then(r => r.data.data),
  createBanner: (d: BannerFormData) => api.post('/design/banners', d).then(r => r.data.data),
  updateBanner: (id: string, d: Partial<BannerFormData>) => api.patch(`/design/banners/${id}`, d).then(r => r.data.data),
  deleteBanner: (id: string) => api.delete(`/design/banners/${id}`).then(r => r.data.data),

  getSections:     () => api.get('/design/sections').then(r => r.data.data),
  createSection:   (d: SectionFormData) => api.post('/design/sections', d).then(r => r.data.data),
  updateSection:   (id: string, d: Partial<SectionFormData & { isActive: boolean }>) => api.patch(`/design/sections/${id}`, d).then(r => r.data.data),
  deleteSection:   (id: string) => api.delete(`/design/sections/${id}`).then(r => r.data.data),
  reorderSections: (items: { id: string; order: number }[]) => api.patch('/design/sections/reorder', { items }).then(r => r.data.data),
};

// ─── Types ────────────────────────────────────────────────────

interface Theme {
  id: string; name: string; primaryColor: string; accentColor: string;
  fontFamily: string; borderRadius: string; isActive: boolean;
}
interface ThemeFormData {
  name: string; primaryColor: string; accentColor: string;
  fontFamily: string; borderRadius: string;
}

interface Banner {
  id: string; title: string; imageUrl: string; linkUrl?: string;
  subtitle?: string; ctaText?: string;
  position: string; order: number; isActive: boolean;
  startsAt?: string; endsAt?: string;
}
interface BannerFormData {
  title: string; imageUrl: string; linkUrl: string;
  position: string; order: number; isActive: boolean;
  subtitle?: string; ctaText?: string;
  startsAt?: string; endsAt?: string;
}

interface Section {
  id: string; type: string; title?: string; subtitle?: string;
  order: number; isActive: boolean;
}
interface SectionFormData {
  type: string; title: string; subtitle: string; order: number;
}

// ─── Preset Color Schemes ─────────────────────────────────────

const COLOR_PRESETS = [
  { name: 'Blue / Default',    primary: '#2563eb', accent: '#f59e0b' },
  { name: 'Green / Nature',    primary: '#16a34a', accent: '#fb923c' },
  { name: 'Red / Bold',        primary: '#dc2626', accent: '#facc15' },
  { name: 'Purple / Royal',    primary: '#7c3aed', accent: '#10b981' },
  { name: 'Orange / Warm',     primary: '#ea580c', accent: '#3b82f6' },
  { name: 'Dark / Midnight',   primary: '#1e293b', accent: '#6366f1' },
];

const FONT_OPTIONS = [
  { value: 'Inter',           label: 'Inter' },
  { value: 'Poppins',         label: 'Poppins' },
  { value: 'Roboto',          label: 'Roboto' },
  { value: 'Hind Siliguri',   label: 'Hind Siliguri (বাংলা)' },
  { value: 'Noto Sans Bengali', label: 'Noto Sans Bengali' },
  { value: 'Lato',            label: 'Lato' },
  { value: 'Nunito',          label: 'Nunito' },
];

const RADIUS_OPTIONS = [
  { value: '0',      label: 'Sharp' },
  { value: '0.5rem', label: 'Rounded' },
  { value: '1rem',   label: 'Extra Rounded' },
];

// ─── Shared UI ────────────────────────────────────────────────

const inp = 'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50';

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>{children}</span>;
}

// ─── Mock Product Card Preview ─────────────────────────────────

function ProductCardPreview({ primaryColor, accentColor, fontFamily, borderRadius }: {
  primaryColor: string; accentColor: string; fontFamily: string; borderRadius: string;
}) {
  return (
    <div
      className="overflow-hidden border shadow-md max-w-[200px]"
      style={{ borderRadius, fontFamily: `${fontFamily}, sans-serif`, background: '#fff' }}
    >
      <div className="h-28 flex items-center justify-center text-4xl" style={{ background: primaryColor + '18' }}>
        📚
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm text-gray-800 truncate">Sample Book</p>
        <p className="text-xs text-gray-500 mb-2">by Author Name</p>
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-sm" style={{ color: primaryColor }}>৳ 450</span>
          <button
            className="text-xs font-semibold text-white px-2.5 py-1"
            style={{ background: primaryColor, borderRadius: `calc(${borderRadius} * 0.75)` }}
          >
            Add to Cart
          </button>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full" style={{ background: accentColor, borderRadius }} />
      </div>
    </div>
  );
}

// ─── Themes Tab (enhanced with Colors & Fonts inline) ─────────

function ThemesTab() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState<ThemeFormData>({
    name: '', primaryColor: '#2563eb', accentColor: '#f59e0b',
    fontFamily: 'Inter', borderRadius: '0.5rem',
  });

  const { data: themes = [], isLoading } = useQuery<Theme[]>({
    queryKey: ['design-themes'],
    queryFn: designApi.getThemes,
  });

  const createMut = useMutation({
    mutationFn: designApi.createTheme,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-themes'] }); setShowNewForm(false); resetForm(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ThemeFormData> }) => designApi.updateTheme(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-themes'] }); setEditingId(null); },
  });
  const deleteMut = useMutation({ mutationFn: designApi.deleteTheme, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-themes'] }) });
  const activateMut = useMutation({
    mutationFn: (id: string) => designApi.activateTheme(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['design-themes'] }),
  });

  const resetForm = () => setForm({ name: '', primaryColor: '#2563eb', accentColor: '#f59e0b', fontFamily: 'Inter', borderRadius: '0.5rem' });

  const startEdit = (t: Theme) => {
    setForm({ name: t.name, primaryColor: t.primaryColor, accentColor: t.accentColor, fontFamily: t.fontFamily, borderRadius: t.borderRadius });
    setEditingId(t.id);
    setShowNewForm(false);
  };

  const set = (k: keyof ThemeFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const applyPreset = (p: { primary: string; accent: string }) =>
    setForm(f => ({ ...f, primaryColor: p.primary, accentColor: p.accent }));

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const isEditing = editingId !== null || showNewForm;

  return (
    <div className="space-y-6">
      {/* Existing themes list */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{themes.length} theme{themes.length !== 1 ? 's' : ''}</p>
          {!isEditing && (
            <button onClick={() => { setShowNewForm(true); resetForm(); }}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> New Theme
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map(t => (
            <div key={t.id}
              className={`rounded-xl border p-4 transition-all ${t.isActive ? 'ring-2 ring-primary border-primary' : 'hover:shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ backgroundColor: t.primaryColor }} />
                <div className="h-8 w-8 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{ backgroundColor: t.accentColor }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.fontFamily} · r={t.borderRadius}</p>
                </div>
                {t.isActive && <Badge color="bg-primary/10 text-primary"><Zap className="h-3 w-3" /> Active</Badge>}
              </div>
              <div className="flex gap-1.5 mb-3">
                <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.primaryColor }} />
                <div className="h-2 w-8 rounded-full" style={{ backgroundColor: t.accentColor }} />
              </div>
              <div className="flex items-center gap-1.5">
                {!t.isActive && (
                  <button onClick={() => activateMut.mutate(t.id)}
                    disabled={activateMut.isPending}
                    className="flex-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    {activateMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Activate'}
                  </button>
                )}
                <button onClick={() => startEdit(t)}
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
          {themes.length === 0 && !showNewForm && (
            <div className="col-span-full rounded-xl border border-dashed py-12 text-center text-muted-foreground">
              <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No themes yet. Create your first theme.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit form */}
      {isEditing && (
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">{editingId ? 'Edit Theme' : 'New Theme'}</h3>
            <button onClick={() => { setEditingId(null); setShowNewForm(false); }}
              className="rounded-lg p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
          </div>

          {/* Color Presets */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" /> Quick Presets
            </p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  title={p.name}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  <span className="h-4 w-4 rounded-full border border-white shadow-sm flex-shrink-0" style={{ background: p.primary }} />
                  <span className="h-4 w-4 rounded-full border border-white shadow-sm flex-shrink-0" style={{ background: p.accent }} />
                  <span className="hidden sm:inline">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Theme Name</label>
              <input value={form.name} onChange={set('name')} className={inp} placeholder="My Custom Theme" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor} onChange={set('primaryColor')}
                  className="h-10 w-12 cursor-pointer rounded border bg-background p-1 flex-shrink-0" />
                <input value={form.primaryColor} onChange={set('primaryColor')} className={inp + ' font-mono'} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.accentColor} onChange={set('accentColor')}
                  className="h-10 w-12 cursor-pointer rounded border bg-background p-1 flex-shrink-0" />
                <input value={form.accentColor} onChange={set('accentColor')} className={inp + ' font-mono'} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" /> Font Family
              </label>
              <select value={form.fontFamily} onChange={set('fontFamily')} className={inp}>
                {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Border Radius</label>
              <div className="flex gap-2">
                {RADIUS_OPTIONS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, borderRadius: r.value }))}
                    className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors ${
                      form.borderRadius === r.value ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                    }`}
                    style={{ borderRadius: r.value === '0' ? '6px' : r.value }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3">Live Preview</p>
            <div className="flex flex-wrap items-start gap-6 rounded-xl border bg-muted/20 p-4">
              <ProductCardPreview
                primaryColor={form.primaryColor}
                accentColor={form.accentColor}
                fontFamily={form.fontFamily}
                borderRadius={form.borderRadius}
              />
              <div className="flex flex-col gap-3 flex-1 min-w-[160px]">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Primary</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg border" style={{ background: form.primaryColor }} />
                    <code className="text-xs font-mono">{form.primaryColor}</code>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Accent</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg border" style={{ background: form.accentColor }} />
                    <code className="text-xs font-mono">{form.accentColor}</code>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Font</p>
                  <p className="text-sm font-medium" style={{ fontFamily: form.fontFamily }}>{form.fontFamily}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Radius</p>
                  <p className="text-sm font-medium">{form.borderRadius || '0'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => { setEditingId(null); setShowNewForm(false); }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
            <button
              onClick={() => {
                if (editingId) {
                  updateMut.mutate({ id: editingId, data: form });
                } else {
                  createMut.mutate(form);
                }
              }}
              disabled={createMut.isPending || updateMut.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {(createMut.isPending || updateMut.isPending)
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Check className="h-4 w-4" />
              }
              Save & Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Banner Modal ─────────────────────────────────────────────

function BannerModal({ initial, onSave, onClose }: { initial?: Banner; onSave: (d: BannerFormData) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title:    initial?.title    ?? '',
    imageUrl: initial?.imageUrl ?? '',
    linkUrl:  initial?.linkUrl  ?? '',
    subtitle: initial?.subtitle ?? '',
    ctaText:  initial?.ctaText  ?? '',
    position: initial?.position ?? 'HERO_SLIDER',
    order:    String(initial?.order ?? 0),
    isActive: initial?.isActive ?? true,
    startsAt: initial?.startsAt?.slice(0, 10) ?? '',
    endsAt:   initial?.endsAt?.slice(0, 10)   ?? '',
  });
  const [uploading, setUploading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.url ?? res.data?.data?.url ?? '';
      if (url) setForm(f => ({ ...f, imageUrl: url }));
    } catch { /* ignore upload error */ } finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-background">
          <h3 className="font-bold text-lg">{initial ? 'Edit Banner' : 'Add Banner'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Title</label>
            <input value={form.title} onChange={set('title')} className={inp} placeholder="বাংলাদেশের সেরা বইয়ের দোকান" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Subtitle <span className="text-muted-foreground/60 font-normal">(Hero Slider)</span></label>
            <input value={form.subtitle} onChange={set('subtitle')} className={inp} placeholder="১ লাখেরও বেশি বই • সেরা দামে • দ্রুত ডেলিভারি" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">CTA Button Text <span className="text-muted-foreground/60 font-normal">(Hero Slider)</span></label>
            <input value={form.ctaText} onChange={set('ctaText')} className={inp} placeholder="বই দেখুন" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Image</label>
            <div className="flex gap-2">
              <input type="url" value={form.imageUrl} onChange={set('imageUrl')} className={inp} placeholder="https://... or upload below" />
              <label className={`flex-shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : 'hover:bg-accent'}`}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                Upload
                <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} />
              </label>
            </div>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" className="mt-2 h-20 w-full object-cover rounded-lg bg-muted"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Link URL (optional)</label>
            <input type="url" value={form.linkUrl} onChange={set('linkUrl')} className={inp} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Position</label>
              <select value={form.position} onChange={set('position')} className={inp}>
                <option value="HERO_SLIDER">🎯 Hero Slider — Homepage main banner</option>
                <option value="ANNOUNCEMENT_BAR">📢 Announcement Bar — header strip</option>
                <option value="OFFER_BANNER">🎁 Offer Banner — homepage coupon section</option>
                <option value="PROMO_1">🟠 Promo Row 1 — Categories-এর পরে</option>
                <option value="PROMO_2">🟠 Promo Row 2 — Flash Deals-এর পরে</option>
                <option value="PROMO_3">🟠 Promo Row 3 — Book World-এর পরে</option>
                <option value="PROMO_4">🟠 Promo Row 4 — New Arrivals-এর পরে</option>
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
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4 sticky bottom-0 bg-background">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button
            onClick={() => onSave({
              title: form.title, imageUrl: form.imageUrl,
              linkUrl: form.linkUrl, position: form.position,
              subtitle: form.subtitle || undefined,
              ctaText: form.ctaText || undefined,
              order: parseInt(form.order, 10), isActive: form.isActive,
              startsAt: form.startsAt || undefined, endsAt: form.endsAt || undefined,
            })}
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
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<BannerFormData> }) => designApi.updateBanner(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-banners'] }); setModal(null); } });
  const deleteMut = useMutation({ mutationFn: designApi.deleteBanner, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });
  const toggleMut = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => designApi.updateBanner(id, { isActive }), onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });

  const handleSave = (data: BannerFormData) => {
    if (typeof modal === 'object' && modal !== null) {
      updateMut.mutate({ id: (modal as Banner).id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const positionColor: Record<string, string> = {
    HERO_SLIDER:       'bg-indigo-100 text-indigo-700',
    PROMO_1:           'bg-orange-100 text-orange-700',
    PROMO_2:           'bg-orange-100 text-orange-700',
    PROMO_3:           'bg-orange-100 text-orange-700',
    PROMO_4:           'bg-orange-100 text-orange-700',
    ANNOUNCEMENT_BAR:  'bg-yellow-100 text-yellow-700',
    OFFER_BANNER:      'bg-emerald-100 text-emerald-700',
    hero:              'bg-blue-100 text-blue-700',
    top:               'bg-green-100 text-green-700',
    sidebar:           'bg-purple-100 text-purple-700',
    bottom:            'bg-gray-100 text-gray-700',
    popup:             'bg-red-100 text-red-700',
  };

  const positionLabel: Record<string, string> = {
    HERO_SLIDER:      '🎯 Hero Slider',
    PROMO_1:          'Promo Row 1',
    PROMO_2:          'Promo Row 2',
    PROMO_3:          'Promo Row 3',
    PROMO_4:          'Promo Row 4',
    ANNOUNCEMENT_BAR: '📢 Announcement Bar',
    OFFER_BANNER:     '🎁 Offer Banner',
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const heroSlides = banners.filter(b => b.position === 'HERO_SLIDER');

  return (
    <div>
      {/* Hero Slider info */}
      <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">🎯</span>
        <div className="text-sm">
          <p className="font-bold text-indigo-800">Hero Slider Control</p>
          <p className="text-indigo-700 mt-0.5">
            {heroSlides.length > 0
              ? `${heroSlides.length} custom slide${heroSlides.length > 1 ? 's' : ''} active — these replace the default category banners on the homepage.`
              : 'No custom slides yet — homepage is showing the default category banners. Add a banner with position "Hero Slider" to override.'}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{banners.length} banner{banners.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Banner</th>
                <th className="hidden px-4 py-3 text-center font-semibold text-muted-foreground sm:table-cell">Position</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground md:table-cell">Schedule</th>
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
                        <img src={b.imageUrl} alt={b.title}
                          className="h-10 w-16 rounded object-cover flex-shrink-0 bg-muted"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{b.title}</p>
                        {b.linkUrl && <p className="text-xs text-muted-foreground truncate max-w-40">{b.linkUrl}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-center sm:table-cell">
                    <Badge color={positionColor[b.position] ?? 'bg-gray-100 text-gray-600'}>{positionLabel[b.position] ?? b.position}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {b.startsAt ? `${new Date(b.startsAt).toLocaleDateString()}` : '—'}
                    {b.endsAt ? ` → ${new Date(b.endsAt).toLocaleDateString()}` : ''}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleMut.mutate({ id: b.id, isActive: !b.isActive })}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                        b.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {b.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(b)}
                        className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteMut.mutate(b.id)}
                        className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-700 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                  No banners yet
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
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

// ─── Homepage Sections Tab ─────────────────────────────────────

function SectionsTab() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newSection, setNewSection] = useState<SectionFormData>({ type: 'hero', title: '', subtitle: '', order: 0 });

  const { data: sections = [], isLoading } = useQuery<Section[]>({
    queryKey: ['design-sections'],
    queryFn: designApi.getSections,
  });

  const createMut = useMutation({
    mutationFn: designApi.createSection,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-sections'] }); setShowAdd(false); setNewSection({ type: 'hero', title: '', subtitle: '', order: sections.length }); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SectionFormData & { isActive: boolean }> }) => designApi.updateSection(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['design-sections'] }),
  });
  const deleteMut = useMutation({ mutationFn: designApi.deleteSection, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-sections'] }) });
  const reorderMut = useMutation({ mutationFn: designApi.reorderSections, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-sections'] }) });

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    const temp = newSections[index]!;
    newSections[index] = newSections[targetIndex]!;
    newSections[targetIndex] = temp;
    const items = newSections.map((s, i) => ({ id: s.id, order: i }));
    reorderMut.mutate(items);
  };

  const SECTION_TYPES = [
    'hero', 'flash-deals', 'new-arrivals', 'bestsellers',
    'categories', 'banners', 'reviews', 'newsletter',
    'featured-categories', 'top-products', 'testimonials', 'custom-html',
  ];

  const typeColor: Record<string, string> = {
    'hero':                'bg-indigo-100 text-indigo-700',
    'flash-deals':         'bg-red-100 text-red-700',
    'new-arrivals':        'bg-green-100 text-green-700',
    'bestsellers':         'bg-orange-100 text-orange-700',
    'categories':          'bg-purple-100 text-purple-700',
    'banners':             'bg-blue-100 text-blue-700',
    'reviews':             'bg-yellow-100 text-yellow-700',
    'newsletter':          'bg-teal-100 text-teal-700',
    'featured-categories': 'bg-violet-100 text-violet-700',
    'top-products':        'bg-amber-100 text-amber-700',
    'testimonials':        'bg-pink-100 text-pink-700',
    'custom-html':         'bg-gray-100 text-gray-700',
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sections.length} homepage section{sections.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 rounded-xl border bg-card p-4 space-y-3">
          <p className="font-semibold text-sm">New Section</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Type</label>
              <select value={newSection.type}
                onChange={e => setNewSection(s => ({ ...s, type: e.target.value }))}
                className={inp}>
                {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Title (optional)</label>
              <input value={newSection.title}
                onChange={e => setNewSection(s => ({ ...s, title: e.target.value }))}
                placeholder="Section title" className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Subtitle (optional)</label>
              <input value={newSection.subtitle}
                onChange={e => setNewSection(s => ({ ...s, subtitle: e.target.value }))}
                placeholder="Brief subtitle" className={inp} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
            <button onClick={() => createMut.mutate({ ...newSection, order: sections.length })}
              disabled={createMut.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Add
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sections.map((sec, i) => (
          <div key={sec.id}
            className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors ${!sec.isActive ? 'opacity-60' : ''}`}>
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button onClick={() => moveSection(i, 'up')} disabled={i === 0}
                className="rounded p-0.5 hover:bg-accent disabled:opacity-30">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => moveSection(i, 'down')} disabled={i === sections.length - 1}
                className="rounded p-0.5 hover:bg-accent disabled:opacity-30">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="w-5 text-xs font-bold text-muted-foreground text-center flex-shrink-0">{i + 1}</span>
            <Badge color={typeColor[sec.type] ?? 'bg-gray-100 text-gray-600'}>{sec.type}</Badge>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{sec.title || <span className="text-muted-foreground italic">No title</span>}</p>
              {sec.subtitle && <p className="text-xs text-muted-foreground truncate">{sec.subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => updateMut.mutate({ id: sec.id, data: { isActive: !sec.isActive } })}
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                  sec.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
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

// ─── Hero Slider Tab ──────────────────────────────────────────

function HeroSliderTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create' | Banner | null>(null);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['design-banners'],
    queryFn: designApi.getBanners,
  });

  const heroSlides = banners
    .filter(b => b.position === 'HERO_SLIDER')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const createMut = useMutation({ mutationFn: designApi.createBanner, onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-banners'] }); setModal(null); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<BannerFormData> }) => designApi.updateBanner(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['design-banners'] }); setModal(null); } });
  const deleteMut = useMutation({ mutationFn: designApi.deleteBanner, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });
  const toggleMut = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => designApi.updateBanner(id, { isActive }), onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });
  const orderMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<BannerFormData> }) => designApi.updateBanner(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });

  const handleSave = (data: BannerFormData) => {
    const payload = { ...data, position: 'HERO_SLIDER' };
    if (typeof modal === 'object' && modal !== null) {
      updateMut.mutate({ id: (modal as Banner).id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const move = (slide: Banner, dir: 'up' | 'down') => {
    const i = heroSlides.findIndex(s => s.id === slide.id);
    const target = heroSlides[dir === 'up' ? i - 1 : i + 1];
    if (!target) return;
    orderMut.mutate({ id: slide.id, data: { order: target.order } });
    orderMut.mutate({ id: target.id, data: { order: slide.order } });
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm">
        <p className="font-bold text-indigo-800 mb-1">🎯 Hero Slider — Homepage মেইন ব্যানার</p>
        <p className="text-indigo-700">
          {heroSlides.length > 0
            ? `${heroSlides.length}টি কাস্টম স্লাইড সক্রিয় — ডিফল্ট ক্যাটাগরি ব্যানারের পরিবর্তে এগুলো দেখাচ্ছে।`
            : 'কোনো কাস্টম স্লাইড নেই — homepage-এ ডিফল্ট ক্যাটাগরি ব্যানার দেখাচ্ছে। নিচে "Add Slide" করুন।'}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{heroSlides.length} slide{heroSlides.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Slide
        </button>
      </div>

      {/* Slides grid */}
      <div className="space-y-3">
        {heroSlides.map((slide, i) => (
          <div
            key={slide.id}
            className={`flex gap-4 rounded-xl border bg-card p-3 transition-colors ${!slide.isActive ? 'opacity-60' : ''}`}
          >
            {/* Thumbnail */}
            {slide.imageUrl ? (
              <img
                src={slide.imageUrl} alt={slide.title}
                className="h-20 w-32 flex-shrink-0 rounded-lg object-cover bg-muted"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-20 w-32 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-6 w-6 opacity-40" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{slide.title}</p>
                  {slide.subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{slide.subtitle}</p>}
                  {slide.ctaText && (
                    <span className="inline-block mt-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      CTA: {slide.ctaText}
                    </span>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs font-bold text-muted-foreground">#{i + 1}</span>
              </div>
              {slide.linkUrl && (
                <p className="text-[11px] text-muted-foreground truncate mt-1">{slide.linkUrl}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end justify-between gap-1 flex-shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleMut.mutate({ id: slide.id, isActive: !slide.isActive })}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${slide.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {slide.isActive ? 'Active' : 'Off'}
                </button>
                <button onClick={() => setModal(slide)} className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-700">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteMut.mutate(slide.id)} className="rounded-lg p-1.5 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex gap-0.5">
                <button
                  disabled={i === 0}
                  onClick={() => move(slide, 'up')}
                  className="rounded p-0.5 hover:bg-accent disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={i === heroSlides.length - 1}
                  onClick={() => move(slide, 'down')}
                  className="rounded p-0.5 hover:bg-accent disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {heroSlides.length === 0 && (
          <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">কোনো স্লাইড নেই। "Add Slide" করুন।</p>
          </div>
        )}
      </div>

      {modal !== null && (
        <BannerModal
          initial={typeof modal === 'object' ? (modal as Banner) : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Announcement Bar Tab ─────────────────────────────────────
function AnnouncementBarTab() {
  const qc = useQueryClient();
  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['design-banners'],
    queryFn: designApi.getBanners,
  });

  const bar = banners.find(b => b.position === 'ANNOUNCEMENT_BAR');

  const createMut = useMutation({ mutationFn: designApi.createBanner, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<BannerFormData> }) => designApi.updateBanner(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });
  const deleteMut = useMutation({ mutationFn: designApi.deleteBanner, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });

  const [form, setForm] = useState({
    textBn: '', textEn: '', link: '', bgColor: '#1d4ed8', textColor: '#ffffff', active: true,
  });
  const [synced, setSynced] = useState(false);

  if (bar && !synced) {
    setSynced(true);
    setForm({
      textBn: bar.title ?? '',
      textEn: bar.subtitle ?? '',
      link: bar.linkUrl ?? '',
      bgColor: bar.imageUrl?.startsWith('#') ? bar.imageUrl : '#1d4ed8',
      textColor: bar.ctaText?.startsWith('#') ? bar.ctaText : '#ffffff',
      active: bar.isActive,
    });
  }

  const handleSave = () => {
    const data: BannerFormData = {
      title: form.textBn,
      subtitle: form.textEn,
      linkUrl: form.link,
      imageUrl: form.bgColor,
      ctaText: form.textColor,
      position: 'ANNOUNCEMENT_BAR',
      order: 0,
      isActive: form.active,
    };
    if (bar) {
      updateMut.mutate({ id: bar.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
        <p className="font-bold text-yellow-800">📢 Announcement Bar — Header Strip</p>
        <p className="text-yellow-700 mt-0.5">A colored banner shown at the very top of every page. Use it for promotions, shipping notices, or important announcements.</p>
      </div>

      {/* Live preview */}
      <div className="rounded-xl border overflow-hidden">
        <p className="text-xs font-semibold text-muted-foreground px-3 py-2 border-b bg-muted/30">Preview</p>
        <div
          className="px-4 py-2.5 text-sm font-semibold text-center"
          style={{ background: form.bgColor, color: form.textColor }}
        >
          {form.textBn || 'আপনার ঘোষণা এখানে আসবে'} {form.link && '→'}
        </div>
      </div>

      <div className="rounded-xl border bg-card px-5 py-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Bengali Text</label>
            <input value={form.textBn} onChange={e => setForm(f => ({ ...f, textBn: e.target.value }))} className={inp} placeholder="বিশেষ অফার চলছে!" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">English Text</label>
            <input value={form.textEn} onChange={e => setForm(f => ({ ...f, textEn: e.target.value }))} className={inp} placeholder="Special offer running!" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Link URL (optional)</label>
          <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} className={inp} placeholder="/products" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Background Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                className="h-9 w-12 cursor-pointer rounded border p-0.5 flex-shrink-0" />
              <input value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))} className={inp + ' font-mono'} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Text Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.textColor} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))}
                className="h-9 w-12 cursor-pointer rounded border p-0.5 flex-shrink-0" />
              <input value={form.textColor} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))} className={inp + ' font-mono'} />
            </div>
          </div>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="h-4 w-4 rounded border" />
          <span className="text-sm font-medium">Show announcement bar on site</span>
        </label>
      </div>

      <div className="flex items-center justify-between">
        {bar && (
          <button onClick={() => { deleteMut.mutate(bar.id); setSynced(false); }}
            disabled={deleteMut.isPending}
            className="text-sm text-red-600 hover:text-red-800 hover:underline">
            Remove bar
          </button>
        )}
        <button onClick={handleSave} disabled={isPending}
          className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Announcement Bar
        </button>
      </div>
    </div>
  );
}

// ─── Offer Banner Tab ─────────────────────────────────────────
function OfferBannerTab() {
  const qc = useQueryClient();
  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['design-banners'],
    queryFn: designApi.getBanners,
  });

  const offer = banners.find(b => b.position === 'OFFER_BANNER');

  const createMut = useMutation({ mutationFn: designApi.createBanner, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<BannerFormData> }) => designApi.updateBanner(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });
  const deleteMut = useMutation({ mutationFn: designApi.deleteBanner, onSuccess: () => qc.invalidateQueries({ queryKey: ['design-banners'] }) });

  const [form, setForm] = useState({
    headlineBn: '', headlineEn: '', couponCode: '', minOrder: '500', link: '/products', bgFrom: '#059669', active: true,
  });
  const [synced, setSynced] = useState(false);

  if (offer && !synced) {
    setSynced(true);
    setForm({
      headlineBn: offer.title ?? '',
      headlineEn: offer.subtitle ?? '',
      couponCode: offer.ctaText ?? '',
      minOrder: offer.imageUrl ?? '500',
      link: offer.linkUrl ?? '/products',
      bgFrom: '#059669',
      active: offer.isActive,
    });
  }

  const handleSave = () => {
    const data: BannerFormData = {
      title: form.headlineBn,
      subtitle: form.headlineEn,
      ctaText: form.couponCode,
      imageUrl: form.minOrder,
      linkUrl: form.link,
      position: 'OFFER_BANNER',
      order: 0,
      isActive: form.active,
    };
    if (offer) {
      updateMut.mutate({ id: offer.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
        <p className="font-bold text-emerald-800">🎁 Offer Banner — Homepage Coupon Section</p>
        <p className="text-emerald-700 mt-0.5">A prominent offer strip on the homepage showing a coupon code. Leave inactive to hide it.</p>
      </div>

      {/* Preview */}
      <div className="rounded-xl border overflow-hidden">
        <p className="text-xs font-semibold text-muted-foreground px-3 py-2 border-b bg-muted/30">Preview</p>
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div>
            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-0.5">🎉 বিশেষ অফার</p>
            <p className="text-white font-black text-lg">{form.headlineBn || 'প্রথম অর্ডারে ১৫% ছাড়!'}</p>
            <p className="text-white/70 text-xs mt-0.5">কোড: {form.couponCode || 'UNKORA15'} • ৳{form.minOrder}+ অর্ডারে প্রযোজ্য</p>
          </div>
          <div className="hidden sm:block bg-white/20 rounded-xl px-4 py-2 text-center border border-white/20">
            <span className="font-mono font-black text-white text-lg">{form.couponCode || 'UNKORA15'}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card px-5 py-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Bengali Headline</label>
            <input value={form.headlineBn} onChange={e => setForm(f => ({ ...f, headlineBn: e.target.value }))} className={inp} placeholder="প্রথম অর্ডারে ১৫% ছাড়!" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">English Headline</label>
            <input value={form.headlineEn} onChange={e => setForm(f => ({ ...f, headlineEn: e.target.value }))} className={inp} placeholder="Get 15% off your first order!" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Coupon Code</label>
            <input value={form.couponCode} onChange={e => setForm(f => ({ ...f, couponCode: e.target.value.toUpperCase() }))} className={inp + ' font-mono'} placeholder="UNKORA15" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Min Order Amount (৳)</label>
            <input type="number" min="0" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} className={inp} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">CTA Link URL</label>
          <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} className={inp} placeholder="/products" />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="h-4 w-4 rounded border" />
          <span className="text-sm font-medium">Show offer banner on homepage</span>
        </label>
      </div>

      <div className="flex items-center justify-between">
        {offer && (
          <button onClick={() => { deleteMut.mutate(offer.id); setSynced(false); }}
            disabled={deleteMut.isPending}
            className="text-sm text-red-600 hover:text-red-800 hover:underline">
            Remove offer banner
          </button>
        )}
        <button onClick={handleSave} disabled={isPending}
          className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save Offer Banner
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

type TabId = 'themes' | 'hero-slider' | 'announcement-bar' | 'offer-banner' | 'banners' | 'homepage';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'themes',            label: 'Themes & Colors',  icon: Palette },
  { id: 'hero-slider',       label: 'Hero Slider',       icon: ImageIcon },
  { id: 'announcement-bar',  label: 'Announcement Bar',  icon: Megaphone },
  { id: 'offer-banner',      label: 'Offer Banner',      icon: Gift },
  { id: 'banners',           label: 'All Banners',       icon: Layout },
  { id: 'homepage',          label: 'Homepage Sections', icon: Layout },
];

export default function DesignPage() {
  const [tab, setTab] = useState<TabId>('themes');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold">Design Studio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Customize themes, banners, and homepage layout</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b pb-px">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'themes'            && <ThemesTab />}
      {tab === 'hero-slider'       && <HeroSliderTab />}
      {tab === 'announcement-bar'  && <AnnouncementBarTab />}
      {tab === 'offer-banner'      && <OfferBannerTab />}
      {tab === 'banners'           && <BannersTab />}
      {tab === 'homepage'          && <SectionsTab />}
    </div>
  );
}
