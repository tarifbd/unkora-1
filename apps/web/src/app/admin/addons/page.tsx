'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Package, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export default function AddonsPage() {
  const { token } = useAdminAuth();
  const qc = useQueryClient();
  const apiFetch = (path: string, opts: RequestInit = {}) =>
    fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) } }).then(r => r.json());

  const { data, isLoading } = useQuery({
    queryKey: ['addons'],
    queryFn: () => apiFetch('/addons'),
    enabled: !!token,
    select: r => r.data ?? r,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ slug, enabled }: { slug: string; enabled: boolean }) =>
      apiFetch(`/addons/${slug}/toggle`, { method: 'PUT', body: JSON.stringify({ enabled }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addons'] }); toast.success('Addon updated'); },
  });

  const seedMutation = useMutation({
    mutationFn: () => apiFetch('/addons/seed', { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addons'] }); toast.success('Addons seeded'); },
  });

  const addons = Array.isArray(data) ? data : (data?.data ?? []);
  const grouped = addons.reduce((acc: any, addon: any) => {
    if (!acc[addon.category]) acc[addon.category] = [];
    acc[addon.category].push(addon);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center"><Package className="h-5 w-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Addon Manager</h1><p className="text-sm text-gray-500">Enable or disable platform features</p></div>
        </div>
        <button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
          {seedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Seed Built-ins
        </button>
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div> : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]: any) => (
            <div key={category}>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 capitalize">{category}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((addon: any) => (
                  <div key={addon.slug} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{addon.icon ?? '🔧'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{addon.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{addon.description}</p>
                        </div>
                        <button onClick={() => toggleMutation.mutate({ slug: addon.slug, enabled: !addon.isEnabled })} disabled={toggleMutation.isPending} className="flex-shrink-0 mt-0.5">
                          {addon.isEnabled
                            ? <ToggleRight className="h-6 w-6 text-indigo-600" />
                            : <ToggleLeft className="h-6 w-6 text-gray-300" />}
                        </button>
                      </div>
                      <div className="mt-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${addon.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{addon.isEnabled ? 'Enabled' : 'Disabled'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {addons.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No addons found. Click "Seed Built-ins" to populate.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
