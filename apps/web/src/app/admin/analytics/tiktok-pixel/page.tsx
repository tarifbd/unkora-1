'use client';
import { useState, useEffect } from 'react';
import { Video, CheckCircle2, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function TikTokPixelPage() {
  const [enabled, setEnabled] = useState(false);
  const [pixelId, setPixelId] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/analytics')
      .then(r => {
        const s = r.data.data as Record<string, string>;
        setEnabled(s['analytics.tiktok.enabled'] === 'true');
        setPixelId(s['analytics.tiktok.pixelId'] ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.post('/settings/analytics', {
        'analytics.tiktok.enabled': enabled ? 'true' : 'false',
        'analytics.tiktok.pixelId': pixelId,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  };

  const inputCls = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  if (loading) return <div className="max-w-3xl py-12 text-center text-sm text-muted-foreground">Loading settings…</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="rounded-xl p-2.5 bg-gray-100 dark:bg-gray-800">
          <Video className="h-6 w-6 text-gray-900 dark:text-white" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">TikTok Pixel</h1>
          <p className="text-sm text-muted-foreground">Track conversions from TikTok ads and measure campaign ROI</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Enable TikTok Pixel</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fire PageView events and track conversions on every page</p>
          </div>
          <Toggle value={enabled} onChange={() => setEnabled(!enabled)} />
        </div>

        {enabled && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Pixel ID</label>
            <input
              value={pixelId}
              onChange={e => setPixelId(e.target.value)}
              placeholder="e.g. C3ABCDEF12345678"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-muted-foreground">Found in TikTok Ads Manager → Assets → Events → Web Events</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Setup Instructions</h2>
        <ol className="space-y-4 text-sm">
          {[
            { step: 1, title: 'Open TikTok Ads Manager', body: <>Log in at <a href="https://ads.tiktok.com" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5">ads.tiktok.com <ExternalLink className="h-3 w-3" /></a> and navigate to Assets → Events → Web Events.</> },
            { step: 2, title: 'Create a pixel', body: 'Click "Create Pixel", choose "TikTok Pixel", select "Manually install pixel code", and complete the setup wizard.' },
            { step: 3, title: 'Copy the Pixel ID', body: 'After creating the pixel, copy the Pixel ID shown in the Events dashboard (a string like C3ABCDEF12345678).' },
            { step: 4, title: 'Enable & Save', body: 'Toggle the slider above, paste your Pixel ID, then click Save Settings. PageView events will fire on every page visit.' },
          ].map(({ step, title, body }) => (
            <li key={step} className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{step}</span>
              <div className="text-muted-foreground"><strong className="text-foreground">{title}</strong> — {body}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : 'Save Settings'}
        </button>
        <Link href="/admin/analytics" className="rounded-xl border px-6 py-2.5 text-sm hover:bg-accent transition-colors">
          Cancel
        </Link>
      </div>
    </div>
  );
}
