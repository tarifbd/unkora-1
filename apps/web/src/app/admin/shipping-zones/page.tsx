'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export default function ShippingZonesPage() {
  const { token } = useAdminAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newZone, setNewZone] = useState({ name: '', description: '', divisions: '', districts: '' });
  const [newRate, setNewRate] = useState({ name: '', carrier: '', baseRate: '', perKgRate: '0', freeAbove: '', estimatedDays: '3-5', minWeight: '0' });
  const [addingRateTo, setAddingRateTo] = useState<string | null>(null);

  const apiFetch = (path: string, opts: RequestInit = {}) =>
    fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) } }).then(r => r.json());

  const { data, isLoading } = useQuery({ queryKey: ['shipping-zones'], queryFn: () => apiFetch('/shipping-zones'), enabled: !!token, select: r => r.data ?? r });

  const createZone = useMutation({
    mutationFn: () => apiFetch('/shipping-zones', { method: 'POST', body: JSON.stringify({
      name: newZone.name,
      description: newZone.description,
      divisions: newZone.divisions ? newZone.divisions.split(',').map(s => s.trim()) : [],
      districts: newZone.districts ? newZone.districts.split(',').map(s => s.trim()) : [],
    })}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-zones'] }); toast.success('Zone created'); setShowAdd(false); },
  });

  const addRate = useMutation({
    mutationFn: (zoneId: string) => apiFetch(`/shipping-zones/${zoneId}/rates`, { method: 'POST', body: JSON.stringify({
      ...newRate, baseRate: parseFloat(newRate.baseRate), perKgRate: parseFloat(newRate.perKgRate || '0'),
      freeAbove: newRate.freeAbove ? parseFloat(newRate.freeAbove) : null,
      minWeight: parseFloat(newRate.minWeight || '0'),
    })}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-zones'] }); toast.success('Rate added'); setAddingRateTo(null); },
  });

  const deleteZone = useMutation({
    mutationFn: (id: string) => apiFetch(`/shipping-zones/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-zones'] }); toast.success('Deleted'); },
  });

  const deleteRate = useMutation({
    mutationFn: ({ zoneId, rateId }: any) => apiFetch(`/shipping-zones/${zoneId}/rates/${rateId}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-zones'] }); toast.success('Rate removed'); },
  });

  const zones = Array.isArray(data) ? data : (data?.data ?? []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500 flex items-center justify-center"><Package className="h-5 w-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shipping Zones</h1><p className="text-sm text-gray-500">Zone-based delivery rate engine</p></div>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600"><Plus className="h-4 w-4" /> Add Zone</button>
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="font-bold mb-4">New Shipping Zone</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Zone Name*</label><input value={newZone.name} onChange={e => setNewZone(p=>({...p,name:e.target.value}))} placeholder="e.g. Dhaka Metro" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Description</label><input value={newZone.description} onChange={e => setNewZone(p=>({...p,description:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Divisions (comma-separated)</label><input value={newZone.divisions} onChange={e => setNewZone(p=>({...p,divisions:e.target.value}))} placeholder="Dhaka, Chittagong" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Districts (comma-separated)</label><input value={newZone.districts} onChange={e => setNewZone(p=>({...p,districts:e.target.value}))} placeholder="Leave empty for all" className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => createZone.mutate()} disabled={!newZone.name || createZone.isPending} className="px-5 py-2 bg-teal-500 text-white font-bold rounded-xl disabled:opacity-50">
              {createZone.isPending ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Create Zone'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="space-y-3">
          {zones.map((zone: any) => (
            <div key={zone.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(expanded === zone.id ? null : zone.id)}>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{zone.name}</p>
                  <p className="text-xs text-gray-500">{zone.rates?.length ?? 0} rates · {([...zone.divisions??[], ...zone.districts??[]]).join(', ') || 'Default zone'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); deleteZone.mutate(zone.id); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                  {expanded === zone.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </div>
              {expanded === zone.id && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-4">
                  <table className="w-full text-sm mb-4">
                    <thead><tr className="text-xs text-gray-500">{['Rate Name','Carrier','Base','Per Kg','Free Above','Days',''].map(h => <th key={h} className="text-left py-1 pr-4">{h}</th>)}</tr></thead>
                    <tbody>
                      {zone.rates?.map((rate: any) => (
                        <tr key={rate.id} className="border-t border-gray-50 dark:border-gray-700/50">
                          <td className="py-2 pr-4 font-medium">{rate.name}</td>
                          <td className="py-2 pr-4 text-gray-500">{rate.carrier || '-'}</td>
                          <td className="py-2 pr-4">৳{Number(rate.baseRate).toLocaleString()}</td>
                          <td className="py-2 pr-4">৳{Number(rate.perKgRate)}</td>
                          <td className="py-2 pr-4 text-green-600">{rate.freeAbove ? `৳${Number(rate.freeAbove).toLocaleString()}` : '-'}</td>
                          <td className="py-2 pr-4 text-gray-500">{rate.estimatedDays}</td>
                          <td className="py-2"><button onClick={() => deleteRate.mutate({ zoneId: zone.id, rateId: rate.id })} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {addingRateTo === zone.id ? (
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
                      <div className="grid gap-3 sm:grid-cols-3 mb-3">
                        {[['Name*','name'],['Carrier','carrier'],['Base Rate (৳)*','baseRate'],['Per Kg Rate','perKgRate'],['Free Shipping Above','freeAbove'],['Est. Days','estimatedDays']].map(([label,key]) => (
                          <div key={key}><label className="block text-[10px] font-medium text-gray-400 mb-1">{label}</label>
                          <input value={newRate[key as keyof typeof newRate]} onChange={e => setNewRate(p=>({...p,[key as string]:e.target.value}))} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs" /></div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addRate.mutate(zone.id)} disabled={!newRate.name || !newRate.baseRate || addRate.isPending} className="px-4 py-1.5 bg-teal-500 text-white text-xs font-bold rounded-lg disabled:opacity-50">Add Rate</button>
                        <button onClick={() => setAddingRateTo(null)} className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setAddingRateTo(zone.id)} className="flex items-center gap-1.5 text-xs text-teal-600 font-semibold hover:underline"><Plus className="h-3.5 w-3.5" /> Add Rate</button>
                  )}
                </div>
              )}
            </div>
          ))}
          {!zones.length && <div className="text-center py-12 text-gray-400"><Package className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No shipping zones. Add one to enable zone-based rates at checkout.</p></div>}
        </div>
      )}
    </div>
  );
}
