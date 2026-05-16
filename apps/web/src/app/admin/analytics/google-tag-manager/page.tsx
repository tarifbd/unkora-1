'use client';
import { useState } from 'react';
import { Tag, CheckCircle2, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GoogleTagManagerPage() {
  const [enabled, setEnabled] = useState(false);
  const [containerId, setContainerId] = useState('');
  const [dataLayerPageView, setDataLayerPageView] = useState(true);
  const [dataLayerEcom, setDataLayerEcom] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputCls = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button type="button" onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="rounded-xl p-2.5" style={{ background: '#3b82f615' }}>
          <Tag className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Google Tag Manager</h1>
          <p className="text-sm text-muted-foreground">Manage all tracking tags without touching code</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Enable Google Tag Manager</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Injects GTM container snippet on all pages</p>
          </div>
          <Toggle value={enabled} onChange={() => setEnabled(!enabled)} />
        </div>

        {enabled && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Container ID</label>
            <input value={containerId} onChange={e => setContainerId(e.target.value)} placeholder="GTM-XXXXXXX" className={inputCls} />
            <p className="mt-1 text-xs text-muted-foreground">Found in tagmanager.google.com → your workspace → Container ID in the top bar</p>
          </div>
        )}
      </div>

      {enabled && (
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold">DataLayer Events</h2>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="text-sm font-medium">Push Page View to DataLayer</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fires dataLayer.push on every route change</p>
            </div>
            <Toggle value={dataLayerPageView} onChange={() => setDataLayerPageView(!dataLayerPageView)} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">E-commerce DataLayer Events</p>
              <p className="text-xs text-muted-foreground mt-0.5">Push add_to_cart, purchase, view_item events</p>
            </div>
            <Toggle value={dataLayerEcom} onChange={() => setDataLayerEcom(!dataLayerEcom)} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Setup Instructions</h2>
        <ol className="space-y-4 text-sm">
          {[
            { step: 1, title: 'Create GTM Account', body: <>Go to <a href="https://tagmanager.google.com" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5">tagmanager.google.com <ExternalLink className="h-3 w-3" /></a> → Create Account → Create Container (Web).</> },
            { step: 2, title: 'Copy Container ID', body: 'After creating, the Container ID (GTM-XXXXXXX) is shown in the top bar and in Admin → Container Settings.' },
            { step: 3, title: 'Add Your Tags in GTM', body: 'Inside GTM, add tags for GA4, Meta Pixel, etc. using GTM\'s built-in templates. Publish the container.' },
            { step: 4, title: 'Enable & Save', body: 'Paste the Container ID above and save. GTM will load all your configured tags automatically.' },
          ].map(({ step, title, body }) => (
            <li key={step} className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">{step}</span>
              <div className="text-muted-foreground"><strong className="text-foreground">{title}</strong> — {body}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : 'Save Settings'}
        </button>
        <Link href="/admin/analytics" className="rounded-xl border px-6 py-2.5 text-sm hover:bg-accent transition-colors">Cancel</Link>
      </div>
    </div>
  );
}
