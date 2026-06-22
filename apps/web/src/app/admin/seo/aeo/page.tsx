'use client';
import { useState, useEffect } from 'react';
import { Target, CheckCircle, Loader2, Plus, Trash2, ChevronDown, ChevronUp, Mic, MessageSquare, Search, Star, Zap, Info } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface FaqItem { q: string; a: string }
interface SchemaToggles { productSchema: boolean; breadcrumbSchema: boolean; orgSchema: boolean; websiteSchema: boolean; faqSchema: boolean; reviewSchema: boolean }

const DEFAULT_SCHEMA: SchemaToggles = { productSchema: true, breadcrumbSchema: true, orgSchema: true, websiteSchema: true, faqSchema: false, reviewSchema: false };

const FEATURES = [
  { icon: MessageSquare, color: '#8b5cf6', bg: '#8b5cf615', title: 'Featured Snippets', desc: 'Structured answers that appear above organic results in Google Search, directly answering user queries.' },
  { icon: Mic, color: '#f59e0b', bg: '#f59e0b15', title: 'Voice Search', desc: 'Optimize for Alexa, Siri, and Google Assistant queries. Voice answers come from featured snippets.' },
  { icon: Search, color: '#06b6d4', bg: '#06b6d415', title: 'AI Answer Boxes', desc: 'Google SGE and Bing Copilot pull structured content into AI-generated answer summaries.' },
  { icon: Star, color: '#10b981', bg: '#10b98115', title: 'Knowledge Graph', desc: 'Build entity authority so search engines recognize your store as a trusted, authoritative source.' },
  { icon: Zap, color: '#ef4444', bg: '#ef444415', title: 'FAQ Schema', desc: 'JSON-LD FAQ markup expands your SERP listing with accordion questions, increasing click-through rates.' },
  { icon: Target, color: '#f97316', bg: '#f9731615', title: 'Position Zero', desc: 'Capture the #0 SERP position — above all paid and organic results — with well-structured concise answers.' },
];

const CHECKLIST = [
  { id: 'meta', label: 'All products have meta title & description', link: '/admin/seo/products' },
  { id: 'faq', label: 'FAQ schema enabled and FAQs added below', link: null },
  { id: 'org', label: 'Organization schema enabled', link: null },
  { id: 'concise', label: 'Product descriptions start with a 2–3 sentence summary', link: '/admin/products' },
  { id: 'questions', label: 'Product descriptions answer common customer questions', link: null },
  { id: 'structured', label: 'Use numbered lists and bullet points in descriptions', link: null },
  { id: 'sitemap', label: 'XML sitemap is submitted to Google Search Console', link: '/admin/seo/sitemap' },
];

