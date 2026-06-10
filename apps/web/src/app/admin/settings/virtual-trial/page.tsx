'use client';

import { useState, useEffect } from 'react';
import { Shirt, CheckCircle2, Eye, EyeOff, ArrowLeft, Info, Layers } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface CategoryOption { id: string; name: string; }

export default function VirtualTrialSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [requireLogin, setRequireLogin] = useState(false);
  const [aiServiceUrl, setAiServiceUrl] = useState('');
  const [aiServiceKey, setAiServiceKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/virtual-tryon/admin/settings'),
      api.get('/categories/all?includeInactive=true'),
    ])
      .then(([settingsRes, catsRes]) => {
        const s = settingsRes.data.data as Record<string, string>;
        setEnabled(s['virtual-tryon.enabled'] === 'true');
        setRequireLogin(s['virtual-tryon.requireLogin'] === 'true');
        setAiServiceUrl(s['virtual-tryon.aiServiceUrl'] ?? '');
        setSelectedCats((s['virtual-tryon.categoryIds'] ?? '').split(',').filter(Boolean));
        setCategories((catsRes.data.data as CategoryOption[]) ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = (id: string) =>
    setSelectedCats(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));

  const handleSave = async () => {
    try {
      const body: Record<string, string> = {
        'virtual-tryon.enabled': enabled ? 'true' : 'false',
        'virtual-tryon.requireLogin': requireLogin ? 'true' : 'false',
        'virtual-tryon.aiServiceUrl': aiServiceUrl,
        'virtual-tryon.categoryIds': selectedCats.join(','),
      };
      if (aiServiceKey) body['virtual-tryon.aiServiceKey'] = aiServiceKey;
      await api.post('/virtual-tryon/admin/settings', body);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail — production would show a toast
    }
  };

  const inputCls =
    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

  if (loading)
    return (
      <div className="max-w-3xl py-12 text-center text-sm text-muted-foreground">
        Loading settings…
      </div>
    );

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <div
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/settings"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="rounded-xl bg-orange-100 p-2.5">
          <Shirt className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Virtual Trial Room</h1>
          <p className="text-sm text-muted-foreground">
            Let customers try on products using AI
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-0.5">Connect any compatible AI try-on service</p>
          <p>
            Works with any AI endpoint that accepts <code className="rounded bg-blue-100 px-1 text-xs">multipart/form-data</code> with{' '}
            <code className="rounded bg-blue-100 px-1 text-xs">user_image</code> and{' '}
            <code className="rounded bg-blue-100 px-1 text-xs">product_image</code> fields — including
            Replicate, HuggingFace Inference API, or a custom ML endpoint.
          </p>
        </div>
      </div>

      {/* Toggles */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <h2 className="font-semibold">General</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enable Virtual Trial Room</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shows the "Try On" button on product pages
            </p>
          </div>
          <Toggle value={enabled} onChange={() => setEnabled(!enabled)} />
        </div>

        <div className="flex items-center justify-between border-t pt-5">
          <div>
            <p className="text-sm font-medium">Require Login to Use</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Guest users will be asked to log in before trying on
            </p>
          </div>
          <Toggle value={requireLogin} onChange={() => setRequireLogin(!requireLogin)} />
        </div>
      </div>

      {/* Categories */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Allowed Categories</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Select which categories show the "Try On" button. Leave all unchecked to show it on every
          category.
        </p>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map(cat => {
              const checked = selectedCats.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    checked
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                      checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                    }`}
                  >
                    {checked && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
        {selectedCats.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span>{selectedCats.length} categor{selectedCats.length === 1 ? 'y' : 'ies'} selected</span>
            <button
              type="button"
              onClick={() => setSelectedCats([])}
              className="font-medium text-primary hover:underline"
            >
              Clear all (show everywhere)
            </button>
          </div>
        )}
      </div>

      {/* AI Service */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <h2 className="font-semibold">AI Service</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium">AI Service URL</label>
          <input
            value={aiServiceUrl}
            onChange={e => setAiServiceUrl(e.target.value)}
            placeholder="https://api.replicate.com/v1/predictions"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The endpoint that will receive the user and product images and return the try-on result
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={aiServiceKey}
              onChange={e => setAiServiceKey(e.target.value)}
              placeholder="Leave blank to keep existing key"
              className={inputCls + ' pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sent as a Bearer token in the Authorization header
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Saved!
            </>
          ) : (
            'Save Settings'
          )}
        </button>
        <Link
          href="/admin/settings"
          className="rounded-xl border px-6 py-2.5 text-sm hover:bg-accent transition-colors"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
