'use client';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Layers, Plus, Trash2, Loader2, ToggleLeft, ToggleRight,
  Upload, Pencil, X, ExternalLink, ImageIcon, Zap, Layout,
  Monitor, Megaphone, Grid3X3, PanelLeft, AlignEndHorizontal, BellDot,
  Info,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  order?: number;
  isActive: boolean;
  createdAt: string;
  startsAt?: string;
  endsAt?: string;
}
type Form = {
  title: string; imageUrl: string; linkUrl: string;
  position: string; startsAt: string; endsAt: string; order: string;
};

const EMPTY: Form = { title: '', imageUrl: '', linkUrl: '', position: 'AD_SLIDER', startsAt: '', endsAt: '', order: '' };

/* Primary positions — always show as sections */
const PRIMARY_POSITIONS: { key: string; label: string; desc: string; icon: React.ElementType; color: string; badge: string }[] = [
  {
    key: 'AD_SLIDER',
    label: 'Ad Slider',
    desc: 'Homepage left-side rotating banner. Auto-plays every 4.5s. Max 5 banners.',
    icon: Zap,
    color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'HERO',
    label: 'Hero Banner',
    desc: 'Full-width top-of-page hero image. First thing visitors see.',
    icon: Layout,
    color: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'PROMO',
    label: 'Promo Banners',
    desc: 'Middle-section promotional images on homepage.',
    icon: Megaphone,
    color: 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
    badge: 'bg-orange-100 text-orange-700',
  },
  {
    key: 'CATEGORY',
    label: 'Category Banners',
    desc: 'Displayed on category/collection pages.',
    icon: Grid3X3,
    color: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
    badge: 'bg-purple-100 text-purple-700',
  },
];

/* Secondary positions — show only if they have banners */
const SECONDARY_POSITIONS: { key: string; label: string; icon: React.ElementType; badge: string }[] = [
  { key: 'SIDEBAR',  label: 'Sidebar',  icon: PanelLeft,            badge: 'bg-green-100 text-green-700' },
  { key: 'FOOTER',   label: 'Footer',   icon: AlignEndHorizontal,   badge: 'bg-gray-100 text-gray-600' },
  { key: 'POPUP',    label: 'Popup',    icon: BellDot,      badge: 'bg-red-100 text-red-700' },
];

const ALL_POSITIONS = [...PRIMARY_POSITIONS.map(p => p.key), ...SECONDARY_POSITIONS.map(p => p.key)];

const POS_BADGE: Record<string, string> = {
  AD_SLIDER: 'bg-emerald-100 text-emerald-700',
  HERO: 'bg-blue-100 text-blue-700',
  PROMO: 'bg-orange-100 text-orange-700',
  CATEGORY: 'bg-purple-100 text-purple-700',
  SIDEBAR: 'bg-green-100 text-green-700',
  FOOTER: 'bg-gray-100 text-gray-600',
  POPUP: 'bg-red-100 text-red-700',
};

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-gray-50/50';

