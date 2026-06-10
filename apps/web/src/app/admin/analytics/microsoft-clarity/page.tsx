'use client';
import { useState, useEffect } from 'react';
import { MousePointerClick, CheckCircle2, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function MicrosoftClarityPage() {
  const [enabled, setEnabled] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/analytics')
      .then(r => {
        const s = r.data.data as Record<string, string>;
        setEnabled(s['analytics.clarity.enabled'] === 'true');
        setProjectId(s['analytics.clarity.projectId'] ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.post('/settings/analytics', {
        'analytics.clarity.enabled': enabled ? 'true' : 'false',
        'analytics.clarity.projectId': projectId,
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
        <div className="rounded-xl p-2.5" style={{ background: '#0078d415' }}>
          <MousePointerClick className="h-6 w-6" style={{ color: '#0078d4' }} />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Microsoft Clarity</h1>
          <p className="text-sm text-muted-foreground">Session recordings, heatmaps and user behavior insights</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Enable Microsoft Clarity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Record user sessions and generate heatmaps automatically</p>
          </div>
          <Toggle value={enabled} onChange={() => setEnabled(!enabled)} />
        </div>

        {enabled && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Project ID</label>
            <input
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              placeholder="e.g. abcde12345"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-muted-foreground">Found in your Clarity project Settings page</p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Setup Instructions</h2>
        <ol className="space-y-4 text-sm">
          {[
            { step: 1, title: 'Create a project', body: <>Visit <a href="https://clarity.microsoft.com" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5">clarity.microsoft.com <ExternalLink className="h-3 w-3" /></a>, sign in with a Microsoft account, and create a new project for your website.</> },
            { step: 2, title: 'Copy the Project ID', body: 'In your project dashboard go to Settings. The Project ID is shown at the top — it\'s a short alphanumeric string.' },
            { step: 3, title: 'Enable & Save', body: 'Toggle the slider above, paste your Project ID, then click Save Settings. Clarity starts recording sessions immediately.' },
          ].map(({ step, title, body }) => (
            <li key={step} className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{step}</span>
              <div className="text-muted-foreground"><strong className="text-foreground">{title}</strong> — {body}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-300">
        <p className="font-semibold mb-1">Clarity is completely free</p>
        <p className="text-xs opacity-80">Microsoft Clarity has no usage limits or paid tiers. All session recordings, heatmaps, and insights are available at no cost.</p>
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
