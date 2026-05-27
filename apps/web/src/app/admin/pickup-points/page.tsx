'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Edit2, Trash2, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export default function PickupPointsPage() {
  const { token } = useAdminAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', address: '', city: '', district: '', phone: '', openHours: '9am - 6pm', mapUrl: '', isActive: true });

  const apiFetch = (path: string, opts: RequestInit = {}) =>
    fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) } }).then(r => r.json());

  const { data, isLoading } = useQuery({ queryKey: ['pickup-points'], queryFn: () => apiFetch('/pickup-points/admin/all'), enabled: !!token, select: r => r.data ?? r });

  const saveMutation = useMutation({
    mutationFn: () => editing
      ? apiFetch(`/pickup-points/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) })
      : apiFetch('/pickup-points', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pickup-points'] }); toast.success('Saved'); setShowForm(false); setEditing(null); setForm({ name: '', address: '', city: '', district: '', phone: '', openHours: '9am - 6pm', mapUrl: '', isActive: true }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/pickup-points/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pickup-points'] }); toast.success('Deleted'); },
  });

  const points = Array.isArray(data) ? data : (data?.data ?? []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center"><MapPin className="h-5 w-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pickup Points</h1><p className="text-sm text-gray-500">Manage store pickup locations</p></div>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600">
          <Plus className="h-4 w-4" /> Add Point
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">{editing ? 'Edit Pickup Point' : 'Add Pickup Point'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[['Name*', 'name'], ['Address*', 'address'], ['City*', 'city'], ['District*', 'district'], ['Phone', 'phone'], ['Open Hours', 'openHours'], ['Map URL', 'mapUrl']].map(([label, key]) => (
              <div key={key}><label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input value={form[key as keyof typeof form] as string} onChange={e => setForm(p => ({...p, [key]: e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" /></div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex items-center gap-2 px-5 py-2 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 disabled:opacity-50">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-semibold"><X className="h-4 w-4 inline mr-1" />Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {points.map((p: any) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start justify-between mb-2">
                <div><p className="font-bold text-gray-900 dark:text-white">{p.name}</p><p className="text-xs text-gray-500">{p.city}, {p.district}</p></div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{p.address}</p>
              <p className="text-xs text-gray-400">{p.phone} · {p.openHours}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setEditing(p); setForm({ name: p.name, address: p.address, city: p.city, district: p.district, phone: p.phone ?? '', openHours: p.openHours ?? '9am - 6pm', mapUrl: p.mapUrl ?? '', isActive: p.isActive }); setShowForm(true); }} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"><Edit2 className="h-3 w-3" /> Edit</button>
                <button onClick={() => deleteMutation.mutate(p.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            </div>
          ))}
          {!points.length && <div className="col-span-2 text-center py-12 text-gray-400"><MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No pickup points yet</p></div>}
        </div>
      )}
    </div>
  );
}
