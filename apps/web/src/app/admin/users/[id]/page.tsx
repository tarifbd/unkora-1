'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, MapPin, ShoppingBag, Calendar, Phone,
  Mail, Shield, Star, TrendingUp, Package, KeyRound, ChevronRight,
  Home, Building2, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin';
import api from '@/lib/api';

// ─── Colour helpers ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-rose-500', 'bg-teal-500',
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

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

const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  BKASH: 'bKash', NAGAD: 'Nagad', ROCKET: 'Rocket',
  CARD: 'Card', COD: 'COD', BANK_TRANSFER: 'Bank',
};

function fmt(val: string | number | undefined | null) {
  if (val === undefined || val === null) return '৳0';
  return '৳' + Number(val).toLocaleString('en-BD');
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-BD', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Address {
  id: string;
  label?: string;
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod?: string;
  total: string | number;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  profile?: { avatarUrl?: string };
  addresses?: Address[];
  recentOrders?: RecentOrder[];
  lifetimeValue?: string | number;
  paidOrderCount?: number;
  _count?: {
    orders?: number;
    wishlistItems?: number;
    reviews?: number;
  };
}

// ─── Reset Password Modal ──────────────────────────────────────────────────────

function ResetPasswordModal({ userId, email, onClose }: { userId: string; email: string; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);

  const mutation = useMutation({
    mutationFn: (newPassword: string) =>
      api.patch(`/admin/users/${userId}`, { password: newPassword }).then(r => r.data),
    onSuccess: () => {
      toast.success('Password reset successfully');
      onClose();
    },
    onError: () => toast.error('Failed to reset password'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    mutation.mutate(password);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold">Reset Password</h2>
        <p className="mb-4 text-sm text-muted-foreground">{email}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">New Password</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-xl border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Confirm Password</label>
            <input
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomerDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = React.use(props.params);
  const { id } = params;

  const queryClient = useQueryClient();
  const [showResetModal, setShowResetModal] = useState(false);

  const { data: customer, isLoading, isError } = useQuery<CustomerDetail>({
    queryKey: ['admin-user-detail', id],
    queryFn: () => adminApi.getUserDetail(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { role?: string; status?: string }) => adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Customer updated successfully');
    },
    onError: () => toast.error('Failed to update customer'),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive/60" />
        <p className="text-sm text-muted-foreground">Failed to load customer details.</p>
        <Link href="/admin/users" className="text-sm font-medium text-primary hover:underline">
          Back to Customers
        </Link>
      </div>
    );
  }

  const fullName = `${customer.firstName} ${customer.lastName}`.trim() || customer.email;
  const initials = (customer.firstName?.[0] ?? '') + (customer.lastName?.[0] ?? '');
  const color = avatarColor(customer.id);
  const isSuspended = customer.status === 'SUSPENDED';

  return (
    <div className="space-y-5">
      {/* Back nav */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {/* Header card */}
      <div className="rounded-xl border bg-card shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-white text-xl font-bold ${color}`}>
            {initials.toUpperCase() || '?'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-serif text-2xl font-bold leading-tight">{fullName}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[customer.role] ?? 'bg-gray-100 text-gray-700'}`}>
                {customer.role.replace('_', ' ')}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[customer.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {customer.status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />{customer.email}
              </span>
              {customer.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />{customer.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />Joined {fmtDate(customer.createdAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            {/* Role selector */}
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <select
                value={customer.role}
                onChange={e => updateMutation.mutate({ role: e.target.value })}
                disabled={updateMutation.isPending}
                className="rounded-lg border bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            {/* Suspend / Activate */}
            <button
              onClick={() => updateMutation.mutate({ status: isSuspended ? 'ACTIVE' : 'SUSPENDED' })}
              disabled={updateMutation.isPending}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                isSuspended
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {updateMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : isSuspended
                  ? <CheckCircle2 className="h-3.5 w-3.5" />
                  : <AlertTriangle className="h-3.5 w-3.5" />
              }
              {isSuspended ? 'Activate' : 'Suspend'}
            </button>

            {/* Reset password */}
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Reset Password
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
            label: 'Lifetime Value',
            value: fmt(customer.lifetimeValue),
            bg: 'bg-emerald-50',
          },
          {
            icon: <Package className="h-5 w-5 text-blue-600" />,
            label: 'Paid Orders',
            value: customer.paidOrderCount ?? customer._count?.orders ?? 0,
            bg: 'bg-blue-50',
          },
          {
            icon: <ShoppingBag className="h-5 w-5 text-purple-600" />,
            label: 'Wishlist Items',
            value: customer._count?.wishlistItems ?? 0,
            bg: 'bg-purple-50',
          },
          {
            icon: <Star className="h-5 w-5 text-amber-500" />,
            label: 'Reviews Written',
            value: customer._count?.reviews ?? 0,
            bg: 'bg-amber-50',
          },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border bg-card shadow-sm p-4">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${stat.bg}`}>
              {stat.icon}
            </div>
            <p className="text-xl font-bold leading-none">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      {(customer.recentOrders?.length ?? 0) > 0 && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-sm">Recent Orders</h2>
            <p className="text-xs text-muted-foreground">Last {customer.recentOrders!.length} orders</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Payment</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground sr-only">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customer.recentOrders!.map(order => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-xs">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {order.paymentMethod ? (PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold">{fmt(order.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
                      >
                        View <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Addresses */}
      {(customer.addresses?.length ?? 0) > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-sm">Saved Addresses</h2>
            <p className="text-xs text-muted-foreground">{customer.addresses!.length} address{customer.addresses!.length !== 1 ? 'es' : ''}</p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {customer.addresses!.map(addr => (
              <div key={addr.id} className={`rounded-xl border p-4 text-sm ${addr.isDefault ? 'border-primary/40 bg-primary/5' : ''}`}>
                <div className="mb-1.5 flex items-center gap-2">
                  {addr.label === 'HOME' ? (
                    <Home className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                    {addr.label ?? 'Address'}
                  </span>
                  {addr.isDefault && (
                    <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Default
                    </span>
                  )}
                </div>
                <p className="font-medium">{addr.street}</p>
                <p className="text-muted-foreground">
                  {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}
                </p>
                <p className="text-muted-foreground">{addr.country}</p>
                {addr.phone && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />{addr.phone}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for orders/addresses */}
      {(customer.recentOrders?.length ?? 0) === 0 && (
        <div className="rounded-xl border bg-card shadow-sm py-10 text-center text-sm text-muted-foreground">
          <Package className="mx-auto mb-2 h-8 w-8 opacity-30" />
          No orders yet
        </div>
      )}

      {showResetModal && (
        <ResetPasswordModal
          userId={customer.id}
          email={customer.email}
          onClose={() => setShowResetModal(false)}
        />
      )}
    </div>
  );
}
