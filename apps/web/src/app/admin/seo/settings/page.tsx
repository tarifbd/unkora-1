'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Loader2, Settings } from 'lucide-react';
import { seoApi, type SeoSettings } from '@/lib/api/seo-advanced';

export default function SeoSettingsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['seo-settings'],
    queryFn: () => seoApi.getSettings(),
  });

  const [form, setForm] = useState<Partial<SeoSettings>>({
    siteName: 'UNKORA',
    defaultTitle: '',
    titleTemplate: '%s | UNKORA',
    defaultMetaDescription: '',
    defaultOgImage: '',
    enableAutoSitemap: true,
    enableSchemaMarkup: true,
    enableOpenGraph: true,
    enableTwitterCards: true,
    enableCanonicalUrls: true,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => seoApi.updateSettings(form),
    onSuccess: () => { toast.success('SEO settings saved'); qc.invalidateQueries({ queryKey: ['seo-settings'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const f = (key: keyof SeoSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const toggle = (key: keyof SeoSettings) => () =>
    setForm(p => ({ ...p, [key]: !p[key] }));

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-600 flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">SEO Settings</h1>
            <p className="text-sm text-gray-500">Global SEO configuration for your store</p>
          </div>
        </div>
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>

      <div className="space-y-4">
        {/* Site Identity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Site Identity</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Name</label>
            <input type="text" value={form.siteName ?? ''} onChange={f('siteName')}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title Template</label>
            <input type="text" value={form.titleTemplate ?? ''} onChange={f('titleTemplate')} placeholder="%s | UNKORA"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
            <p className="text-xs text-gray-400 mt-1">Use <code>%s</code> as placeholder for the page title</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Title</label>
            <input type="text" value={form.defaultTitle ?? ''} onChange={f('defaultTitle')}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Meta Description</label>
            <textarea rows={3} value={form.defaultMetaDescription ?? ''} onChange={f('defaultMetaDescription') as any}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default OG Image URL</label>
            <input type="text" value={form.defaultOgImage ?? ''} onChange={f('defaultOgImage')} placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Features</h2>

          {([
            ['enableAutoSitemap',   'Auto-generate Sitemap',    'Automatically build XML sitemap from products and categories'],
            ['enableSchemaMarkup',  'Schema Markup',             'Add structured data (JSON-LD) to product pages'],
            ['enableOpenGraph',     'Open Graph Tags',           'Add OG tags for Facebook/WhatsApp sharing'],
            ['enableTwitterCards',  'Twitter Card Tags',         'Add Twitter card meta tags'],
            ['enableCanonicalUrls', 'Canonical URLs',            'Add canonical link tags to prevent duplicate content'],
          ] as [keyof SeoSettings, string, string][]).map(([key, label, desc]) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={toggle(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${form[key] ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
