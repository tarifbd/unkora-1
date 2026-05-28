'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, Loader2, RefreshCw, Bot } from 'lucide-react';
import { seoApi } from '@/lib/api/seo-advanced';

const DEFAULT_ROBOTS = `User-agent: *
Allow: /

User-agent: *
Disallow: /admin/
Disallow: /api/

Sitemap: /sitemap.xml
`;

export default function SeoRobotsPage() {
  const qc = useQueryClient();
  const [content, setContent] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['seo-robots'],
    queryFn: () => seoApi.getRobots(),
  });

  useEffect(() => {
    if (data?.robotsTxt) setContent(data.robotsTxt);
    else if (!isLoading) setContent(DEFAULT_ROBOTS);
  }, [data, isLoading]);

  const saveMut = useMutation({
    mutationFn: () => seoApi.updateRobots(content),
    onSuccess: () => { toast.success('robots.txt saved'); qc.invalidateQueries({ queryKey: ['seo-robots'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const lines = content.split('\n').length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gray-700 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">robots.txt</h1>
            <p className="text-sm text-gray-500">Control which pages search engines can crawl</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setContent(DEFAULT_ROBOTS)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" /> Reset to default
          </button>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">robots.txt editor</span>
              <span className="text-xs text-gray-400">{lines} lines</span>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
            ) : (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={24}
                spellCheck={false}
                className="w-full p-4 font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none resize-none"
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-4">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Quick Reference</h3>
            <div className="space-y-2 text-xs text-blue-700 dark:text-blue-400">
              <div>
                <code className="font-bold">User-agent: *</code>
                <p>Apply rules to all bots</p>
              </div>
              <div>
                <code className="font-bold">Disallow: /path/</code>
                <p>Block access to path</p>
              </div>
              <div>
                <code className="font-bold">Allow: /path/</code>
                <p>Explicitly allow access</p>
              </div>
              <div>
                <code className="font-bold">Sitemap: URL</code>
                <p>Point to your sitemap</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-4">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Common Bots</h3>
            <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
              <li><code>Googlebot</code> — Google Search</li>
              <li><code>Bingbot</code> — Bing Search</li>
              <li><code>facebookexternalhit</code> — Facebook</li>
              <li><code>Twitterbot</code> — Twitter</li>
            </ul>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-4">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Never Disallow</h3>
            <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
              <li>/ (homepage)</li>
              <li>/products/ (product pages)</li>
              <li>/category/ (category pages)</li>
              <li>CSS and JS files</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
