'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Search, Package, MapPin, Tag, Loader2, ExternalLink } from 'lucide-react';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export default function ShiprocketPage() {
  const { token } = useAdminAuth();
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders'|'rates'|'track'>('orders');
  const [rateParams, setRateParams] = useState({ pickup: '400001', delivery: '110001', weight: '1', cod: '0' });
  const [rateResult, setRateResult] = useState<any>(null);

  const apiFetch = (path: string) => fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['shiprocket-orders'],
    queryFn: () => apiFetch('/shiprocket/orders'),
    enabled: !!token && activeTab === 'orders',
    select: r => r.data ?? r,
  });

  const track = async () => {
    if (!trackId.trim()) return;
    setTrackLoading(true);
    try {
      const res = await apiFetch(`/shiprocket/track/${trackId.trim()}`);
      setTrackResult(res.data ?? res);
    } finally { setTrackLoading(false); }
  };

  const getRates = async () => {
    const res = await fetch(`${API}/shiprocket/rates?pickup_postcode=${rateParams.pickup}&delivery_postcode=${rateParams.delivery}&weight=${rateParams.weight}&cod=${rateParams.cod}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setRateResult(data.data ?? data);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center"><Truck className="h-5 w-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shiprocket</h1><p className="text-sm text-gray-500">Courier management &amp; shipment tracking</p></div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['orders','track','rates'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${activeTab === tab ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'}`}>{tab}</button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h2 className="font-semibold text-gray-900 dark:text-white">Shiprocket Orders</h2></div>
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50"><tr>{['Order ID','Date','Status','AWB','Courier'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(ordersData?.data ?? []).map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-mono text-xs">{order.channel_order_id ?? order.id}</td>
                      <td className="px-4 py-3 text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-bold">{order.status ?? '-'}</span></td>
                      <td className="px-4 py-3 font-mono text-xs">{order.awb_code ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{order.courier_name ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(ordersData?.data?.length) && <p className="text-center py-10 text-gray-400">No Shiprocket orders. Configure SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in .env to connect.</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'track' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Track Shipment</h2>
          <div className="flex gap-3 mb-6">
            <input value={trackId} onChange={e => setTrackId(e.target.value)} placeholder="Enter Shipment ID or AWB..." className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" onKeyDown={e => e.key === 'Enter' && track()} />
            <button onClick={track} disabled={trackLoading} className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
              {trackLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Track
            </button>
          </div>
          {trackResult && <pre className="text-xs bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 overflow-auto max-h-96">{JSON.stringify(trackResult, null, 2)}</pre>}
        </div>
      )}

      {activeTab === 'rates' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Check Shipping Rates</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[['Pickup PIN', 'pickup'], ['Delivery PIN', 'delivery'], ['Weight (kg)', 'weight']].map(([label, key]) => (
              <div key={key}><label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input value={rateParams[key as keyof typeof rateParams]} onChange={e => setRateParams(p => ({...p, [key]: e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
            ))}
            <div><label className="block text-xs font-medium text-gray-500 mb-1">COD</label>
            <select value={rateParams.cod} onChange={e => setRateParams(p => ({...p, cod: e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"><option value="0">Prepaid</option><option value="1">COD</option></select></div>
          </div>
          <button onClick={getRates} className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 mb-4">Get Rates</button>
          {rateResult && (
            <div className="space-y-2">
              {(rateResult.available_courier_companies ?? []).slice(0, 10).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div><p className="font-semibold text-sm text-gray-900 dark:text-white">{c.courier_name}</p><p className="text-xs text-gray-500">{c.estimated_delivery_days} days · {c.cod ? 'COD available' : 'Prepaid only'}</p></div>
                  <span className="font-black text-orange-600">₹{c.freight_charge}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
