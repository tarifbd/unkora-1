'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import api from '@/lib/api';

const ROLE_TABS = ['ALL', 'CUSTOMER', 'ADMIN', 'SUPER_ADMIN'] as const;
const STATUS_TABS = ['ALL', 'ACTIVE', 'SUSPENDED', 'INACTIVE'] as const;

const ROLE_BADGE: Record<string, string> = {
  CUSTOMER: 'bg-gray-100 text-gray-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  INACTIVE: 'bg-yellow-100 text-yellow-700',
};

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  _count?: { orders?: number };
  addresses?: Array<{ id: string; label?: string; street: string; city: string; country: string }>;
}

function UserRow({ user }: { user: UserDetail }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const changeRole = useMutation({
    mutationFn: (role: string) => api.patch(`/admin/users/${user.id}`, { role }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const changeStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/admin/users/${user.id}`, { status }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <>
      <tr
        className="hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </div>
            <div>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
          {user.phone ?? '—'}
        </td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role] ?? 'bg-muted text-muted-foreground'}`}>
            {user.role.replace('_', ' ')}
          </span>
        </td>
        <td className="hidden px-4 py-3 sm:table-cell">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[user.status] ?? 'bg-muted text-muted-foreground'}`}>
            {user.status}
          </span>
        </td>
        <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
          {user._count?.orders ?? 0}
        </td>
        <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
          {new Date(user.createdAt).toLocaleDateString()}
        </td>
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {user.role !== 'SUPER_ADMIN' && (
              <select
                value={user.role}
                onChange={e => changeRole.mutate(e.target.value)}
                onClick={e => e.stopPropagation()}
                disabled={changeRole.isPending}
                className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="ADMIN">Admin</option>
              </select>
            )}
            <button
              onClick={e => { e.stopPropagation(); changeStatus.mutate(user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'); }}
              disabled={changeStatus.isPending}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                user.status === 'ACTIVE'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {changeStatus.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
            </button>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/10">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="font-medium mb-1 text-muted-foreground uppercase text-xs tracking-wide">Account</p>
                <p>Joined: {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p>Orders: {user._count?.orders ?? 0}</p>
                <p>Status: {user.status}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="font-medium mb-1 text-muted-foreground uppercase text-xs tracking-wide">Addresses</p>
                {user.addresses && user.addresses.length > 0 ? (
                  <ul className="space-y-1">
                    {user.addresses.map(addr => (
                      <li key={addr.id} className="text-muted-foreground">
                        {addr.label && <span className="font-medium text-foreground mr-1">{addr.label}:</span>}
                        {addr.street}, {addr.city}, {addr.country}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No addresses saved</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearch as { timer?: ReturnType<typeof setTimeout> }).timer);
    (handleSearch as { timer?: ReturnType<typeof setTimeout> }).timer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, debouncedSearch, roleFilter, statusFilter],
    queryFn: () => adminApi.getUsers({
      page,
      limit: 20,
      search: debouncedSearch || undefined,
      role: roleFilter === 'ALL' ? undefined : roleFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
  });

  const users: UserDetail[] = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Users</h1>
        {data?.meta && (
          <p className="text-sm text-muted-foreground">{data.meta.total} total users</p>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2">
        {ROLE_TABS.map(r => (
          <button
            key={r}
            onClick={() => { setRoleFilter(r); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${roleFilter === r ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}
          >
            {r.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-secondary text-secondary-foreground' : 'border hover:bg-accent'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Status</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Orders</th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Joined</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>

        {!isLoading && !users.length && (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p>No users found</p>
          </div>
        )}
      </div>

      {data?.meta?.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map((p: number) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-md text-sm transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
