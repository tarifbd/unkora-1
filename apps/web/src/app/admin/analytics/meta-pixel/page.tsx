'use client';
import { useState, useEffect } from 'react';
import { Target, CheckCircle2, AlertCircle, ExternalLink, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function MetaPixelPage() {
  const [pixelEnabled, setPixelEnabled] = useState(false);
  const [capiEnabled, setCapiEnabled] = useState(false);
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/analytics')
      .then(r => {
        const s = r.data.data as Record<string, string>;
        setPixelEnabled(s['analytics.pixel.enabled'] === 'true');
        setCapiEnabled(s['analytics.capi.enabled'] === 'true');
        setPixelId(s['analytics.pixel.pixelId'] ?? '');
        setAccessToken(s['analytics.capi.accessToken'] ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.post('/settings/analytics', {
        'analytics.pixel.enabled': pixelEnabled ? 'true' : 'false',
        'analytics.pixel.pixelId': pixelId,
        'analytics.capi.enabled': capiEnabled ? 'true' : 'false',
        'analytics.capi.pixelId': pixelId,
        ...(accessToken && { 'analytics.capi.accessToken': accessToken }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // show error
    }
  };

  const inputCls = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

  if (loading) return <div className="max-w-3xl py-12 text-center text-sm text-muted-foreground">Loading settings…</div>;

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="rounded-xl p-2.5" style={{ background: '#1877f215' }}>
          <Target className="h-6 w-6" style={{ color: '#1877f2' }} />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Meta Pixel & CAPI</h1>
          <p className="text-sm text-muted-foreground">Facebook & Instagram conversion tracking</p>
        </div>
      </div>

      {/* Browser Pixel */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Meta Pixel (Browser)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Tracks events via the visitor's browser</p>
          </div>
          <Toggle value={pixelEnabled} onChange={() => setPixelEnabled(!pixelEnabled)} />
        </div>

        {pixelEnabled && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Facebook Pixel ID</label>
            <input
              value={pixelId}
              onChange={e => setPixelId(e.target.value)}
              placeholder="e.g. 123456789012345"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-muted-foreground">Found in Events Manager → Your Pixel → Settings</p>
          </div>
        )}
      </div>

      {/* CAPI */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Conversions API (CAPI)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Server-side tracking — bypasses ad blockers, more reliable</p>
          </div>
          <Toggle value={capiEnabled} onChange={() => setCapiEnabled(!capiEnabled)} />
        </div>

        {capiEnabled && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Pixel ID (for CAPI)</label>
              <input
                value={pixelId}
                onChange={e => setPixelId(e.target.value)}
                placeholder="Same as browser pixel ID"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Access Token</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  placeholder="EAAJm..."
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Events Manager → Settings → Conversions API → Generate Access Token</p>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-1.5 text-xs text-amber-800">
              <p className="font-semibold flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Important Notes</p>
              <ul className="space-y-1 ml-5 list-disc">
                <li>Access tokens expire — regenerate them periodically in Events Manager</li>
                <li>CAPI works best alongside browser pixel for redundancy</li>
                <li>Your domain must be verified in Facebook Business Manager</li>
                <li>Save the token immediately after generating — it won't be shown again</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Setup Instructions</h2>
        <ol className="space-y-4 text-sm">
          {[
            { step: 1, title: 'Create/Get Pixel ID', body: <>Go to <a href="https://www.facebook.com/events_manager" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5">Facebook Events Manager <ExternalLink className="h-3 w-3" /></a>, select or create a pixel, and copy the Pixel ID from the top of the page.</> },
            { step: 2, title: 'Generate CAPI Token', body: 'In Events Manager, go to Settings → Conversions API → click "Generate Access Token". Copy it immediately — you won\'t see it again.' },
            { step: 3, title: 'Enable & Save', body: 'Toggle the sliders above, paste your IDs and token, then click Save Settings.' },
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
