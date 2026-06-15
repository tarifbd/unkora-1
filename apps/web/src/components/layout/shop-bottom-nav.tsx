'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, LayoutGrid, Search, MessageCircle, User,
  Phone, Sparkles, X, Send,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

const VISITOR_KEY = 'unkora_visitor_id';
function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, id); }
  return id;
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const MessengerIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
  </svg>
);

const DEFAULT_WELCOME = 'হ্যালো! 👋 আমি Unkora AI। আপনাকে কীভাবে সাহায্য করতে পারি?';

const LEFT_TABS = [
  { href: '/',           icon: Home,       label: 'হোম',      exact: true as const },
  { href: '/categories', icon: LayoutGrid, label: 'ক্যাটাগরি' },
];
const RIGHT_TABS = [
  { href: '/account', icon: User, label: 'অ্যাকাউন্ট' },
];

export function ShopBottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [chatOpen, setChatOpen]   = useState(false);
  const [messages, setMessages]   = useState<ChatMsg[]>([]);
  const [input, setInput]         = useState('');
  const [sending, setSending]     = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: config } = useQuery<Record<string, string>>({
    queryKey: ['chatbot-config'],
    queryFn: () => api.get('/chatbot/config').then(r => (r.data?.data ?? {}) as Record<string, string>),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const whatsapp   = config?.['contact.whatsappNumber']?.trim();
  const messenger  = config?.['contact.messengerUsername']?.trim();
  const botEnabled = config?.['chatbot.enabled'] === 'true';
  const welcome    = config?.['chatbot.welcomeMessage']?.trim() || DEFAULT_WELCOME;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, chatOpen]);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      let id = sessionId;
      if (!id) {
        const session = await api
          .post('/chatbot/sessions', { visitorId: getVisitorId() })
          .then(r => r.data.data as { id: string });
        id = session.id;
        setSessionId(id);
      }
      const res = await api
        .post(`/chatbot/sessions/${id}/messages`, { message: text })
        .then(r => r.data.data as { message: { content: string } });
      setMessages(prev => [...prev, { role: 'assistant', content: res.message.content }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'দুঃখিত, কিছু একটা সমস্যা হয়েছে। Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  /* Build the speed-dial actions from whatever is configured */
  const dialActions: Array<{
    key: string;
    bg: string;
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
    external?: boolean;
  }> = [];

  if (whatsapp) {
    dialActions.push({
      key: 'whatsapp', bg: 'bg-[#25D366]', icon: <WhatsAppIcon />,
      href: `https://wa.me/${whatsapp}`, external: true,
    });
  }
  if (messenger) {
    dialActions.push({
      key: 'messenger', bg: 'bg-[#0084FF]', icon: <MessengerIcon />,
      href: `https://m.me/${messenger}`, external: true,
    });
  }
  if (botEnabled) {
    dialActions.push({
      key: 'ai', bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
      icon: <Sparkles className="h-6 w-6" />,
      onClick: () => { setMenuOpen(false); setChatOpen(true); },
    });
  }
  if (whatsapp) {
    dialActions.push({
      key: 'call', bg: 'bg-emerald-500', icon: <Phone className="h-6 w-6" />,
      href: `tel:+${whatsapp}`,
    });
  }
  if (dialActions.length === 0) {
    dialActions.push({
      key: 'support', bg: 'bg-primary', icon: <Phone className="h-6 w-6" />,
      href: '/support',
    });
  }

  return (
    <>
      {/* ── AI Chat popup (mobile) ── */}
      {chatOpen && botEnabled && (
        <div
          className="md:hidden fixed right-3 z-[60] flex w-[calc(100vw-1.5rem)] max-w-sm h-[480px] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
          style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm leading-tight">Unkora AI</p>
                <p className="text-[11px] text-orange-100">Products &amp; order help</p>
              </div>
            </div>
            <button type="button" onClick={() => setChatOpen(false)} className="rounded-full p-1 hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-gray-800">
              {welcome}
            </div>
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-orange-500 px-3 py-2 text-sm text-white whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                  {m.content}
                </div>
              ),
            )}
            {sending && (
              <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t p-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="আপনার প্রশ্ন লিখুন…"
              maxLength={2000}
              className="flex-1 rounded-full border bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Speed-dial: only the circular icons fan out above the Message tab ── */}
      {menuOpen && (
        <>
          {/* tap-anywhere backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="md:hidden fixed right-4 z-50 flex flex-col items-center gap-3"
            style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
          >
            {dialActions.map((a, i) => {
              const cls = cn(
                'flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg',
                'animate-in fade-in zoom-in slide-in-from-bottom-2 duration-200',
                a.bg,
              );
              const style = { animationDelay: `${i * 45}ms`, animationFillMode: 'backwards' as const };
              if (a.href) {
                return (
                  <a
                    key={a.key}
                    href={a.href}
                    target={a.external ? '_blank' : undefined}
                    rel={a.external ? 'noopener noreferrer' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cls}
                    style={style}
                  >
                    {a.icon}
                  </a>
                );
              }
              return (
                <button key={a.key} type="button" onClick={a.onClick} className={cls} style={style}>
                  {a.icon}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Bottom nav bar ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]" />

        <div className="relative flex items-end h-16">

          {/* Left: Home + Categories */}
          {LEFT_TABS.map(tab => {
            const active = isActive(tab.href, 'exact' in tab ? tab.exact : false);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-end pb-2 pt-1 gap-0.5 group"
              >
                <span className={cn(
                  'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                  active ? 'bg-primary/10 text-primary scale-110' : 'text-gray-400 group-hover:text-gray-600',
                )}>
                  <Icon className={cn('w-5 h-5', active && 'stroke-[2.2px]')} />
                </span>
                <span className={cn('text-[10px] font-medium transition-colors', active ? 'text-primary' : 'text-gray-400')}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Center FAB: Search */}
          <div className="flex-1 flex flex-col items-center">
            <Link
              href="/search"
              className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-secondary text-white transition-transform active:scale-95"
              aria-label="সার্চ"
            >
              <Search className="w-6 h-6" />
            </Link>
            <span className="text-[10px] text-gray-500 -mt-1 mb-1.5 font-medium">সার্চ</span>
          </div>

          {/* Right: Account */}
          {RIGHT_TABS.map(tab => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 flex flex-col items-center justify-end pb-2 pt-1 gap-0.5 group"
              >
                <span className={cn(
                  'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
                  active ? 'bg-primary/10 text-primary scale-110' : 'text-gray-400 group-hover:text-gray-600',
                )}>
                  <Icon className={cn('w-5 h-5', active && 'stroke-[2.2px]')} />
                </span>
                <span className={cn('text-[10px] font-medium transition-colors', active ? 'text-primary' : 'text-gray-400')}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Last: Message toggle (speed-dial trigger) */}
          <button
            type="button"
            onClick={() => { setMenuOpen(o => !o); setChatOpen(false); }}
            className="flex-1 flex flex-col items-center justify-end pb-2 pt-1 gap-0.5 group"
          >
            <span className={cn(
              'flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200',
              menuOpen ? 'bg-primary/10 text-primary scale-110' : 'text-gray-400 group-hover:text-gray-600',
            )}>
              {menuOpen
                ? <X className="w-5 h-5 stroke-[2.2px]" />
                : <MessageCircle className="w-5 h-5" />}
            </span>
            <span className={cn('text-[10px] font-medium transition-colors', menuOpen ? 'text-primary' : 'text-gray-400')}>
              মেসেজ
            </span>
          </button>

        </div>
      </nav>
    </>
  );
}
