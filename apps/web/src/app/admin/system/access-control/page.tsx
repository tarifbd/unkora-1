'use client';
import { useQuery } from '@tanstack/react-query';
import { UserCog, Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

interface Permission { resource: string; actions: string[] }

const ROLES = [
  {
    name: 'SUPER_ADMIN',
    label: 'Super Admin',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    badge: 'bg-purple-500',
    description: 'Full access to all features including system settings, staff management, and security.',
  },
  {
    name: 'ADMIN',
    label: 'Admin',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    badge: 'bg-blue-500',
    description: 'Access to all operational features. Cannot access system settings or manage other admins.',
  },
  {
    name: 'SELLER',
    label: 'Seller',
    color: 'bg-green-100 text-green-700 border-green-200',
    badge: 'bg-green-500',
    description: 'Access to seller dashboard only. Can manage their own products, orders, and withdrawals.',
  },
  {
    name: 'CUSTOMER',
    label: 'Customer',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    badge: 'bg-gray-400',
    description: 'Access to customer account, orders, wishlist, and profile only.',
  },
];

const PERMISSION_MATRIX: { resource: string; superAdmin: boolean; admin: boolean; seller: boolean }[] = [
  { resource: 'Products',         superAdmin: true,  admin: true,  seller: true },
  { resource: 'Orders',           superAdmin: true,  admin: true,  seller: true },
  { resource: 'Users',            superAdmin: true,  admin: true,  seller: false },
  { resource: 'Coupons',          superAdmin: true,  admin: true,  seller: false },
  { resource: 'Finance',          superAdmin: true,  admin: true,  seller: false },
  { resource: 'Staff',            superAdmin: true,  admin: false, seller: false },
  { resource: 'System Settings',  superAdmin: true,  admin: false, seller: false },
  { resource: 'Audit Logs',       superAdmin: true,  admin: false, seller: false },
  { resource: 'Inventory',        superAdmin: true,  admin: true,  seller: true },
  { resource: 'Reports',          superAdmin: true,  admin: true,  seller: false },
  { resource: 'Sellers',          superAdmin: true,  admin: true,  seller: false },
  { resource: 'Withdrawals',      superAdmin: true,  admin: true,  seller: true },
];

export default function AccessControlPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['staff-stats'],
    queryFn: () => api.get('/staff/stats').then(r => r.data.data).catch(() => ({ totalStaff: 0, pendingInvitations: 0 })),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <UserCog className="h-5 w-5 text-orange-500" /> Access Control
        </h1>
        <p className="text-sm text-gray-500 mt-1">Role-based access control (RBAC) for the UNKORA platform.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Staff', value: String((data as { totalStaff?: number })?.totalStaff ?? 0), color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Pending Invites', value: String((data as { pendingInvitations?: number })?.pendingInvitations ?? 0), color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Active Roles', value: '4', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Resources', value: String(PERMISSION_MATRIX.length), color: 'text-gray-600', bg: 'bg-gray-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROLES.map(role => (
          <div key={role.name} className={`bg-white rounded-2xl border ${role.color} shadow-sm p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-8 w-8 rounded-full ${role.badge} flex items-center justify-center`}>
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{role.label}</p>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${role.color}`}>{role.name}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">{role.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Permission Matrix</h2>
          <p className="text-xs text-gray-500 mt-0.5">Access rights per resource and role</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Resource</th>
                {['Super Admin', 'Admin', 'Seller'].map(h => (
                  <th key={h} className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {PERMISSION_MATRIX.map(row => (
                <tr key={row.resource} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.resource}</td>
                  {[row.superAdmin, row.admin, row.seller].map((has, i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      {has
                        ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        : <XCircle className="h-4 w-4 text-gray-200 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-sm text-amber-800 font-semibold">💡 Managing Staff Access</p>
        <p className="text-sm text-amber-700 mt-1">Invite new staff from the <a href="/admin/staff" className="underline font-semibold text-amber-800">Staff & Permissions</a> page. Only SUPER_ADMIN can promote users to ADMIN or SUPER_ADMIN roles.</p>
      </div>
    </div>
  );
}
