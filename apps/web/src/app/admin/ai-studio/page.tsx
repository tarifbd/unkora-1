'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check, AlertCircle, Loader2, Brain, Zap } from 'lucide-react';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('access_token') ?? '';
}

export default function AiStudioPage() {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const generate = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await fetch(`${BASE_URL}/ai-studio/generate-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ productName, category }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message ?? 'AI generation failed');
      setResult(data.data ?? data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyField = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Studio</h1>
          <p className="text-sm text-gray-500">Generate product content with AI</p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          Generate Product Content
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Name *
            </label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Wireless Bluetooth Earbuds"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category (optional)
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Electronics"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || !productName.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {loading ? 'Generating...' : 'Generate with AI'}
        </button>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
              {error.includes('API key') && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Add OPENAI_API_KEY or GEMINI_API_KEY to your .env file, or configure in Settings
                  → AI Configuration.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {[
            { key: 'description', label: 'Full Description', multiline: true },
            { key: 'shortDesc', label: 'Short Description', multiline: false },
            { key: 'metaTitle', label: 'SEO Meta Title', multiline: false },
            { key: 'metaDescription', label: 'SEO Meta Description', multiline: false },
          ].map(({ key, label, multiline }) => (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {label}
                </span>
                <button
                  onClick={() => copyField(key, result[key])}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {copied === key ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied === key ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {multiline ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {result[key]}
                </p>
              ) : (
                <p className="text-sm font-medium text-gray-900 dark:text-white">{result[key]}</p>
              )}
            </div>
          ))}

          {result.tags?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tags</span>
                <button
                  onClick={() => copyField('tags', result.tags.join(', '))}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {copied === 'tags' ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied === 'tags' ? 'Copied!' : 'Copy All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Config Notice */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Setup:</strong> Add{' '}
          <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">OPENAI_API_KEY</code> (OpenAI)
          or{' '}
          <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">GEMINI_API_KEY</code> (Google
          Gemini) to your{' '}
          <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env</code> file. Set{' '}
          <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">AI_PROVIDER=gemini</code> to
          use Gemini (free tier available).
        </p>
      </div>
    </div>
  );
}
