'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, ChevronUp, ChevronDown, Eye, EyeOff, Save, LayoutGrid,
  Palette, Link as LinkIcon, Type, Image as ImageIcon, X, Check,
} from 'lucide-react';
import api from '@/lib/api';
import { categoriesApi, type Category } from '@/lib/api/products';
import { toast } from 'sonner';

// ─── Emoji library ────────────────────────────────────────────
const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  { label: 'Shopping', emojis: ['🛒','🛍️','💳','🏷️','🎁','📦','🧾','💰','🏪','🏬','💎','👑','🎀','🎊','🎉'] },
  { label: 'Books & Education', emojis: ['📚','📖','📝','✏️','📐','📏','🎓','🏫','📒','📓','📔','📕','📗','📘','📙'] },
  { label: 'Food & Organic', emojis: ['🌿','🍎','🥦','🥕','🌾','🍯','🧄','🥑','🍋','🌽','🫐','🍓','🥝','🌰','🫒'] },
  { label: 'Clothing & Fashion', emojis: ['👗','👔','👜','👛','👒','🧢','👟','👠','🧣','🧤','💍','💄','👄','🕶️','🧥'] },
  { label: 'Kids & Baby', emojis: ['👶','🧸','🎠','🎡','🎪','🪀','🎈','🍼','🧩','🎯','🎭','🪄','🎨','✂️','🖍️'] },
  { label: 'Electronics', emojis: ['⚡','📱','💻','🖥️','⌨️','🖱️','📷','🎙️','📺','🎮','🕹️','🔋','💡','🔌','📡'] },
  { label: 'Home & Living', emojis: ['🏠','🛋️','🪴','🕯️','🛁','🪞','🧹','🍳','☕','🍽️','🛏️','🚿','🪑','🪟','🏡'] },
  { label: 'Islamic & Spiritual', emojis: ['🕌','📿','🤲','☪️','🌙','⭐','🕋','📖','🫶','🙏','🕊️','🌺','💚','🌿','🤍'] },
  { label: 'Craft & Art', emojis: ['🎨','🖌️','✂️','🧵','🪡','🧶','🖼️','🎭','🎪','🪆','🏺','🎋','🎍','🪅','🎑'] },
  { label: 'Sports & Lifestyle', emojis: ['🏏','⚽','🏀','🎾','🏋️','🧘','🚴','🏊','🎯','🥊','🏆','🥇','🤸','🎿','🪃'] },
  { label: 'Health & Beauty', emojis: ['💊','🌸','🧴','🧼','💆','🪷','🌹','💐','🌻','🍃','🫧','🪥','💅','🩺','🧬'] },
  { label: 'Daily & Grocery', emojis: ['🥚','🧈','🥛','🍞','🧃','🥤','🫙','🧂','🫕','🍱','🛒','🧺','🪣','🧻','🗑️'] },
];

const COLOR_PRESETS = [
  '#2563eb','#1d4ed8','#7c3aed','#db2777','#dc2626','#ea580c',
  '#d97706','#16a34a','#0d9488','#0891b2','#065f46','#0f172a',
  '#374151','#6b7280','#92400e','#78350f',
];

const inp = 'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  isFeatured: boolean;
  sortOrder: number;
  icon?: string;
  imageUrl?: string;
  color?: string;
  navLabel?: string;
  navLink?: string;
  childrenCount?: number;
}

