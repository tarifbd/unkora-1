'use client';
import { useState } from 'react';
import { BarChart3, CheckCircle2, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GoogleAnalyticsPage() {
  const [enabled, setEnabled] = useState(false);
  const [measurementId, setMeasurementId] = useState('');
  const [enhancedEcom, setEnhancedEcom] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="rounded-xl p-2.5" style={{ background: '#f9731615' }}>
          <BarChart3 className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Google Analytics 4</h1>
          <p className="text-sm text-muted-foreground">Track traffic, conversions and user behavior</p>
        </div>
      </div>

      {/* Main config */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Enable Google Analytics 4</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Injects GA4 tracking script on all pages</p>
          </div>
          <Toggle value={enabled} onChange={() => setEnabled(!enabled)} />
        </div>

        {enabled && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Measurement ID</label>
            <input
              value={measurementId}
              onChange={e => setMeasurementId(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Found in Google Analytics → Admin → Data Streams → Your Stream → Measurement ID
            </p>
          </div>
        )}
      </div>

      {/* Advanced options */}
      {enabled && (
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Advanced Options</h2>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="text-sm font-medium">Enhanced E-commerce Events</p>
              <p className="text-xs text-muted-foreground mt-0.5">Track add_to_cart, purchase, view_item automatically</p>
            </div>
            <Toggle value={enhancedEcom} onChange={() => setEnhancedEcom(!enhancedEcom)} />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">Debug Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Send events to DebugView in GA4 — disable in production</p>
            </div>
            <Toggle value={debugMode} onChange={() => setDebugMode(!debugMode)} />
          </div>

          {debugMode && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              ⚠️ Debug mode is enabled. Disable this before going live — it affects data quality.
            </div>
          )}
        </div>
      )}

      {/* Setup Instructions */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Setup Instructions</h2>
        <ol className="space-y-4 text-sm">
          {[
            { step: 1, title: 'Create GA4 Property', body: <>Go to <a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5">analytics.google.com <ExternalLink className="h-3 w-3" /></a> → Admin → Create Property → choose GA4.</> },
            { step: 2, title: 'Get Measurement ID', body: 'Admin → Data Streams → Add stream (Web) → enter your site URL → copy the Measurement ID (starts with G-).' },
            { step: 3, title: 'Enable & Save', body: 'Paste the Measurement ID above, toggle Enhanced E-commerce on, then click Save.' },
          ].map(({ step, title, body }) => (
            <li key={step} className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">{step}</span>
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
