'use client';

import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, AlertTriangle, Plus, Minus, History, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { inventoryApi, type InventoryProduct } from '@/lib/api/inventory';

const MOVEMENT_TYPES = [
  { value: 'PURCHASE', label: 'Purchase (Stock In)' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'RETURN', label: 'Customer Return' },
];

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        Out of Stock
      </span>
    );
  if (stock <= 5)
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Low: {stock}
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      {stock} in stock
    </span>
  );
}

function AdjustForm({ product, onClose }: { product: InventoryProduct; onClose: () => void }) {
  const qc = useQueryClient();
  const [type, setType] = useState('PURCHASE');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      inventoryApi.adjust({
        productId: product.id,
        type: type === 'ADJUSTMENT_OUT' ? 'ADJUSTMENT' : type,
        quantity:
          type === 'PURCHASE' || type === 'RETURN'
            ? Math.abs(Number(qty))
            : -Math.abs(Number(qty)),
        note,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-inventory'] });
      void qc.invalidateQueries({ queryKey: ['admin-low-stock'] });
      onClose();
    },
    onError: () => setError('Failed to adjust stock. Check the quantity.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty || Number(qty) <= 0) {
      setError('Enter a valid quantity.');
      return;
    }
    setError('');
    mutation.mutate();
  };

  const inputCls =
    'w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <form onSubmit={handleSubmit} className="mt-2 rounded-lg border bg-muted/20 p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
            {MOVEMENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
            <option value="ADJUSTMENT_OUT">Adjustment (Stock Out)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Quantity</label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={e => setQty(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Received from supplier"
          className={inputCls}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Save
        </button>
      </div>
    </form>
  );
}

interface StockMovementRow {
  id: string;
  type: string;
  quantity: number;
  note?: string;
  createdAt: string;
}

function HistoryPanel({ productId }: { productId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-history', productId],
    queryFn: () => inventoryApi.getHistory(productId),
  });

  const typeColors: Record<string, string> = {
    PURCHASE: 'text-green-600',
    RETURN: 'text-blue-600',
    SALE: 'text-destructive',
    ADJUSTMENT: 'text-amber-600',
  };

  if (isLoading)
    return (
      <div className="py-2 text-center text-xs text-muted-foreground">Loading...</div>
    );

  const movements: StockMovementRow[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  if (!movements.length)
    return (
      <div className="py-2 text-center text-xs text-muted-foreground">No movement history</div>
    );

  return (
    <div className="mt-2 rounded-lg border divide-y text-xs max-h-40 overflow-y-auto">
      {movements.map(m => (
        <div key={m.id} className="flex items-center justify-between px-3 py-1.5">
          <span className={`font-medium ${typeColors[m.type] ?? ''}`}>{m.type}</span>
          <span className={m.quantity > 0 ? 'text-green-600' : 'text-destructive'}>
            {m.quantity > 0 ? '+' : ''}
            {m.quantity}
          </span>
          <span className="text-muted-foreground truncate max-w-[120px]">{m.note ?? '—'}</span>
          <span className="text-muted-foreground">
            {new Date(m.createdAt).toLocaleDateString('en-GB')}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminInventoryPage() {
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: () => inventoryApi.getOverview(1, 100),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['admin-low-stock'],
    queryFn: () => inventoryApi.getLowStock(),
  });

  const products: InventoryProduct[] = Array.isArray(overview?.data)
    ? overview.data
    : Array.isArray(overview)
      ? overview
      : [];
  const lowStockCount = Array.isArray(lowStockData) ? lowStockData.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Inventory</h1>
          {lowStockCount > 0 && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              {lowStockCount} product{lowStockCount > 1 ? 's' : ''} running low
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-semibold">No products found</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Category
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  SKU
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stock</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(product => (
                <Fragment key={product.id}>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {product.category.name}
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                      {product.sku ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge stock={product.stockQuantity} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setAdjustingId(adjustingId === product.id ? null : product.id);
                            setHistoryId(null);
                          }}
                          title="Adjust stock"
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent transition-colors"
                        >
                          {adjustingId === product.id ? (
                            <Minus className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Adjust
                        </button>
                        <button
                          onClick={() => {
                            setHistoryId(historyId === product.id ? null : product.id);
                            setAdjustingId(null);
                          }}
                          title="View history"
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent transition-colors"
                        >
                          <History className="h-3 w-3" />
                          {historyId === product.id ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {adjustingId === product.id && (
                    <tr>
                      <td colSpan={5} className="px-4 pb-3">
                        <AdjustForm product={product} onClose={() => setAdjustingId(null)} />
                      </td>
                    </tr>
                  )}
                  {historyId === product.id && (
                    <tr>
                      <td colSpan={5} className="px-4 pb-3">
                        <HistoryPanel productId={product.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
