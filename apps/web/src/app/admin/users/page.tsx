'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Loader2, Search, X, MapPin, ShoppingBag,
  Calendar, Phone, Mail, Shield, ShieldAlert, ShieldCheck,
  ChevronRight, UserCheck, UserX, Crown, Ban, CheckCircle2,
  AlertTriangle, Clock, TrendingUp, Package, MoreVertical,
} from 'lucide-react';
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

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-rose-500', 'bg-teal-500',
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Address {
  id: string;
  label?: string;
  street: string;
  city: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string | number;
  createdAt: string;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  _count?: { orders?: number };
  addresses?: Address[];
  orders?: Order[];
  totalSpent?: number;
}

type RiskLevel = 'low' | 'medium' | 'high';

function getRiskLevel(user: UserDetail): { level: RiskLevel; reason: string } {
  const daysSinceJoin = (Date.now() - new Date(user.createdAt).getTime()) / 86400000;
  const orderCount = user._count?.orders ?? 0;
  const cancelledOrders = user.orders?.filter(o => o.status === 'CANCELLED').length ?? 0;
  const cancelRate = orderCount > 0 ? cancelledOrders / orderCount : 0;

  if (user.status === 'SUSPENDED') return { level: 'high', reason: 'Account suspended' };
  if (cancelRate > 0.5 && orderCount > 3) return { level: 'high', reason: `${Math.round(cancelRate * 100)}% cancel rate` };
  if (daysSinceJoin < 7 && orderCount > 5) return { level: 'medium', reason: 'New account, high activity' };
  if (cancelRate > 0.3) return { level: 'medium', reason: 'High cancellation rate' };
  return { level: 'low', reason: 'Normal behaviour' };
}

function RiskBadge({ level }: { level: RiskLevel }) {
  if (level === 'high') return (
    <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <ShieldAlert className="w-3 h-3" /> High
    </span>
  );
  if (level === 'medium') return (
    <span className="flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> Medium
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
      <ShieldCheck className="w-3 h-3" /> Low
    </span>
  );
}

