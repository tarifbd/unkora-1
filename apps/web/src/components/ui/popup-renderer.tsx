'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import DOMPurify from 'dompurify';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';
const SEEN_KEY = 'unkora_seen_popups';

function sanitizeHtml(html: string): string {
  // Renders client-side, so DOMPurify (which needs the DOM) is safe here.
  return DOMPurify.sanitize(html);
}

function getSeenPopups(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]'); } catch { return []; }
}

function markSeen(id: string) {
  const seen = getSeenPopups();
  if (!seen.includes(id)) { seen.push(id); localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); }
}

export function PopupRenderer() {
  const pathname = usePathname();
  const [popup, setPopup] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchPopups = async () => {
      try {
        const res = await fetch(`${API}/popups/active?page=${encodeURIComponent(pathname)}`);
        const data = await res.json();
        const popups = data.data ?? data;
        if (!Array.isArray(popups) || !popups.length) return;
        const seen = getSeenPopups();
        const eligible = popups.filter((p: any) => !p.showOnce || !seen.includes(p.id));
        if (!eligible.length) return;
        const selected = eligible[0];
        const delay = selected.trigger === 'after_delay' ? (selected.delayMs ?? 3000) : selected.trigger === 'on_load' ? 500 : 2000;
        setTimeout(() => {
          setPopup(selected);
          setVisible(true);
          fetch(`${API}/popups/${selected.id}/view`, { method: 'POST' }).catch(() => {});
        }, delay);
      } catch { /* silently fail */ }
    };
    fetchPopups();
  }, [pathname]);

  const close = () => {
    setVisible(false);
    if (popup?.showOnce) markSeen(popup.id);
    setTimeout(() => setPopup(null), 300);
  };

  const handleClick = () => {
    if (popup?.id) fetch(`${API}/popups/${popup.id}/click`, { method: 'POST' }).catch(() => {});
    if (popup?.buttonUrl) window.open(popup.buttonUrl, '_blank');
    close();
  };

  if (!popup || !visible) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={close}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        {popup.imageUrl && (
          <div className="relative h-48 bg-gray-100">
            <Image src={popup.imageUrl} alt={popup.title} fill className="object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-black text-gray-900 dark:text-white">{popup.title}</h3>
            <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"><X className="h-5 w-5" /></button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(popup.content ?? '') }} />
          {popup.buttonText && (
            <button onClick={handleClick} className="flex items-center gap-2 w-full justify-center py-3 px-6 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors">
              {popup.buttonText}
              {popup.buttonUrl && <ExternalLink className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PopupRenderer;
