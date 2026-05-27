'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

const EMPTY = { name: '', title: '', content: '', imageUrl: '', buttonText: '', buttonUrl: '', type: 'modal', trigger: 'on_load', delayMs: 3000, showOnce: true, isActive: true, startDate: '', endDate: '' };

export default function PopupsPage() {
  const { token } = useAdminAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [editing, setEditing] = useState<any>(null);

  const apiFetch = (path: string, opts: RequestInit = {}) =>
    fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) } }).then(r => r.json());

  const { data, isLoading } = useQuery({ queryKey: ['popups-admin'], queryFn: () => apiFetch('/popups'), enabled: !!token, select: r => r.data ?? r });

  const save = useMutation({
    mutationFn: () => editing
      ? apiFetch(`/popups/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) })
      : apiFetch('/popups', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['popups-admin'] }); toast.success('Saved'); setShowForm(false); setEditing(null); setForm(EMPTY); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/popups/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['popups-admin'] }); toast.success('Deleted'); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: any) => apiFetch(`/popups/${id}`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['popups-admin'] }),
  });

  const popups = Array.isArray(data) ? data : (data?.data ?? []);

  const F = ({ label, k, type = 'text', options }: any) => (
    <div><label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    {options ? (
      <select value={form[k]} onChange={e => setForm((p: any) => ({...p,[k]:e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
        {options.map(([v,l]: any) => <option key={v} value={v}>{l}</option>)}
      </select>
    ) : type === 'textarea' ? (
      <textarea value={form[k]} onChange={e => setForm((p: any) => ({...p,[k]:e.target.value}))} rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
    ) : (
      <input type={type} value={form[k]} onChange={e => setForm((p: any) => ({...p,[k]: type === 'number' ? +e.target.value : e.target.value}))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
    )}</div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pink-500 flex items-center justify-center"><Layers className="h-5 w-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dynamic Popups</h1><p className="text-sm text-gray-500">Create and manage promotional popups</p></div>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY); }} className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600"><Plus className="h-4 w-4" /> New Popup</button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">{editing ? 'Edit Popup' : 'New Popup'}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Internal Name*" k="name" />
            <F label="Popup Title*" k="title" />
            <div className="sm:col-span-2"><F label="Content (HTML allowed)" k="content" type="textarea" /></div>
            <F label="Image URL" k="imageUrl" />
            <F label="Button Text" k="buttonText" />
            <F label="Button URL" k="buttonUrl" />
            <F label="Type" k="type" options={[['modal','Modal'],['banner','Banner'],['corner','Corner']]} />
            <F label="Trigger" k="trigger" options={[['on_load','On Page Load'],['after_delay','After Delay'],['on_exit','On Exit Intent']]} />
            <F label="Delay (ms)" k="delayMs" type="number" />
            <F label="Start Date" k="startDate" type="datetime-local" />
            <F label="End Date" k="endDate" type="datetime-local" />
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.showOnce} onChange={e => setForm((p: any) => ({...p,showOnce:e.target.checked}))} /><span className="text-sm">Show once per visitor</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm((p: any) => ({...p,isActive:e.target.checked}))} /><span className="text-sm">Active</span></label>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => save.mutate()} disabled={!form.name || !form.title || save.isPending} className="px-5 py-2 bg-pink-500 text-white font-bold rounded-xl disabled:opacity-50">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Save Popup'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : popups.map((popup: any) => (
          <div key={popup.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-gray-900 dark:text-white">{popup.title}</p>
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 capitalize">{popup.type}</span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 capitalize">{popup.trigger?.replace('_',' ')}</span>
              </div>
              <p className="text-xs text-gray-400">{popup.views} views · {popup.clicks} clicks · {popup.showOnce ? 'Show once' : 'Always show'}</p>
            </div>
            <button onClick={() => toggleMutation.mutate({ id: popup.id, isActive: !popup.isActive })}>
              {popup.isActive ? <ToggleRight className="h-6 w-6 text-green-500" /> : <ToggleLeft className="h-6 w-6 text-gray-300" />}
            </button>
            <button onClick={() => { setEditing(popup); setForm({ ...popup, startDate: popup.startDate?.slice(0,16) ?? '', endDate: popup.endDate?.slice(0,16) ?? '' }); setShowForm(true); }} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold">Edit</button>
            <button onClick={() => deleteMutation.mutate(popup.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {!popups.length && !isLoading && <div className="text-center py-12 text-gray-400"><Layers className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No popups yet. Create one to engage visitors.</p></div>}
      </div>
    </div>
  );
}