export default function AeoPage() {
  const [schema, setSchema] = useState<SchemaToggles>(DEFAULT_SCHEMA);
  const [faqs, setFaqs] = useState<FaqItem[]>([{ q: '', a: '' }]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    api.get('/settings/store').then(r => {
      const d = r.data?.data ?? {};
      if (d.aeoSchemaToggles) {
        try { setSchema({ ...DEFAULT_SCHEMA, ...JSON.parse(d.aeoSchemaToggles) }); } catch { /* ignore */ }
      }
      if (d.aeoFaqItems) {
        try {
          const parsed = JSON.parse(d.aeoFaqItems);
          if (Array.isArray(parsed) && parsed.length > 0) setFaqs(parsed);
        } catch { /* ignore */ }
      }
      if (d.aeoChecklist) {
        try { setChecked(JSON.parse(d.aeoChecklist)); } catch { /* ignore */ }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/settings/store', {
        aeoSchemaToggles: JSON.stringify(schema),
        aeoFaqItems: JSON.stringify(faqs.filter(f => f.q.trim() && f.a.trim())),
        aeoChecklist: JSON.stringify(checked),
      });
      toast.success('AEO settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const addFaq = () => { setFaqs(f => [...f, { q: '', a: '' }]); setExpandedFaq(faqs.length); };
  const removeFaq = (i: number) => setFaqs(f => f.filter((_, idx) => idx !== i));
  const updateFaq = (i: number, field: 'q' | 'a', value: string) =>
    setFaqs(f => f.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const schemaItems: { key: keyof SchemaToggles; label: string; desc: string }[] = [
    { key: 'productSchema',    label: 'Product Schema',        desc: 'Rich snippets for price, availability and ratings' },
    { key: 'breadcrumbSchema', label: 'Breadcrumb Schema',     desc: 'Shows page path in search results' },
    { key: 'orgSchema',        label: 'Organization Schema',   desc: 'Brand name, logo and contact in knowledge panel' },
    { key: 'websiteSchema',    label: 'WebSite Schema',        desc: 'Enables sitelinks search box in Google' },
    { key: 'faqSchema',        label: 'FAQ Schema',            desc: 'Expand listing with accordion Q&As in SERP' },
    { key: 'reviewSchema',     label: 'Review Schema',         desc: 'Show star ratings in search snippets' },
  ];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          {/* Grid pattern */}
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="aeo-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#aeo-grid)" />
          </svg>
        </div>
        <div className="relative px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">New</span>
              <span className="text-white/70 text-xs font-semibold">Part of Visibility Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Answer Engine Optimization</h1>
            <p className="text-white/80 text-sm sm:text-base max-w-xl">
              AEO goes beyond traditional SEO — it optimizes your content to appear in <strong className="text-white">AI answer boxes, featured snippets, and voice search</strong> results across Google SGE, Bing Copilot, and smart assistants.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {['Google SGE', 'Bing Copilot', 'Voice Search', 'Featured Snippets', 'Position Zero'].map(tag => (
                <span key={tag} className="bg-white/15 text-white/90 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/20">{tag}</span>
              ))}
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Target className="h-12 w-12 text-white" />
            </div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">AEO</p>
          </div>
        </div>
      </div>

      {/* What AEO Covers */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">What AEO Covers</h2>
        <p className="text-sm text-gray-500 mb-4">Six key areas to capture answer-engine visibility for UNKORA.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0" style={{ background: f.bg }}>
                <f.icon className="h-6 w-6" style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* JSON-LD Schema Toggles */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Structured Data (JSON-LD)</h2>
        <p className="text-sm text-gray-500 mb-4">Enable schema.org markup types to be injected automatically into your store pages.</p>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {schemaItems.map(item => (
            <div key={item.key} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => setSchema(s => ({ ...s, [item.key]: !s[item.key] }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${schema[item.key] ? 'bg-violet-500' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${schema[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Schema Manager */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-0.5">FAQ Schema Manager</h2>
            <p className="text-sm text-gray-500">These Q&As will appear as accordion entries below your store&apos;s SERP listing.</p>
          </div>
          <button onClick={addFaq}
            className="flex items-center gap-2 bg-violet-600 text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-violet-700 transition-colors">
            <Plus className="h-4 w-4" /> Add FAQ
          </button>
        </div>

        {!schema.faqSchema && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-4">
            <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700">Enable <strong>FAQ Schema</strong> above for these FAQs to be injected into your pages as JSON-LD structured data.</p>
          </div>
        )}

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <p className="text-sm font-medium text-gray-900 truncate">{faq.q || <span className="text-gray-400 font-normal">Question #{i + 1}</span>}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button onClick={e => { e.stopPropagation(); removeFaq(i); }}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {expandedFaq === i ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </button>
              {expandedFaq === i && (
                <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">Question</label>
                    <input value={faq.q} onChange={e => updateFaq(i, 'q', e.target.value)}
                      placeholder="e.g. How long does delivery take in Dhaka?"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">Answer <span className="text-gray-400 font-normal">(concise — 40–60 words ideal)</span></label>
                    <textarea value={faq.a} onChange={e => updateFaq(i, 'a', e.target.value)}
                      rows={3} placeholder="e.g. We deliver within Dhaka in 1–2 business days via Pathao and Paperfly courier services..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 resize-none" />
                    <p className="text-xs text-gray-400 mt-1">{faq.a.split(/\s+/).filter(Boolean).length} words</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {faqs.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <MessageSquare className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No FAQs added yet. Click &quot;Add FAQ&quot; to start.</p>
            </div>
          )}
        </div>
      </div>

      {/* AEO Optimization Checklist */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">AEO Checklist</h2>
        <p className="text-sm text-gray-500 mb-4">Track your answer engine optimization progress.</p>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {CHECKLIST.map(item => (
            <label key={item.id} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors">
              <input type="checkbox" checked={checked[item.id] ?? false}
                onChange={e => setChecked(c => ({ ...c, [item.id]: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
              <div className="flex-1">
                <p className={`text-sm font-medium ${checked[item.id] ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.label}</p>
              </div>
              {item.link && (
                <a href={item.link} className="text-xs text-violet-600 hover:underline font-semibold flex-shrink-0" onClick={e => e.stopPropagation()}>
                  Fix →
                </a>
              )}
            </label>
          ))}
        </div>
        <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-violet-500 flex-shrink-0" />
          <p className="text-sm text-violet-700">
            <strong>{Object.values(checked).filter(Boolean).length} / {CHECKLIST.length}</strong> items completed
          </p>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 bg-violet-600 text-white font-semibold py-2.5 px-8 rounded-xl hover:bg-violet-700 disabled:opacity-60 transition-colors">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
        Save AEO Settings
      </button>
    </div>
  );
}
