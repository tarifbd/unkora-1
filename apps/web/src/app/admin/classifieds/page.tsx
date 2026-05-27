'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Check, X, Trash2, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export default function ClassifiedsPage() {
  const { token } = useAdminAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const apiFetch = (path: string, opts: RequestInit = {}) =>
    fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) } }).then(r => r.json());

  const { data, isLoading } = useQuery({
    queryKey: ['classifieds-admin', statusFilter],
    queryFn: () => apiFetch(`/classifieds/admin/list?status=${statusFilter}&limit=50`),
    enabled: !!token,
    select: r => r.data ?? r,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: any) => apiFetch(`/classifieds/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classifieds-admin'] }); toast.success('Updated'); },
  });

  const deleteAd = useMutation({
    mutationFn: (id: string) => apiFetch(`/classifieds/admin/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classifieds-admin'] }); toast.success('Deleted'); },
  });

  const ads = data?.data ?? (Array.isArray(data) ? data : []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center"><LayoutGrid className="h-5 w-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classified Ads</h1><p className="text-sm text-gray-500">Moderate customer ads</p></div>
        </div>
        <div className="flex gap-2">
          {['PENDING','APPROVED','REJECTED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${statusFilter === s ? 'bg-purple-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600'}`}>{s.toLowerCase()}</button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad: any) => (
            <div key={ad.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 capitalize">{ad.category}</span>
                <div className="flex items-center gap-1 text-xs text-gray-400"><Eye className="h-3 w-3" />{ad.views}</div>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{ad.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ad.description}</p>
              {ad.price && <p className="text-sm font-black text-orange-600 mb-3">৳{Number(ad.price).toLocaleString()}</p>}
              <p className="text-[10px] text-gray-400 mb-3">{ad.location} · {new Date(ad.createdAt).toLocaleDateString()}</p>
              <div className="flex gap-2">
                {statusFilter === 'PENDING' && <>
                  <button onClick={() => updateStatus.mutate({ id: ad.id, status: 'APPROVED' })} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600"><Check className="h-3 w-3" /> Approve</button>
                  <button onClick={() => updateStatus.mutate({ id: ad.id, status: 'REJECTED' })} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded-lg hover:bg-red-200"><X className="h-3 w-3" /> Reject</button>
                </>}
                <button onClick={() => deleteAd.mutate(ad.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {!ads.length && <div className="col-span-3 text-center py-12 text-gray-400"><LayoutGrid className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No {statusFilter.toLowerCase()} ads</p></div>}
        </div>
      )}
    </div>
  );
}