export default function BannersPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<Banner[]>({
    queryKey: ['design-banners'],
    queryFn: () => api.get('/design/banners?limit=200').then(r => r.data?.data ?? r.data ?? []).catch(() => []),
  });
  const banners: Banner[] = data ?? [];

  const openNew = (pos?: string) => {
    setForm({ ...EMPTY, position: pos ?? 'AD_SLIDER' });
    setEditId(null);
    setShowModal(true);
  };
  const openEdit = (b: Banner) => {
    setForm({
      title: b.title, imageUrl: b.imageUrl, linkUrl: b.linkUrl ?? '',
      position: b.position, order: b.order?.toString() ?? '',
      startsAt: b.startsAt?.slice(0, 16) ?? '', endsAt: b.endsAt?.slice(0, 16) ?? '',
    });
    setEditId(b.id);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditId(null); setForm(EMPTY); };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.url ?? res.data?.data?.url ?? '';
      if (url) setForm(f => ({ ...f, imageUrl: url }));
      else toast.error('Upload returned no URL');
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title || !form.imageUrl) { toast.error('Title and image are required'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        imageUrl: form.imageUrl,
        linkUrl: form.linkUrl || undefined,
        position: form.position,
        isActive: true,
        order: form.order ? parseInt(form.order) : undefined,
        ...(form.startsAt ? { startsAt: new Date(form.startsAt).toISOString() } : {}),
        ...(form.endsAt ? { endsAt: new Date(form.endsAt).toISOString() } : {}),
      };
      if (editId) {
        await api.patch(`/design/banners/${editId}`, payload);
        toast.success('Banner updated');
      } else {
        await api.post('/design/banners', payload);
        toast.success('Banner created');
      }
      closeModal();
      qc.invalidateQueries({ queryKey: ['design-banners'] });
    } catch { toast.error('Failed to save banner'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (b: Banner) => {
    try {
      await api.patch(`/design/banners/${b.id}`, { isActive: !b.isActive });
      qc.invalidateQueries({ queryKey: ['design-banners'] });
    } catch { toast.error('Failed to update'); }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    setDeleting(id);
    try {
      await api.delete(`/design/banners/${id}`);
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['design-banners'] });
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const byPos = (pos: string) => banners.filter(b => b.position === pos).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" /> Banners & Sliders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage promotional banners across all site positions. Click <strong>+ Add</strong> in any section to create a banner for that position.
          </p>
        </div>
        <button onClick={() => openNew()}
          className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-indigo-700 transition-colors flex-shrink-0 shadow-sm shadow-indigo-500/20">
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h2 className="font-bold text-gray-900">{editId ? 'Edit Banner' : 'New Banner'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Banner Image *</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="https://... or upload below" className={inp} />
                    <div className="flex gap-2">
                      <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors disabled:opacity-60">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        {uploading ? 'Uploading…' : 'Upload Image'}
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
                    </div>
                  </div>
                  {form.imageUrl && (
                    <div className="w-20 h-14 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                      <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Summer Sale" className={inp} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Position *</label>
                  <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className={inp}>
                    {ALL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Click URL</label>
                  <input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                    placeholder="/products/slug  or  /categories/slug  or  https://..." className={inp} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Display Order</label>
                  <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                    placeholder="1, 2, 3…" min="1" className={inp} />
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Show From</label>
                    <input type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Show Until</label>
                    <input type="datetime-local" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} className={inp} />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm shadow-indigo-500/20">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? 'Update' : 'Create'} Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin h-6 w-6 text-indigo-500" /></div>
      ) : (
        <div className="space-y-8">
          {/* Primary positions — always visible */}
          {PRIMARY_POSITIONS.map(pos => {
            const list = byPos(pos.key);
            const Icon = pos.icon;
            return (
              <div key={pos.key} className={`rounded-2xl border bg-gradient-to-br ${pos.color} overflow-hidden`}>
                {/* Section header */}
                <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/60 bg-white/50">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4.5 w-4.5 text-gray-700" style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-900 text-[15px]">{pos.label}</h2>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${pos.badge}`}>{pos.key}</span>
                        <span className="text-xs text-gray-400">{list.length} banner{list.length !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Info className="h-3 w-3 flex-shrink-0" />{pos.desc}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => openNew(pos.key)}
                    className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 font-semibold py-1.5 px-3 rounded-xl text-xs hover:bg-gray-50 transition-colors flex-shrink-0 shadow-sm">
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>

                {/* Cards */}
                {list.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <ImageIcon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No {pos.label} banners yet</p>
                    <button onClick={() => openNew(pos.key)}
                      className="mt-3 inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                      <Plus className="h-3.5 w-3.5" /> Create First Banner
                    </button>
                  </div>
                ) : (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map(b => (
                      <BannerCard key={b.id} banner={b} onEdit={() => openEdit(b)} onToggle={() => toggleActive(b)}
                        onDelete={() => deleteBanner(b.id)} deleting={deleting === b.id} badge={pos.badge} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Secondary positions — only if they have banners */}
          {SECONDARY_POSITIONS.map(pos => {
            const list = byPos(pos.key);
            if (list.length === 0) return null;
            const Icon = pos.icon;
            return (
              <div key={pos.key} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b bg-gray-50/80">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                    <h2 className="font-semibold text-gray-800 text-sm">{pos.label}</h2>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${pos.badge}`}>{pos.key}</span>
                    <span className="text-xs text-gray-400">{list.length} banner{list.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button onClick={() => openNew(pos.key)}
                    className="flex items-center gap-1.5 border border-gray-200 text-gray-600 font-semibold py-1 px-2.5 rounded-lg text-xs hover:bg-gray-100 transition-colors">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map(b => (
                    <BannerCard key={b.id} banner={b} onEdit={() => openEdit(b)} onToggle={() => toggleActive(b)}
                      onDelete={() => deleteBanner(b.id)} deleting={deleting === b.id} badge={pos.badge} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Unknown positions (if any) */}
          {(() => {
            const unknownBanners = banners.filter(b => !ALL_POSITIONS.includes(b.position));
            if (!unknownBanners.length) return null;
            return (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-5 py-3.5 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-600 text-sm">Other Positions</h2>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unknownBanners.map(b => (
                    <BannerCard key={b.id} banner={b} onEdit={() => openEdit(b)} onToggle={() => toggleActive(b)}
                      onDelete={() => deleteBanner(b.id)} deleting={deleting === b.id}
                      badge={POS_BADGE[b.position] ?? 'bg-gray-100 text-gray-600'} />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

/* ─── Reusable Banner Card ───────────────────────────────────── */
function BannerCard({
  banner: b, onEdit, onToggle, onDelete, deleting, badge,
}: {
  banner: Banner; onEdit: () => void; onToggle: () => void;
  onDelete: () => void; deleting: boolean; badge: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${b.isActive ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'}`}>
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {b.imageUrl ? (
          <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="h-8 w-8 text-gray-200" />
          </div>
        )}
        {!b.isActive && (
          <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
            <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">Inactive</span>
          </div>
        )}
        {b.order != null && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            #{b.order}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm truncate">{b.title}</p>
        {b.linkUrl && (
          <a href={b.linkUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-500 hover:underline truncate mt-0.5">
            <ExternalLink className="h-3 w-3 flex-shrink-0" />{b.linkUrl}
          </a>
        )}
        {(b.startsAt || b.endsAt) && (
          <p className="text-[10px] text-gray-400 mt-1 truncate">
            {b.startsAt ? new Date(b.startsAt).toLocaleDateString() : '∞'} →
            {b.endsAt ? new Date(b.endsAt).toLocaleDateString() : '∞'}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
          <button onClick={onToggle}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${b.isActive ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}>
            {b.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            {b.isActive ? 'Active' : 'Inactive'}
          </button>
          <div className="flex gap-1">
            <button onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} disabled={deleting}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
