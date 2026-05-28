'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, Loader2, Package } from 'lucide-react';
import Image from 'next/image';
import { inventoryApi, type InventoryAlert } from '@/lib/api/inventory';

const ALERT_CFG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  LOW_STOCK:    { label: 'Low Stock',    bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '⚠️' },
  OUT_OF_STOCK: { label: 'Out of Stock', bg: 'bg-red-50',    text: 'text-red-700',    icon: '🚫' },
  OVERSTOCK:    { label: 'Overstock',    bg: 'bg-blue-50',   text: 'text-blue-700',   icon: '📦' },
  EXPIRY_SOON:  { label: 'Expiry Soon',  bg: 'bg-orange-50', text: 'text-orange-700', icon: '⏰' },
};

export default function AlertsPage() {
  const qc = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-alerts', page, showResolved],
    queryFn: () => inventoryApi.getAlerts(page, 20, showResolved),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.resolveAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory-alerts'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Inventory Alerts</h1>
          <p className="text-sm text-gray-500">Low stock and out-of-stock notifications</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowResolved(false); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${!showResolved ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Active
          </button>
          <button
            onClick={() => { setShowResolved(true); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${showResolved ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Resolved
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !data?.data?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="font-bold">{showResolved ? 'No resolved alerts' : 'No active alerts'}</p>
          <p className="text-sm mt-1">{showResolved ? '' : 'Great! Your inventory is healthy'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.data.map((alert: InventoryAlert) => {
            const cfg = ALERT_CFG[alert.type] ?? ALERT_CFG.LOW_STOCK!;
            const img = alert.product?.images?.[0]?.url;
            return (
              <div key={alert.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 ${alert.isResolved ? 'opacity-60' : ''}`}>
                <div className={`w-10 h-10 rounded-xl ${cfg?.bg ?? 'bg-yellow-50'} flex items-center justify-center flex-shrink-0 text-xl`}>
                  {cfg?.icon ?? '⚠️'}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {img
                    ? <Image src={img} alt={alert.product.name} width={36} height={36} className="w-9 h-9 rounded-lg object-cover bg-gray-50" />
                    : <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center"><Package className="w-4 h-4 text-gray-300" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-gray-900 text-sm truncate">{alert.product?.name}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${cfg?.bg ?? 'bg-yellow-50'} ${cfg?.text ?? 'text-yellow-700'}`}>{cfg?.label ?? alert.type}</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    SKU: {alert.product?.sku} ·
                    {alert.currentQty !== undefined && ` Current: ${alert.currentQty}`}
                    {alert.threshold !== undefined && ` · Threshold: ${alert.threshold}`}
                  </p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{new Date(alert.createdAt).toLocaleString('en-BD')}</p>
                </div>
                {!alert.isResolved && (
                  <button
                    onClick={() => resolveMutation.mutate(alert.id)}
                    disabled={resolveMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-xs font-bold transition-colors flex-shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                  </button>
                )}
                {alert.isResolved && alert.resolvedAt && (
                  <span className="text-xs text-gray-400 flex-shrink-0">Resolved {new Date(alert.resolvedAt).toLocaleDateString('en-BD')}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data?.meta && data.meta.total > 20 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{data.meta.total} total</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <button disabled={page * 20 >= data.meta.total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
