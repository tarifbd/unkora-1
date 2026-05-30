'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { wholesaleApi } from '@/lib/api/admin';

interface WholesaleTier {
  minQty: number;
  price: number;
}

interface ProductInfo {
  name?: string;
  id?: string;
}

const inputCls = 'rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function WholesalePricingPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [tiers, setTiers] = useState<WholesaleTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await wholesaleApi.get(productId);
      const tierList: WholesaleTier[] = Array.isArray(data?.tiers)
        ? data.tiers
        : Array.isArray(data)
          ? (data as WholesaleTier[])
          : [];
      setTiers(tierList);
      if (data?.product) {
        setProduct(data.product as ProductInfo);
      } else if (data?.productName) {
        setProduct({ name: data.productName as string });
      }
    } catch {
      setError('Failed to load wholesale tiers');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { void load(); }, [load]);

  const addTier = () => {
    setTiers(prev => [...prev, { minQty: 0, price: 0 }]);
    setSaveSuccess(false);
  };

  const removeTier = (index: number) => {
    setTiers(prev => prev.filter((_, i) => i !== index));
    setSaveSuccess(false);
  };

  const updateTier = (index: number, field: keyof WholesaleTier, value: string) => {
    const num = parseFloat(value) || 0;
    setTiers(prev => prev.map((t, i) => i === index ? { ...t, [field]: num } : t));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    // Validate
    for (let i = 0; i < tiers.length; i++) {
      if ((tiers[i]?.minQty ?? 0) <= 0) { setSaveError(`Tier ${i + 1}: Min Qty must be greater than 0`); return; }
      if ((tiers[i]?.price ?? 0) <= 0)  { setSaveError(`Tier ${i + 1}: Price must be greater than 0`); return; }
    }

    // Check for duplicate minQty
    const qtys = tiers.map(t => t.minQty);
    if (new Set(qtys).size !== qtys.length) {
      setSaveError('Each tier must have a unique Minimum Quantity');
      return;
    }

    setSaving(true);
    try {
      await wholesaleApi.set(productId, tiers);
      setSaveSuccess(true);
    } catch {
      setSaveError('Failed to save tiers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);

  if (!productId) {
    router.push('/admin/products');
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/products/${productId}/edit`}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold">Wholesale Pricing</h1>
          {product?.name && (
            <p className="text-sm text-muted-foreground">{product.name}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Price Tiers</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set bulk pricing based on minimum quantity ordered
              </p>
            </div>
            <button
              onClick={addTier}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Tier
            </button>
          </div>

          {tiers.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <p className="text-sm text-muted-foreground">No wholesale tiers configured</p>
              <p className="text-xs text-muted-foreground mt-1">Click &quot;Add Tier&quot; to create your first pricing tier</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Min Qty</p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price (৳)</p>
                <span className="w-8" />
              </div>

              {/* Tier rows */}
              {tiers.map((tier, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center rounded-lg border bg-muted/20 p-3">
                  <div>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={tier.minQty || ''}
                      onChange={e => updateTier(i, 'minQty', e.target.value)}
                      placeholder="e.g. 10"
                      className={`${inputCls} w-full`}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={tier.price || ''}
                      onChange={e => updateTier(i, 'price', e.target.value)}
                      placeholder="e.g. 450.00"
                      className={`${inputCls} w-full`}
                    />
                  </div>
                  <button
                    onClick={() => removeTier(i)}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove tier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Preview sorted */}
              {tiers.length > 1 && (
                <div className="mt-4 rounded-lg bg-muted/30 border p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Preview (sorted)
                  </p>
                  {sortedTiers.map((t, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {i < sortedTiers.length - 1
                          ? `${t.minQty} – ${(sortedTiers[i + 1]?.minQty ?? t.minQty + 1) - 1} units`
                          : `${t.minQty}+ units`}
                      </span>
                      <span className="font-semibold">৳{t.price.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
          {saveSuccess && (
            <p className="text-xs text-green-600 font-medium">Wholesale tiers saved successfully!</p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Link
              href={`/admin/products/${productId}/edit`}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save All Tiers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
