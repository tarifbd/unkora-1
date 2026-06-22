'use client';

import { useState } from 'react';
import { Bot, Save, Loader2, Sparkles, FileText, Globe, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';

const AIO_TIPS = [
  'Use conversational, question-answer format in your content',
  'Include clear, concise definitions at the start of key sections',
  'Structure content with proper H2/H3 hierarchy that AI can parse',
  'Add structured data (JSON-LD) for products, FAQs, and how-tos',
  'Use bullet points and numbered lists for step-by-step content',
  'Provide direct answers to common questions near the top of pages',
  'Include data, statistics, and citations from authoritative sources',
  'Ensure content is factually accurate and regularly updated',
];

export default function AioPage() {
  const [form, setForm] = useState({
    enableAioOptimization: true,
    aiSummaryText: '',
    entityDescription: '',
    knowledgeGraphName: '',
    knowledgeGraphType: 'Organization',
    faqSchema: true,
    howToSchema: false,
    productSchema: true,
    breadcrumbSchema: true,
    citationsSources: '',
    contentFreshness: 'weekly',
    topicalAuthority: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast.success('AIO settings saved successfully');
  };

  const inputCls = 'w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';
  const labelCls = 'block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-black text-gray-900">AIO — AI Overview Optimization</h1>
          </div>
          <p className="text-sm text-gray-500">Optimize your content to appear in Google AI Overviews, ChatGPT, Perplexity and other AI-powered search summaries.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>

      {/* Enable toggle */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Enable AIO Optimization</h2>
            <p className="text-sm text-gray-500 mt-0.5">Automatically optimize all pages for AI overview inclusion</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.enableAioOptimization}
              onChange={e => setForm(f => ({ ...f, enableAioOptimization: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Knowledge Graph */}
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Globe className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-gray-900">Knowledge Graph</h2>
          </div>
          <div>
            <label className={labelCls}>Entity Name</label>
            <input value={form.knowledgeGraphName} onChange={e => setForm(f => ({ ...f, knowledgeGraphName: e.target.value }))}
              placeholder="UNKORA" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Entity Type</label>
            <select value={form.knowledgeGraphType} onChange={e => setForm(f => ({ ...f, knowledgeGraphType: e.target.value }))} className={inputCls}>
              <option value="Organization">Organization</option>
              <option value="LocalBusiness">Local Business</option>
              <option value="Store">Store / Shop</option>
              <option value="WebSite">Website</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Entity Description (for AI)</label>
            <textarea value={form.entityDescription} onChange={e => setForm(f => ({ ...f, entityDescription: e.target.value }))}
              rows={3} placeholder="UNKORA is Bangladesh's leading e-commerce platform for books, organic foods, leather products..."
              className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Topical Authority Statement</label>
            <input value={form.topicalAuthority} onChange={e => setForm(f => ({ ...f, topicalAuthority: e.target.value }))}
              placeholder="Expert in Bangladeshi books, organic products, and handicrafts" className={inputCls} />
          </div>
        </div>

        {/* Schema Markup */}
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-gray-900">Schema Markup</h2>
          </div>
          {[
            { key: 'faqSchema', label: 'FAQ Schema', desc: 'Structured FAQs that AI can cite' },
            { key: 'productSchema', label: 'Product Schema', desc: 'Rich product data for AI summaries' },
            { key: 'howToSchema', label: 'HowTo Schema', desc: 'Step-by-step guides and tutorials' },
            { key: 'breadcrumbSchema', label: 'Breadcrumb Schema', desc: 'Site structure for AI navigation' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={form[item.key as keyof typeof form] as boolean}
                  onChange={e => setForm(f => ({ ...f, [item.key]: e.target.checked }))} className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          ))}
          <div>
            <label className={labelCls}>Content Update Frequency</label>
            <select value={form.contentFreshness} onChange={e => setForm(f => ({ ...f, contentFreshness: e.target.value }))} className={inputCls}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Summary Text */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-gray-900">Homepage AI Summary</h2>
        </div>
        <label className={labelCls}>Summary text for AI to cite about your store</label>
        <textarea value={form.aiSummaryText} onChange={e => setForm(f => ({ ...f, aiSummaryText: e.target.value }))}
          rows={4} placeholder="UNKORA is Bangladesh's premier online bookstore and multi-category e-commerce platform. We offer 100,000+ books, organic foods, leather products, Islamic lifestyle products, and handicrafts with fast delivery across Bangladesh..."
          className={`${inputCls} resize-none`} />
        <p className="mt-2 text-xs text-gray-400">This text will be included in your homepage structured data to help AI models summarize your site accurately.</p>
      </div>

      {/* Best Practices */}
      <div className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-2xl border border-primary/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-gray-900">AIO Best Practices</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {AIO_TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
