'use client';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Loader2, User, Search, Filter } from 'lucide-react';
import api from '@/lib/api';
import { useState } from 'react';

interface AuditLog { id: string; action: string; resource: string; resourceId?: string; details?: string; ip?: string; createdAt: string; user?: { firstName: string; lastName: string; email: string } }
interface AuditResult { data: AuditLog[]; total: number; page: number }

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN:  'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  VIEW:   'bg-yellow-100 text-yellow-700',
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 20;

  const { data, isLoading } = useQuery<AuditResult>({
    queryKey: ['audit-logs', page],
    queryFn: () => api.get(`/staff/audit-logs?page=${page}&limit=${limit}`).then(r => r.data.data).catch(() => ({ data: [], total: 0, page: 1 })),
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const filtered = search ? logs.filter(l => l.action.includes(search.toUpperCase()) || l.resource?.includes(search) || l.user?.email?.includes(search)) : logs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-orange-500" /> Audit Logs
        </h1>
        <p className="text-sm text-gray-500 mt-1">Track all admin actions and changes across the platform.</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by action, resource, or user email..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30" />
        </div>
        <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <ScrollText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No audit logs found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['User', 'Action', 'Resource', 'Details', 'IP', 'Time'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-xs">{log.user?.firstName} {log.user?.lastName}</p>
                            <p className="text-gray-400 text-xs">{log.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono">{log.resource}{log.resourceId ? `/${log.resourceId.slice(0, 8)}` : ''}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{log.details ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{log.ip ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-BD')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing {filtered.length} of {total} entries</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  Prev
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
