'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Loader2, MoreVertical, Eye, Edit, Trash2, Power, Pause } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { preordersApi, PreorderConfig, PreorderConfigStatus } from '@/lib/api/preorders';

const STATUS_BADGE: Record<PreorderConfigStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CLOSED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function ActionsMenu({ config }: { config: PreorderConfig }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PreorderConfigStatus }) =>
      preordersApi.setConfigStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['preorder-configs'] }); toast.success('Status updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => preordersApi.deleteConfig(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['preorder-configs'] }); toast.success('Deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-44 py-1">
            <Link
              href={`/admin/preorders/configurations/${config.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              <Edit className="h-4 w-4" /> Edit
            </Link>
            {config.status !== 'ACTIVE' && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => { statusMut.mutate({ id: config.id, status: 'ACTIVE' }); setOpen(false); }}
              >
                <Power className="h-4 w-4" /> Activate
              </button>
            )}
            {config.status === 'ACTIVE' && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-yellow-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => { statusMut.mutate({ id: config.id, status: 'PAUSED' }); setOpen(false); }}
              >
                <Pause className="h-4 w-4" /> Pause
              </button>
            )}
            {config.status !== 'CLOSED' && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => { statusMut.mutate({ id: config.id, status: 'CLOSED' }); setOpen(false); }}
              >
                <Eye className="h-4 w-4" /> Close
              </button>
            )}
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => {
                if (confirm('Delete this configuration?')) { deleteMut.mutate(config.id); }
                setOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PreorderConfigsPage() {
  const [statusFilter, setStatusFilter] = useState<PreorderConfigStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['preorder-configs', statusFilter, page],
    queryFn: () => preordersApi.listConfigs({ status: statusFilter || undefined, page }),
  });

  const configs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preorder Configurations</h1>
            <p className="text-sm text-gray-500">{total} configuration{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link
          href="/admin/preorders/configurations/new"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" /> New Configuration
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'COMPLETED', 'CANCELLED'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {configs.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No configurations found.</p>
              <Link href="/admin/preorders/configurations/new" className="mt-3 inline-block text-sm text-orange-500 hover:underline">Create your first one</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Product', 'Status', 'Prepayment', 'Stock Limit', 'Orders', 'Dates', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {configs.map((cfg) => (
                  <tr key={cfg.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {cfg.product?.images?.[0] && (
                          <img src={cfg.product.images[0].url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{cfg.product?.name ?? cfg.productId}</p>
                          <p className="text-xs text-gray-400">{cfg.product?.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[cfg.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {cfg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {cfg.prepaymentType === 'NONE' ? 'None' :
                       cfg.prepaymentType === 'FULL_PAYMENT' ? 'Full' :
                       cfg.prepaymentType === 'PERCENTAGE' ? `${cfg.prepaymentAmount}%` :
                       `৳${cfg.prepaymentAmount}`}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{cfg.stockLimit ?? '∞'}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-orange-600">{cfg._count?.preorderOrders ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {cfg.preorderStartDate ? new Date(cfg.preorderStartDate).toLocaleDateString() : '—'}
                      {' → '}
                      {cfg.preorderEndDate ? new Date(cfg.preorderEndDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ActionsMenu config={cfg} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-sm font-medium ${
                p === page ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
