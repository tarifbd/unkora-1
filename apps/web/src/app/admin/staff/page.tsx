'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, UserPlus, Mail, ClipboardList, Loader2,
  Trash2, ChevronLeft, ChevronRight, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

// ── Interfaces ──────────────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface StaffInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  user?: { firstName?: string; lastName?: string; email: string };
  action: string;
  entity?: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  createdAt: string;
}

interface StaffStats {
  totalStaff: number;
  pendingInvitations: number;
  auditLogCount: number;
}

interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-rose-500', 'bg-teal-500',
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(first?: string, last?: string, email?: string) {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-blue-100 text-blue-700',
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  INACTIVE: 'bg-yellow-100 text-yellow-700',
};

// ── Pagination Controls ──────────────────────────────────────────────────────

function Pagination({ meta, page, setPage }: {
  meta: PageMeta;
  page: number;
  setPage: (fn: (p: number) => number) => void;
}) {
  if (meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 px-4">
      <p className="text-sm text-gray-500">
        Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
          disabled={page === meta.totalPages}
          className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');

  const invite = useMutation({
    mutationFn: (body: { email: string; role: string }) =>
      api.post('/staff/invite', body).then(r => r.data),
    onSuccess: () => {
      toast.success('Invitation sent successfully');
      queryClient.invalidateQueries({ queryKey: ['staff-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
      setEmail('');
      setRole('ADMIN');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to send invitation');
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Invite Staff Member</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="staff@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && email.trim()) invite.mutate({ email, role }); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'ADMIN' | 'SUPER_ADMIN')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => invite.mutate({ email, role })}
            disabled={!email.trim() || invite.isPending}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2"
          >
            {invite.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Staff Members ───────────────────────────────────────────────────────

function StaffMembersTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: StaffMember[]; total: number; page: number; limit: number }>({
    queryKey: ['staff-members', page],
    queryFn: () => api.get(`/staff?page=${page}&limit=20`).then(r => r.data.data),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('Staff member removed');
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to remove staff member');
    },
  });

  function handleRemove(member: StaffMember) {
    const name = `${member.firstName} ${member.lastName}`.trim() || member.email;
    if (!window.confirm(`Remove ${name} from staff? They will be demoted to Customer.`)) return;
    remove.mutate(member.id);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const members = data?.data ?? [];
  const meta: PageMeta | undefined = data
    ? { total: data.total, page: data.page, limit: data.limit, totalPages: Math.ceil(data.total / data.limit) }
    : undefined;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Member</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Last Login</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-400">No staff members found.</td>
              </tr>
            ) : members.map(m => {
              const color = avatarColor(m.id);
              const name = `${m.firstName} ${m.lastName}`.trim() || m.email;
              return (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {initials(m.firstName, m.lastName, m.email)}
                      </div>
                      <span className="font-medium text-gray-900">{name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{m.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[m.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {m.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[m.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{fmtDateTime(m.lastLoginAt)}</td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(m.createdAt)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRemove(m)}
                      disabled={remove.isPending}
                      className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-40"
                      title="Remove staff member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {meta && <Pagination meta={meta} page={page} setPage={setPage} />}
    </div>
  );
}

// ── Tab: Invitations ─────────────────────────────────────────────────────────

function InvitationsTab() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: StaffInvitation[]; total: number; page: number; limit: number }>({
    queryKey: ['staff-invitations', page],
    queryFn: () => api.get(`/staff/invitations?page=${page}&limit=20`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const invitations = data?.data ?? [];
  const meta: PageMeta | undefined = data
    ? { total: data.total, page: data.page, limit: data.limit, totalPages: Math.ceil(data.total / data.limit) }
    : undefined;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Sent</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Expires</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-gray-400">No pending invitations.</td>
              </tr>
            ) : invitations.map(inv => {
              const expired = new Date(inv.expiresAt) < new Date();
              return (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-medium text-gray-900">{inv.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[inv.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {inv.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(inv.createdAt)}</td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(inv.expiresAt)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${expired ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {expired ? 'Expired' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      disabled
                      className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed"
                      title="Resend not yet implemented"
                    >
                      Resend
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {meta && <Pagination meta={meta} page={page} setPage={setPage} />}
    </div>
  );
}

// ── Tab: Audit Logs ──────────────────────────────────────────────────────────

function AuditLogsTab() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: AuditLog[]; total: number; page: number; limit: number }>({
    queryKey: ['staff-audit-logs', page],
    queryFn: () => api.get(`/staff/audit-logs?page=${page}&limit=20`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const logs = data?.data ?? [];
  const meta: PageMeta | undefined = data
    ? { total: data.total, page: data.page, limit: data.limit, totalPages: Math.ceil(data.total / data.limit) }
    : undefined;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Entity</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-gray-400">No audit log entries.</td>
              </tr>
            ) : logs.map(log => {
              const userName = log.user
                ? `${log.user.firstName ?? ''} ${log.user.lastName ?? ''}`.trim() || log.user.email
                : 'System';
              const entityLabel = log.entity ?? log.resource ?? '—';
              return (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{userName}</p>
                    {log.user?.email && (
                      <p className="text-xs text-gray-400">{log.user.email}</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{entityLabel}</td>
                  <td className="py-3 px-4 text-gray-500">{fmtDateTime(log.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {meta && <Pagination meta={meta} page={page} setPage={setPage} />}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'staff' | 'invitations' | 'audit';

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<Tab>('staff');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: stats } = useQuery<StaffStats>({
    queryKey: ['staff-stats'],
    queryFn: () => api.get('/staff/stats').then(r => r.data.data),
  });

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'staff', label: 'Staff Members', icon: Users },
    { key: 'invitations', label: 'Invitations', icon: Mail },
    { key: 'audit', label: 'Audit Logs', icon: ClipboardList },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage admin staff, invitations and activity logs</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Invite Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {([
          { label: 'Total Staff',         value: stats?.totalStaff,          icon: Users,         color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending Invitations', value: stats?.pendingInvitations,   icon: Clock,         color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Audit Log Entries',   value: stats?.auditLogCount,        icon: ClipboardList, color: 'bg-purple-50 text-purple-600' },
        ] as const).map(card => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100 px-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === 'staff'       && <StaffMembersTab />}
          {activeTab === 'invitations' && <InvitationsTab />}
          {activeTab === 'audit'       && <AuditLogsTab />}
        </div>
      </div>

      <InviteModal open={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </div>
  );
}