function CustomerModal({ user, onClose }: { user: UserDetail; onClose: () => void }) {
  const qc = useQueryClient();
  const overlayRef = useRef<HTMLDivElement>(null);

  const { data: fullUser, isLoading } = useQuery({
    queryKey: ['admin-user-detail', user.id],
    queryFn: () => api.get(`/admin/users/${user.id}`).then(r => r.data.data as UserDetail),
  });

  const u = fullUser ?? user;
  const risk = getRiskLevel(u);
  const initials = u.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  const colorClass = avatarColor(u.id);

  const changeRole = useMutation({
    mutationFn: (role: string) => api.patch(`/admin/users/${u.id}`, { role }).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); qc.invalidateQueries({ queryKey: ['admin-user-detail', u.id] }); },
  });

  const changeStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/admin/users/${u.id}`, { status }).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); qc.invalidateQueries({ queryKey: ['admin-user-detail', u.id] }); },
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const orderStatusColor: Record<string, string> = {
    PENDING: 'text-yellow-600 bg-yellow-50',
    CONFIRMED: 'text-blue-600 bg-blue-50',
    PROCESSING: 'text-violet-600 bg-violet-50',
    SHIPPED: 'text-indigo-600 bg-indigo-50',
    DELIVERED: 'text-green-600 bg-green-50',
    CANCELLED: 'text-red-600 bg-red-50',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl overflow-hidden animate-[slideInRight_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="font-bold text-base text-gray-900">Customer Profile</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Profile header */}
            <div className="px-6 py-6 border-b">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl ${colorClass} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{u.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role] ?? 'bg-gray-100'}`}>
                          {u.role === 'SUPER_ADMIN' ? 'Super Admin' : u.role === 'ADMIN' ? 'Admin' : 'Customer'}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[u.status] ?? 'bg-gray-100'}`}>
                          {u.status}
                        </span>
                        <RiskBadge level={risk.level} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{u.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>Joined {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-px bg-gray-100 border-b">
              {[
                { label: 'Orders', value: u._count?.orders ?? 0, icon: ShoppingBag, color: 'text-blue-600' },
                { label: 'Spent', value: `৳${Number(u.totalSpent ?? 0).toLocaleString()}`, icon: TrendingUp, color: 'text-green-600' },
                { label: 'Addresses', value: u.addresses?.length ?? 0, icon: MapPin, color: 'text-violet-600' },
              ].map(s => (
                <div key={s.label} className="bg-white px-4 py-3 text-center">
                  <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                  <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Risk assessment */}
            {risk.level !== 'low' && (
              <div className={`mx-4 mt-4 rounded-xl p-3 flex items-start gap-2.5 ${risk.level === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <ShieldAlert className={`w-4 h-4 flex-shrink-0 mt-0.5 ${risk.level === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                <div>
                  <p className={`text-xs font-bold ${risk.level === 'high' ? 'text-red-700' : 'text-yellow-700'}`}>
                    {risk.level === 'high' ? 'High Risk Customer' : 'Medium Risk Customer'}
                  </p>
                  <p className={`text-xs mt-0.5 ${risk.level === 'high' ? 'text-red-600' : 'text-yellow-600'}`}>{risk.reason}</p>
                </div>
              </div>
            )}

            {/* Addresses / Location */}
            {u.addresses && u.addresses.length > 0 && (
              <div className="px-4 mt-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Delivery Locations
                </p>
                <div className="space-y-2">
                  {u.addresses.map(addr => (
                    <div key={addr.id} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-2.5">
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${addr.isDefault ? 'bg-primary' : 'bg-gray-300'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {addr.label && <span className="text-xs font-bold text-gray-700">{addr.label}</span>}
                          {addr.isDefault && <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">Default</span>}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{addr.street}</p>
                        <p className="text-xs text-gray-500">{addr.city}, {addr.country}</p>
                        {addr.phone && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {addr.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent orders */}
            {u.orders && u.orders.length > 0 && (
              <div className="px-4 mt-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Recent Orders
                </p>
                <div className="space-y-2">
                  {u.orders.slice(0, 5).map(order => (
                    <div key={order.id} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-800">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${orderStatusColor[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                        <span className="text-xs font-bold text-gray-800">৳{Number(order.total).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-4 mt-5 mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Account Actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {u.role !== 'SUPER_ADMIN' && (
                  <>
                    {u.role === 'CUSTOMER' ? (
                      <button
                        onClick={() => changeRole.mutate('ADMIN')}
                        disabled={changeRole.isPending}
                        className="flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 rounded-xl py-2.5 text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        <Crown className="w-3.5 h-3.5" /> Make Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => changeRole.mutate('CUSTOMER')}
                        disabled={changeRole.isPending}
                        className="flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 rounded-xl py-2.5 text-xs font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Set as Customer
                      </button>
                    )}
                  </>
                )}
                {u.status === 'ACTIVE' ? (
                  <button
                    onClick={() => changeStatus.mutate('SUSPENDED')}
                    disabled={changeStatus.isPending}
                    className="flex items-center justify-center gap-1.5 bg-red-50 text-red-700 rounded-xl py-2.5 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {changeStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => changeStatus.mutate('ACTIVE')}
                    disabled={changeStatus.isPending}
                    className="flex items-center justify-center gap-1.5 bg-green-50 text-green-700 rounded-xl py-2.5 text-xs font-bold hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    {changeStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Activate
                  </button>
                )}
                {u.status !== 'INACTIVE' && (
                  <button
                    onClick={() => changeStatus.mutate('INACTIVE')}
                    disabled={changeStatus.isPending}
                    className="flex items-center justify-center gap-1.5 bg-yellow-50 text-yellow-700 rounded-xl py-2.5 text-xs font-bold hover:bg-yellow-100 transition-colors disabled:opacity-50 col-span-1"
                  >
                    <UserX className="w-3.5 h-3.5" /> Deactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, onOpen }: { user: UserDetail; onOpen: () => void }) {
  const qc = useQueryClient();
  const risk = getRiskLevel(user);
  const initials = user.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  const colorClass = avatarColor(user.id);
  const primaryAddress = user.addresses?.find(a => a.isDefault) ?? user.addresses?.[0];

  const changeStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/admin/users/${user.id}`, { status }).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <tr className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={onOpen}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm text-gray-500 sm:table-cell">
        {user.phone ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        {primaryAddress ? (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{primaryAddress.city}</span>
          </div>
        ) : <span className="text-gray-300 text-xs">—</span>}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role] ?? 'bg-gray-100'}`}>
          {user.role === 'SUPER_ADMIN' ? 'S.Admin' : user.role}
        </span>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[user.status] ?? 'bg-gray-100'}`}>
          {user.status}
        </span>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <RiskBadge level={risk.level} />
      </td>
      <td className="hidden px-4 py-3 text-sm text-gray-600 lg:table-cell font-medium">
        {user._count?.orders ?? 0}
      </td>
      <td className="hidden px-4 py-3 text-sm text-gray-600 xl:table-cell">
        {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changeStatus.mutate(user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
            disabled={changeStatus.isPending}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
              user.status === 'ACTIVE' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            {changeStatus.isPending
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </button>
          <button
            onClick={onOpen}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

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
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage users, roles, and account status</p>
        </div>
        {meta && (
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl self-start sm:self-auto">
            <span className="font-black text-lg">{meta.total}</span>
            <span className="text-xs ml-1.5 font-medium">total users</span>
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full rounded-xl border bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ROLE_TABS.map(r => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                roleFilter === r ? 'bg-primary text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r === 'SUPER_ADMIN' ? 'S.Admin' : r === 'ALL' ? 'All Roles' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 sm:table-cell">Phone</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 md:table-cell">Location</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 sm:table-cell">Status</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 md:table-cell">Risk</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Orders</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 xl:table-cell">Joined</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <UserRow key={user.id} user={user} onOpen={() => setSelectedUser(user)} />
            ))}
          </tbody>
        </table>

        {!isLoading && !users.length && (
          <div className="py-14 text-center text-gray-400">
            <Users className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p className="font-medium">No users found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        )}
        </div>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 rounded-lg border text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, meta.totalPages - 4));
              return start + i;
            }).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${
                  p === page ? 'bg-primary text-white' : 'border hover:bg-gray-50 text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="h-8 px-3 rounded-lg border text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Customer detail modal */}
      {selectedUser && <CustomerModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
