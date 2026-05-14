'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Loader2 } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminApi.getUsers({ page, limit: 20 }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Users</h1>
        {data?.meta && <p className="text-sm text-muted-foreground">{data.meta.total} total users</p>}
      </div>

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.data?.map((user: { id: string; name: string; email: string; phone?: string; role: string; createdAt: string }) => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{user.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-700' :
                    user.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' :
                    'bg-muted text-muted-foreground'
                  }`}>{user.role}</span>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && !data?.data?.length && (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p>No users found</p>
          </div>
        )}
      </div>

      {data?.meta?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map((p: number) => (
            <button key={p} onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-md text-sm transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
