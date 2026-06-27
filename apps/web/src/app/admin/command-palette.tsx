'use client';

// ⌘K Command Palette — jump to any of the 250+ admin pages, run quick actions,
// or search products / orders / customers, all from one keyboard-driven overlay.
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, CornerDownLeft, ArrowUp, ArrowDown, Clock, Plus, Package,
  ShoppingBag, Users, Command as CommandIcon, X,
} from 'lucide-react';
import { NAV_LEAVES } from './nav-config';

type Cmd = {
  id: string;
  label: string;
  section: string;
  icon: React.ElementType;
  href: string;
  keywords?: string[];
  kind: 'page' | 'action' | 'search';
};

// High-value quick actions shown at the top when there's no query.
const QUICK_ACTIONS: Cmd[] = [
  { id: 'a-new-product', label: 'Add New Product', section: 'Quick Action', icon: Plus, href: '/admin/products/new', kind: 'action', keywords: ['create', 'add'] },
  { id: 'a-orders',      label: 'View All Orders', section: 'Quick Action', icon: ShoppingBag, href: '/admin/orders', kind: 'action', keywords: ['sales'] },
  { id: 'a-customers',   label: 'View Customers',  section: 'Quick Action', icon: Users, href: '/admin/customers', kind: 'action', keywords: ['users'] },
];

const PAGES: Cmd[] = NAV_LEAVES.map((l) => ({
  id: `p-${l.href}`,
  label: l.label,
  section: l.section,
  icon: l.icon,
  href: l.href,
  keywords: l.keywords,
  kind: 'page' as const,
}));

const RECENT_KEY = 'admin-cmdk-recent';

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}

// Lightweight subsequence + token match scoring (no dependency).
function score(query: string, cmd: Cmd): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const label = cmd.label.toLowerCase();
  const hay = `${label} ${cmd.section.toLowerCase()} ${(cmd.keywords ?? []).join(' ')}`;
  if (label === q) return 1000;
  if (label.startsWith(q)) return 800;
  if (label.includes(q)) return 600;
  // all query words present somewhere
  const words = q.split(/\s+/);
  if (words.every((w) => hay.includes(w))) return 400;
  // subsequence match on label (fuzzy)
  let i = 0;
  for (const ch of label) { if (ch === q[i]) i++; if (i === q.length) break; }
  if (i === q.length) return 200;
  return -1;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global open shortcut: ⌘K / Ctrl+K, plus a custom event so the header search
  // button (or anything else) can open the palette too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Build the result list based on query.
  const results = useMemo<Cmd[]>(() => {
    const q = query.trim();
    if (!q) {
      const recentCmds = recent
        .map((href) => PAGES.find((p) => p.href === href))
        .filter(Boolean)
        .slice(0, 5)
        .map((c) => ({ ...(c as Cmd), section: 'Recent', icon: Clock })) as Cmd[];
      return [...recentCmds, ...QUICK_ACTIONS, ...PAGES].slice(0, 60);
    }
    const scored = [...QUICK_ACTIONS, ...PAGES]
      .map((c) => ({ c, s: score(q, c) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.c);

    // Entity search shortcuts always appended.
    const entity: Cmd[] = [
      { id: 's-prod', label: `Search products: "${q}"`, section: 'Search', icon: Package, href: `/admin/products?q=${encodeURIComponent(q)}`, kind: 'search' },
      { id: 's-ord',  label: `Search orders: "${q}"`,   section: 'Search', icon: ShoppingBag, href: `/admin/orders?q=${encodeURIComponent(q)}`, kind: 'search' },
      { id: 's-cust', label: `Search customers: "${q}"`,section: 'Search', icon: Users, href: `/admin/customers?q=${encodeURIComponent(q)}`, kind: 'search' },
    ];
    return [...scored.slice(0, 40), ...entity];
  }, [query, recent]);

  useEffect(() => { setActive(0); }, [query]);

  const go = useCallback((cmd: Cmd) => {
    if (cmd.kind === 'page' || cmd.kind === 'action') {
      const next = [cmd.href, ...loadRecent().filter((h) => h !== cmd.href)].slice(0, 8);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
    setOpen(false);
    router.push(cmd.href);
  }, [router]);

  // Keyboard navigation within the palette.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) go(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  // Keep active row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white/75 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* gradient accent trace */}
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }} />

        {/* search input */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, actions, products, orders…"
            className="flex-1 py-4 text-[15px] outline-none placeholder:text-slate-400"
          />
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* results */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">No matches for “{query}”.</div>
          ) : (
            results.map((cmd, idx) => {
              const Icon = cmd.icon;
              const showSection = idx === 0 || results[idx - 1]?.section !== cmd.section;
              return (
                <div key={cmd.id}>
                  {showSection && (
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{cmd.section}</p>
                  )}
                  <button
                    data-idx={idx}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(cmd)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      active === idx ? 'bg-indigo-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                      active === idx ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm font-medium truncate ${active === idx ? 'text-indigo-900' : 'text-slate-700'}`}>{cmd.label}</span>
                    </span>
                    {active === idx && (
                      <CornerDownLeft className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* footer hint */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate</span>
            <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> open</span>
            <span className="flex items-center gap-1">esc close</span>
          </div>
          <span className="flex items-center gap-1 font-medium">
            <CommandIcon className="h-3 w-3" />K
          </span>
        </div>
      </div>
    </div>
  );
}