// ─── Icon Picker Popover ───────────────────────────────────────
function IconPicker({ value, onSelect, onClose }: { value?: string; onSelect: (e: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = search.trim()
    ? EMOJI_GROUPS.map(g => ({ ...g, emojis: g.emojis.filter(e => e.includes(search)) })).filter(g => g.emojis.length > 0)
    : EMOJI_GROUPS;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-11 z-50 bg-background border rounded-2xl shadow-2xl w-72 max-h-80 overflow-y-auto"
    >
      <div className="sticky top-0 bg-background px-3 pt-3 pb-2 border-b">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search emoji…"
            className="flex-1 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="p-3 space-y-3">
        {filtered.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{group.label}</p>
            <div className="grid grid-cols-7 gap-1">
              {group.emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-accent transition-colors ${value === emoji ? 'ring-2 ring-primary bg-primary/10' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Row Detail Drawer ─────────────────────────────────────────
function RowDrawer({ row, onUpdate, onClose }: { row: CategoryRow; onUpdate: (r: Partial<CategoryRow>) => void; onClose: () => void }) {
  const [localIcon, setLocalIcon] = useState(row.icon ?? '📦');
  const [localColor, setLocalColor] = useState(row.color ?? '#2563eb');
  const [localLabel, setLocalLabel] = useState(row.navLabel ?? '');
  const [localLink, setLocalLink] = useState(row.navLink ?? '');
  const [localImage, setLocalImage] = useState(row.imageUrl ?? '');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data?.url ?? res.data?.data?.url ?? '';
      if (url) setLocalImage(url);
    } catch { /* ignore */ } finally { setUploading(false); }
  };

  const handleSave = () => {
    onUpdate({
      icon: localIcon,
      color: localColor,
      navLabel: localLabel || undefined,
      navLink: localLink || undefined,
      imageUrl: localImage || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="font-bold text-base">{row.name}</h3>
            <p className="text-xs text-muted-foreground">/categories/{row.slug}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Icon + Color row */}
          <div className="flex gap-4">
            {/* Icon preview + picker */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground flex items-center gap-1">Icon</label>
              <div className="relative">
                <button
                  onClick={() => setShowIconPicker(v => !v)}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all hover:scale-105 shadow-md"
                  style={{ background: `linear-gradient(135deg, ${localColor}cc, ${localColor})` }}
                >
                  {localImage ? (
                    <img src={localImage} alt="" className="w-full h-full object-cover rounded-2xl" />
                  ) : localIcon}
                </button>
                {showIconPicker && (
                  <IconPicker value={localIcon} onSelect={e => { setLocalIcon(e); setShowIconPicker(false); }} onClose={() => setShowIconPicker(false)} />
                )}
              </div>
            </div>

            {/* Color */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground flex items-center gap-1"><Palette className="h-3 w-3" /> Icon Background Color</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => setLocalColor(c)}
                    className={`w-6 h-6 rounded-lg transition-all ${localColor === c ? 'ring-2 ring-offset-1 ring-gray-800 scale-110' : 'hover:scale-105'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="color" value={localColor} onChange={e => setLocalColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border p-0.5 flex-shrink-0" />
                <input value={localColor} onChange={e => setLocalColor(e.target.value)}
                  className={inp + ' font-mono text-xs'} placeholder="#2563eb" />
              </div>
            </div>
          </div>

          {/* Custom image */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Custom Icon Image <span className="font-normal text-muted-foreground/60">(overrides emoji)</span></label>
            <div className="flex gap-2">
              <input value={localImage} onChange={e => setLocalImage(e.target.value)} className={inp + ' text-xs'} placeholder="https://... or upload" />
              <label className={`flex-shrink-0 flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold cursor-pointer hover:bg-accent ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                Upload
                <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
              </label>
              {localImage && (
                <button onClick={() => setLocalImage('')} className="flex-shrink-0 rounded-lg border px-2 hover:bg-accent">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Nav display label */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground flex items-center gap-1"><Type className="h-3 w-3" /> Nav Display Label <span className="font-normal text-muted-foreground/60">(leave blank to use category name)</span></label>
            <input value={localLabel} onChange={e => setLocalLabel(e.target.value)} className={inp} placeholder={row.name} />
          </div>

          {/* Custom link */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Custom Link URL <span className="font-normal text-muted-foreground/60">(leave blank for default)</span></label>
            <input value={localLink} onChange={e => setLocalLink(e.target.value)} className={inp} placeholder={`/products?categorySlug=${row.slug}`} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Check className="h-4 w-4" /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function MegaMenuPage() {
  const qc = useQueryClient();
  const [drawerFor, setDrawerFor] = useState<CategoryRow | null>(null);

  const { data: allCategories = [], isLoading } = useQuery<(Category & { children?: Category[] })[]>({
    queryKey: ['categories-all-admin'],
    queryFn: () => categoriesApi.getAll(true),
  });

  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [synced, setSynced] = useState(false);

  if (allCategories.length > 0 && !synced) {
    setSynced(true);
    setRows(
      [...allCategories]
        .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
        .map((c, i) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          isFeatured: c.isFeatured ?? false,
          sortOrder: c.sortOrder ?? i,
          icon: c.icon,
          imageUrl: c.imageUrl,
          color: c.color,
          childrenCount: c.children?.length ?? 0,
        }))
    );
  }

  const updateMut = useMutation({
    mutationFn: (row: CategoryRow) =>
      api.patch(`/categories/${row.id}`, {
        isFeatured: row.isFeatured,
        sortOrder: row.sortOrder,
        icon: row.icon,
        color: row.color,
        imageUrl: row.imageUrl,
        name: row.navLabel || undefined, // custom nav label saves to category name
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories-all-admin'] });
      qc.invalidateQueries({ queryKey: ['nav-categories'] });
    },
  });

  const handleSaveAll = async () => {
    try {
      await Promise.all(rows.map(r => updateMut.mutateAsync(r)));
      toast.success('Mega menu saved');
    } catch {
      toast.error('Failed to save some categories');
    }
  };

  const move = (idx: number, dir: 'up' | 'down') => {
    setRows(prev => {
      const next = [...prev];
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      const tmp = next[idx]!; next[idx] = next[swapIdx]!; next[swapIdx] = tmp;
      return next.map((r, i) => ({ ...r, sortOrder: i }));
    });
  };

  const toggleFeatured = (id: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, isFeatured: !r.isFeatured } : r));
  };

  const updateRow = (id: string, patch: Partial<CategoryRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const featured = rows.filter(r => r.isFeatured);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Mega Menu Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">Control which categories appear in navigation, their icons, colors, labels, and order</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={updateMut.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Menu
        </button>
      </div>

      {/* Live preview strip */}
      {featured.length > 0 && (
        <div className="rounded-xl border p-4 bg-gray-900">
          <p className="text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider">Live Nav Preview</p>
          <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
            {featured.map(r => (
              <div key={r.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md overflow-hidden"
                  style={{ background: r.color ? `linear-gradient(135deg, ${r.color}bb, ${r.color})` : 'rgba(255,255,255,0.15)' }}
                >
                  {r.imageUrl
                    ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                    : (r.icon ?? '📦')
                  }
                </div>
                <span className="text-[10px] text-white/70 font-medium truncate w-14 text-center">{r.navLabel || r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-green-600" /> Shown in nav</span>
        <span className="flex items-center gap-1.5"><EyeOff className="h-3.5 w-3.5 text-gray-400" /> Hidden</span>
        <span className="flex items-center gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> {featured.length} of {rows.length} visible · auto {featured.length > 8 ? '2-row' : '1-row'} nav</span>
        <span className="flex items-center gap-1.5 text-blue-600"><Palette className="h-3.5 w-3.5" /> Click icon to edit style</span>
        <span className="flex items-center gap-1.5 text-green-700">Sub-items = child categories (click to manage)</span>
      </div>

      {/* Category rows */}
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-muted/50 border-b px-4 py-2.5 grid grid-cols-[2rem_1fr_auto_auto_auto] gap-3 items-center text-xs font-semibold text-muted-foreground">
          <span>#</span>
          <span>Category</span>
          <span>Icon / Style</span>
          <span className="text-center">In Nav</span>
          <span className="w-16" />
        </div>

        {rows.map((row, idx) => (
          <div
            key={row.id}
            className={`px-4 py-3 grid grid-cols-[2rem_1fr_auto_auto_auto] gap-3 items-center border-b last:border-0 transition-colors ${row.isFeatured ? 'bg-green-50/50' : 'hover:bg-muted/20'}`}
          >
            {/* Order */}
            <span className="text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}</span>

            {/* Name + labels */}
            <div>
              <p className="font-semibold text-sm">{row.name}</p>
              <p className="text-xs text-muted-foreground">/categories/{row.slug}</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(row.childrenCount ?? 0) > 0 ? (
                  <a href={`/admin/categories?parentSlug=${row.slug}`} target="_blank" rel="noreferrer"
                    className="text-[10px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md hover:bg-green-100 transition-colors">
                    {row.childrenCount} sub-items ↗
                  </a>
                ) : (
                  <a href={`/admin/categories?parentSlug=${row.slug}`} target="_blank" rel="noreferrer"
                    className="text-[10px] font-bold bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-md hover:bg-gray-100 transition-colors">
                    + Add sub-items ↗
                  </a>
                )}
                {row.navLabel && (
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">
                    Label: {row.navLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Icon preview — click to open drawer */}
            <button
              onClick={() => setDrawerFor(row)}
              title="Edit icon, color, label & link"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-accent transition-colors group"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform"
                style={{ background: row.color ? `linear-gradient(135deg, ${row.color}bb, ${row.color})` : '#f3f4f6' }}
              >
                {row.imageUrl
                  ? <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
                  : (row.icon ?? '📦')
                }
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground">Edit</span>
                {row.color && (
                  <span className="text-[9px] font-mono text-muted-foreground/60">{row.color}</span>
                )}
              </div>
            </button>

            {/* In Nav toggle */}
            <div className="flex justify-center">
              <button
                onClick={() => toggleFeatured(row.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${row.isFeatured ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${row.isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Reorder */}
            <div className="flex gap-1 w-16 justify-end">
              <button onClick={() => move(idx, 'up')} disabled={idx === 0}
                className="p-1 rounded hover:bg-accent disabled:opacity-20 transition-colors">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button onClick={() => move(idx, 'down')} disabled={idx === rows.length - 1}
                className="p-1 rounded hover:bg-accent disabled:opacity-20 transition-colors">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <LayoutGrid className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No categories found. Add categories first.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={updateMut.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Mega Menu
        </button>
      </div>

      {/* Detail drawer */}
      {drawerFor && (
        <RowDrawer
          row={drawerFor}
          onUpdate={patch => updateRow(drawerFor.id, patch)}
          onClose={() => setDrawerFor(null)}
        />
      )}
    </div>
  );
}
