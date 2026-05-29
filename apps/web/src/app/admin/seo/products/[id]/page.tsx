'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Loader2, AlertCircle, Zap, BarChart3,
  ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import { seoApi, type SeoMetadata, type SeoAudit } from '@/lib/api/seo-advanced';

const inputCls = 'w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

function CharCounter({ value, min, max }: { value: string; min: number; max: number }) {
  const len = value.length;
  const cls = len >= min && len <= max ? 'text-green-600' : len > 0 ? 'text-yellow-600' : 'text-gray-400';
  return <span className={`text-xs ${cls}`}>{len}/{max} (ideal: {min}–{max})</span>;
}

function ScoreCircle({ score }: { score: number | null }) {
  if (score == null) return (
    <div className="flex items-center justify-center h-20 w-20 rounded-full border-4 border-gray-200 dark:border-gray-600">
      <span className="text-sm font-bold text-gray-400">N/A</span>
    </div>
  );
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center justify-center h-20 w-20 rounded-full border-4" style={{ borderColor: color }}>
      <span className="text-xl font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

const INNER_TABS = ['Basic SEO', 'Open Graph', 'Twitter Card', 'Schema', 'Technical'] as const;
type InnerTab = typeof INNER_TABS[number];

export default function ProductSeoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [innerTab, setInnerTab] = useState<InnerTab>('Basic SEO');
  const [form, setForm] = useState<Partial<SeoMetadata>>({});
  const [audit, setAudit] = useState<SeoAudit | null>(null);
  const [showIssues, setShowIssues] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [aiKeyword, setAiKeyword] = useState('');
  const [showAiForm, setShowAiForm] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product-seo', id],
    queryFn: () => seoApi.getProductSeo(id),
    enabled: !!id,
    retry: 1,
  });

  useEffect(() => {
    if (data) {
      setForm({
        seoTitle: data.seoTitle ?? '',
        metaDescription: data.metaDescription ?? '',
        focusKeyword: data.focusKeyword ?? '',
        secondaryKeywordsJson: data.secondaryKeywordsJson ?? [],
        slug: data.slug ?? '',
        canonicalUrl: data.canonicalUrl ?? '',
        ogTitle: data.ogTitle ?? '',
        ogDescription: data.ogDescription ?? '',
        ogImage: data.ogImage ?? '',
        twitterTitle: data.twitterTitle ?? '',
        twitterDescription: data.twitterDescription ?? '',
        twitterImage: data.twitterImage ?? '',
        schemaType: data.schemaType ?? 'Product',
        schemaJson: data.schemaJson ?? {},
        robotsIndex: data.robotsIndex ?? true,
        robotsFollow: data.robotsFollow ?? true,
      });
      if (data.seoScore != null) {
        setAudit({
          id: '',
          entityType: 'PRODUCT',
          entityId: id,
          score: data.seoScore,
          status: data.seoScore >= 70 ? 'GOOD' : data.seoScore >= 40 ? 'NEEDS_IMPROVEMENT' : 'POOR',
          issuesJson: [],
          suggestionsJson: [],
          createdAt: data.lastAuditedAt ?? new Date().toISOString(),
        });
      }
    }
  }, [data, id]);

  const saveMutation = useMutation({
    mutationFn: () => seoApi.updateProductSeo(id, form),
    onSuccess: () => toast.success('SEO settings saved!'),
    onError: () => toast.error('Failed to save SEO settings'),
  });

  const auditMutation = useMutation({
    mutationFn: () => seoApi.auditProduct(id),
    onSuccess: (a) => { setAudit(a); toast.success('Audit complete!'); },
    onError: () => toast.error('Audit failed'),
  });

  const aiMutation = useMutation({
    mutationFn: () => seoApi.generateAiProductSeo(id),
    onSuccess: (d: Partial<SeoMetadata> & { seoTitle?: string; metaDescription?: string }) => {
      setForm(f => ({
        ...f,
        seoTitle: d.seoTitle ?? f.seoTitle,
        metaDescription: d.metaDescription ?? f.metaDescription,
        focusKeyword: (d.focusKeyword ?? aiKeyword) || f.focusKeyword,
      }));
      toast.success('AI SEO applied!');
      setShowAiForm(false);
    },
    onError: () => toast.error('AI generation failed'),
  });

  const f = form as Record<string, unknown>;
  const setField = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  if (isLoading) return (
    <div className="flex items-center justify-center py-40">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center py-40 gap-3">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="text-red-500">Failed to load product SEO data</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-serif text-xl font-bold">Product SEO Editor</h1>
          {data?.slug && <p className="text-sm text-muted-foreground font-mono">/{data.slug}</p>}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Inner Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-0.5 overflow-x-auto [scrollbar-width:none]">
              {INNER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setInnerTab(tab)}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap
                    ${innerTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
            {/* Basic SEO */}
            {innerTab === 'Basic SEO' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>SEO Title</label>
                    <CharCounter value={String(f.seoTitle ?? '')} min={30} max={60} />
                  </div>
                  <input className={inputCls} value={String(f.seoTitle ?? '')} onChange={e => setField('seoTitle', e.target.value)} placeholder="SEO optimized page title..." />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>Meta Description</label>
                    <CharCounter value={String(f.metaDescription ?? '')} min={120} max={160} />
                  </div>
                  <textarea className={inputCls} rows={3} value={String(f.metaDescription ?? '')} onChange={e => setField('metaDescription', e.target.value)} placeholder="Compelling meta description for search results..." />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Focus Keyword</label>
                    <input className={inputCls} value={String(f.focusKeyword ?? '')} onChange={e => setField('focusKeyword', e.target.value)} placeholder="e.g. wireless earbuds" />
                  </div>
                  <div>
                    <label className={labelCls}>Secondary Keywords (comma-separated)</label>
                    <input className={inputCls}
                      value={Array.isArray(f.secondaryKeywordsJson) ? (f.secondaryKeywordsJson as string[]).join(', ') : String(f.secondaryKeywordsJson ?? '')}
                      onChange={e => setField('secondaryKeywordsJson', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      placeholder="bluetooth, noise canceling, earphones"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Slug</label>
                    <input className={inputCls} value={String(f.slug ?? '')} onChange={e => setField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} placeholder="product-slug" />
                  </div>
                  <div>
                    <label className={labelCls}>Canonical URL</label>
                    <input className={inputCls} value={String(f.canonicalUrl ?? '')} onChange={e => setField('canonicalUrl', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              </>
            )}

            {/* Open Graph */}
            {innerTab === 'Open Graph' && (
              <>
                <div className="grid gap-4">
                  <div>
                    <label className={labelCls}>OG Title</label>
                    <input className={inputCls} value={String(f.ogTitle ?? '')} onChange={e => setField('ogTitle', e.target.value)} placeholder="OpenGraph title..." />
                  </div>
                  <div>
                    <label className={labelCls}>OG Description</label>
                    <textarea className={inputCls} rows={3} value={String(f.ogDescription ?? '')} onChange={e => setField('ogDescription', e.target.value)} placeholder="OpenGraph description..." />
                  </div>
                  <div>
                    <label className={labelCls}>OG Image URL</label>
                    <input className={inputCls} value={String(f.ogImage ?? '')} onChange={e => setField('ogImage', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                {/* Facebook Preview */}
                {(f.ogTitle || f.ogDescription) && (
                  <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <p className="text-xs font-semibold text-gray-500 px-3 py-2 bg-gray-50 dark:bg-gray-700/50">Facebook Preview</p>
                    {Boolean(f.ogImage) && (
                      <div className="aspect-[1.91/1] bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        <img src={String(f.ogImage)} alt="OG preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs text-gray-400 uppercase">your-store.com</p>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white mt-0.5">{String(f.ogTitle ?? f.seoTitle ?? 'Page Title')}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{String(f.ogDescription ?? f.metaDescription ?? '')}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Twitter Card */}
            {innerTab === 'Twitter Card' && (
              <>
                <div className="grid gap-4">
                  <div>
                    <label className={labelCls}>Twitter Title</label>
                    <input className={inputCls} value={String(f.twitterTitle ?? '')} onChange={e => setField('twitterTitle', e.target.value)} placeholder="Twitter card title..." />
                  </div>
                  <div>
                    <label className={labelCls}>Twitter Description</label>
                    <textarea className={inputCls} rows={3} value={String(f.twitterDescription ?? '')} onChange={e => setField('twitterDescription', e.target.value)} placeholder="Twitter card description..." />
                  </div>
                  <div>
                    <label className={labelCls}>Twitter Image URL</label>
                    <input className={inputCls} value={String(f.twitterImage ?? '')} onChange={e => setField('twitterImage', e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                {/* Twitter Preview */}
                {(f.twitterTitle || f.twitterDescription) && (
                  <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-sm">
                    {Boolean(f.twitterImage) && (
                      <div className="aspect-[2/1] bg-gray-100 overflow-hidden">
                        <img src={String(f.twitterImage)} alt="Twitter preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{String(f.twitterTitle ?? f.seoTitle ?? 'Page Title')}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{String(f.twitterDescription ?? f.metaDescription ?? '')}</p>
                      <p className="text-xs text-gray-400 mt-1">your-store.com</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Schema */}
            {innerTab === 'Schema' && (
              <>
                <div>
                  <label className={labelCls}>Schema Type</label>
                  <select className={inputCls} value={String(f.schemaType ?? 'Product')} onChange={e => setField('schemaType', e.target.value)}>
                    {['Product', 'FAQ', 'BreadcrumbList', 'Article', 'Organization'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Schema JSON</label>
                  <p className="text-xs text-gray-400 mb-1">Paste valid JSON-LD schema markup. Will be injected as &lt;script type=&quot;application/ld+json&quot;&gt;.</p>
                  <textarea
                    className={`${inputCls} font-mono text-xs`}
                    rows={12}
                    value={typeof f.schemaJson === 'string' ? f.schemaJson : JSON.stringify(f.schemaJson, null, 2)}
                    onChange={e => {
                      try { setField('schemaJson', JSON.parse(e.target.value)); }
                      catch { setField('schemaJson', e.target.value); }
                    }}
                    placeholder='{"@context": "https://schema.org", "@type": "Product", ...}'
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setField('schemaJson', {
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    name: data?.seoTitle ?? '',
                    description: data?.metaDescription ?? '',
                    offers: { '@type': 'Offer', priceCurrency: 'BDT', availability: 'https://schema.org/InStock' },
                  })}
                  className="text-sm text-purple-600 hover:underline"
                >
                  Generate Product Schema Template
                </button>
              </>
            )}

            {/* Technical */}
            {innerTab === 'Technical' && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Important:</strong> Changing robots settings affects how search engines crawl and index this page. Only noindex if you intentionally want to exclude it from search results.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(f.robotsIndex ?? true)}
                      onChange={e => setField('robotsIndex', e.target.checked)}
                      className="h-4 w-4 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Index this page</p>
                      <p className="text-xs text-gray-400">Allow search engines to index</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(f.robotsFollow ?? true)}
                      onChange={e => setField('robotsFollow', e.target.checked)}
                      className="h-4 w-4 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Follow links</p>
                      <p className="text-xs text-gray-400">Allow crawling outbound links</p>
                    </div>
                  </label>
                </div>
                <div>
                  <label className={labelCls}>Canonical URL</label>
                  <input className={inputCls} value={String(f.canonicalUrl ?? '')} onChange={e => setField('canonicalUrl', e.target.value)} placeholder="https://..." />
                  <p className="text-xs text-gray-400 mt-1">Leave blank to use the default URL. Set only for duplicate content pages.</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Save */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save SEO Settings
            </button>
            <button onClick={() => router.back()} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Back to List
            </button>
          </div>
        </div>

        {/* Right: SEO Score Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">SEO Score</h3>
            <div className="flex items-center gap-4 mb-4">
              <ScoreCircle score={audit?.score ?? null} />
              <div>
                {audit ? (
                  <>
                    <p className={`text-sm font-bold ${audit.status === 'GOOD' ? 'text-green-600' : audit.status === 'NEEDS_IMPROVEMENT' ? 'text-yellow-600' : 'text-red-500'}`}>
                      {audit.status?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(audit.createdAt).toLocaleDateString()}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Not audited yet</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => auditMutation.mutate()}
                disabled={auditMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {auditMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                Run Audit
              </button>
              <button
                onClick={() => setShowAiForm(s => !s)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 transition-colors"
              >
                <Zap className="h-4 w-4" /> Generate with AI
              </button>
            </div>

            {showAiForm && (
              <div className="mt-3 space-y-2">
                <input
                  className={`w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  value={aiKeyword}
                  onChange={e => setAiKeyword(e.target.value)}
                  placeholder="Target keyword (optional)"
                />
                <button
                  onClick={() => aiMutation.mutate()}
                  disabled={aiMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {aiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {aiMutation.isPending ? 'Generating...' : 'Generate Now'}
                </button>
              </div>
            )}
          </div>

          {/* Issues */}
          {audit && audit.issuesJson && audit.issuesJson.length > 0 && (
            <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowIssues(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-semibold text-red-600">Issues ({audit.issuesJson.length})</span>
                {showIssues ? <ChevronUp className="h-4 w-4 text-red-400" /> : <ChevronDown className="h-4 w-4 text-red-400" />}
              </button>
              {showIssues && (
                <div className="px-4 pb-3 space-y-2">
                  {audit.issuesJson.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-red-700 dark:text-red-300">{issue.issue}</p>
                        <p className="text-xs text-red-400 capitalize">{issue.severity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {audit && audit.suggestionsJson && audit.suggestionsJson.length > 0 && (
            <div className="rounded-2xl border border-yellow-200 dark:border-yellow-800 bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowSuggestions(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-semibold text-yellow-600">Suggestions ({audit.suggestionsJson.length})</span>
                {showSuggestions ? <ChevronUp className="h-4 w-4 text-yellow-400" /> : <ChevronDown className="h-4 w-4 text-yellow-400" />}
              </button>
              {showSuggestions && (
                <div className="px-4 pb-3 space-y-2">
                  {audit.suggestionsJson.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <span className="text-yellow-500 text-sm flex-shrink-0">→</span>
                      <div>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">{s.suggestion}</p>
                        <p className="text-xs text-yellow-400 capitalize">Priority: {s.priority}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
