'use client';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Layers, Plus, Trash2, Loader2, ToggleLeft, ToggleRight,
  Upload, Pencil, X, ExternalLink, ImageIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  isActive: boolean;
  createdAt: string;
  startsAt?: string;
  endsAt?: string;
}
type Form = { title: string; imageUrl: string; linkUrl: string; position: string; startsAt: string; endsAt: string };

const EMPTY: Form = { title: '', imageUrl: '', linkUrl: '', position: 'AD_SLIDER', startsAt: '', endsAt: '' };
const POSITIONS = ['AD_SLIDER', 'PROMO', 'HERO', 'CATEGORY', 'SIDEBAR', 'FOOTER', 'POPUP'];
const POS_COLOR: Record<string, string> = {
  AD_SLIDER: 'bg-emerald-100 text-emerald-700',
  PROMO: 'bg-orange-100 text-orange-700',
  HERO: 'bg-blue-100 text-blue-700',
  CATEGORY: 'bg-purple-100 text-purple-700',
  SIDEBAR: 'bg-green-100 text-green-700',
  FOOTER: 'bg-gray-100 text-gray-600',
  POPUP: 'bg-red-100 text-red-700',
};
const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400';

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
    queryFn: () => api.get('/design/banners?limit=100').then(r => r.data?.data ?? []).catch(() => []),
  });
  const banners: Banner[] = data ?? [];

  const openNew = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (b: Banner) => {
    setForm({ title: b.title, imageUrl: b.imageUrl, linkUrl: b.linkUrl ?? '', position: b.position, startsAt: b.startsAt?.slice(0,16) ?? '', endsAt: b.endsAt?.slice(0,16) ?? '' });
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
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
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
    } catch {
      toast.error('Failed to save banner');
    } finally {
      setSaving(false);
    }
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

  const grouped = POSITIONS.reduce<Record<string, Banner[]>>((acc, pos) => {
    acc[pos] = banners.filter(b => b.position === pos);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-orange-500" /> Banners & Promotional Images
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload clickable banner images. <strong>AD_SLIDER</strong> banners show in the homepage hero ad slider (top-left). <strong>PROMO</strong> banners appear in the homepage middle section.
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-orange-600 transition-colors flex-shrink-0">
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-bold text-gray-900">{editId ? 'Edit Banner' : 'New Banner'}</h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Banner Image</label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="https://... or upload below" className={inp} />
                    <div className="flex gap-2">
                      <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors disabled:opacity-60">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        {uploading ? 'Uploading…' : 'Upload Image'}
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
                    </div>
                  </div>
                  {form.imageUrl && (
                    <div className="w-20 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Summer Sale Banner" className={inp} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Position *</label>
                  <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className={inp}>
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Click URL (product/category page)</label>
                  <input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                    placeholder="/products/slug or /categories/slug or https://..." className={inp} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Show From (optional)</label>
                  <input type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Show Until (optional)</label>
                  <input type="datetime-local" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} className={inp} />
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? 'Update' : 'Create'} Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <ImageIcon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No banners yet</p>
          <p className="text-sm text-gray-400 mt-1">Add a PROMO banner to display clickable images on the homepage</p>
          <button onClick={openNew}
            className="mt-4 inline-flex items-center gap-2 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors">
            <Plus className="h-4 w-4" /> Add First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {POSITIONS.map(pos => {
            const list = grouped[pos] ?? [];
            if (list.length === 0) return null;
            return (
              <div key={pos}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${POS_COLOR[pos] ?? 'bg-gray-100 text-gray-600'}`}>{pos}</span>
                  <span className="text-xs text-gray-400">{list.length} banner{list.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map(b => (
                    <div key={b.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${b.isActive ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'}`}>
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                        {!b.isActive && (
                          <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
                            <span className="bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded">Inactive</span>
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
                        <div className="flex items-center justify-between mt-3">
                          <button onClick={() => toggleActive(b)}
                            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${b.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            {b.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                            {b.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(b)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteBanner(b.id)} disabled={deleting === b.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              {deleting === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
