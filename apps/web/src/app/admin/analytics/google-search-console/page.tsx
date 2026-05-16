'use client';
import { useState, useEffect } from 'react';
import { Globe, CheckCircle2, ExternalLink, ArrowLeft, Copy } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function GoogleSearchConsolePage() {
  const [verificationTag, setVerificationTag] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('/sitemap.xml');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/analytics')
      .then(r => {
        const s = r.data.data as Record<string, string>;
        setVerificationTag(s['analytics.gsc.verificationTag'] ?? '');
        setSitemapUrl(s['analytics.gsc.sitemapUrl'] ?? '/sitemap.xml');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.post('/settings/analytics', {
        'analytics.gsc.verificationTag': verificationTag,
        'analytics.gsc.sitemapUrl': sitemapUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // show error
    }
  };

  const copyTag = () => {
    if (verificationTag) {
      navigator.clipboard.writeText(`<meta name="google-site-verification" content="${verificationTag}" />`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const inputCls = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

  if (loading) return <div className="max-w-3xl py-12 text-center text-sm text-muted-foreground">Loading settings…</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="rounded-xl p-2.5 bg-emerald-50">
          <Globe className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Google Search Console</h1>
          <p className="text-sm text-muted-foreground">SEO performance and search visibility</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <h2 className="font-semibold">Site Verification</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium">HTML Meta Tag Verification Content</label>
          <div className="flex gap-2">
            <input
              value={verificationTag}
              onChange={e => setVerificationTag(e.target.value)}
              placeholder="paste the content=&quot;...&quot; value here"
              className={inputCls}
            />
            <button
              onClick={copyTag}
              disabled={!verificationTag}
              title="Copy full meta tag"
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors disabled:opacity-40"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Only paste the value from the <code className="bg-muted px-1 rounded">content="..."</code> attribute, not the full tag.
          </p>
          {verificationTag && (
            <div className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-xs break-all">
              {`<meta name="google-site-verification" content="${verificationTag}" />`}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <h2 className="font-semibold">Sitemap</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Sitemap URL</label>
          <input value={sitemapUrl} onChange={e => setSitemapUrl(e.target.value)} className={inputCls} />
          <p className="mt-1 text-xs text-muted-foreground">Submit this URL in Search Console under Sitemaps. Your Next.js app auto-generates a sitemap at <code className="bg-muted px-1 rounded">/sitemap.xml</code>.</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Setup Instructions</h2>
        <ol className="space-y-4 text-sm">
          {[
            { step: 1, title: 'Add Property', body: <>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5">Search Console <ExternalLink className="h-3 w-3" /></a> → Add Property → URL prefix → enter your site URL.</> },
            { step: 2, title: 'Choose HTML Tag Verification', body: 'Select the HTML tag method. Copy only the content="..." value (not the full tag) and paste it in the field above.' },
            { step: 3, title: 'Save & Verify', body: 'Click Save Settings below. The meta tag will be injected into your site\'s <head>. Then click Verify in Search Console.' },
            { step: 4, title: 'Submit Sitemap', body: 'In Search Console → Sitemaps, enter your sitemap URL and click Submit. This helps Google discover all your product pages.' },
          ].map(({ step, title, body }) => (
            <li key={step} className="flex gap-3">
              <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{step}</span>
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
