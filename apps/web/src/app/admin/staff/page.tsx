'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Mail, ShieldCheck, Loader2, UserMinus,
  Send, ClipboardList, CheckCircle2, Clock, X,
} from 'lucide-react';
import api from '@/lib/api';

// ─── API helpers ──────────────────────────────────────────────

const staffApi = {
  getStaff: () => api.get('/staff').then(r => r.data.data),
  getStats: () => api.get('/staff/stats').then(r => r.data.data),
  invite: (data: { email: string; role: string }) => api.post('/staff/invite', data).then(r => r.data.data),
  remove: (id: string) => api.delete(`/staff/${id}`).then(r => r.data.data),
  getAuditLogs: () => api.get('/staff/audit-logs').then(r => r.data.data),
  getInvitations: () => api.get('/staff/invitations').then(r => r.data.data),
};

// ─── Types ────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

interface Stats { totalStaff: number; pendingInvitations: number; auditLogCount: number; }

// ─── Shared UI ────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {children}
    </span>
  );
}

const roleColor: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN:       'bg-blue-100 text-blue-700',
  CUSTOMER:    'bg-gray-100 text-gray-500',
};

function initials(first: string, last: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

// ─── Staff Tab ────────────────────────────────────────────────

function StaffTab() {
  const qc = useQueryClient();
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['staff-list'],
    queryFn: staffApi.getStaff,
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-list'] });
      qc.invalidateQueries({ queryKey: ['staff-stats'] });
      setConfirmRemove(null);
    },
  });

  const members: StaffMember[] = data?.data ?? [];

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Invite Form */}
      <InviteForm />

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Staff Member</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Last Login</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map(m => (
              <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                      {initials(m.firstName, m.lastName)}
                    </div>
                    <div>
                      <p className="font-medium">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge color={roleColor[m.role] ?? 'bg-gray-100 text-gray-600'}>{m.role.replace('_', ' ')}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {m.role !== 'SUPER_ADMIN' && (
                    confirmRemove === m.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => removeMut.mutate(m.id)}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700">
                          Confirm
                        </button>
                        <button onClick={() => setConfirmRemove(null)}
                          className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-accent">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmRemove(m.id)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <UserMinus className="h-3.5 w-3.5" /> Remove
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No staff members found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Invite Form ──────────────────────────────────────────────

function InviteForm() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [success, setSuccess] = useState(false);

  const inviteMut = useMutation({
    mutationFn: () => staffApi.invite({ email, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-invitations'] });
      qc.invalidateQueries({ queryKey: ['staff-stats'] });
      setEmail('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="font-semibold text-sm mb-3">Invite New Staff Member</p>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="staff@example.com"
          className="flex-1 min-w-48 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        <button
          onClick={() => inviteMut.mutate()}
          disabled={!email || inviteMut.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {inviteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send Invite
        </button>
        {success && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Invitation sent!
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Invitations Tab ──────────────────────────────────────────

function InvitationsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['staff-invitations'],
    queryFn: staffApi.getInvitations,
  });

  const invitations: Invitation[] = data?.data ?? [];

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Role</th>
            <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Expires</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sent</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {invitations.map(inv => {
            const isExpired = new Date(inv.expiresAt) < new Date();
            const isUsed = !!inv.usedAt;
            return (
              <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{inv.email}</td>
                <td className="px-4 py-3">
                  <Badge color={roleColor[inv.role] ?? 'bg-gray-100'}>{inv.role.replace('_', ' ')}</Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  {isUsed ? (
                    <Badge color="bg-green-100 text-green-700">Used</Badge>
                  ) : isExpired ? (
                    <Badge color="bg-red-100 text-red-700">Expired</Badge>
                  ) : (
                    <Badge color="bg-yellow-100 text-yellow-700">Pending</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(inv.expiresAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
          {invitations.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No invitations sent yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Audit Log Tab ────────────────────────────────────────────

function AuditLogTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: staffApi.getAuditLogs,
  });

  const logs: AuditLog[] = data?.data ?? [];

  const actionColor: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN:  'bg-purple-100 text-purple-700',
    LOGOUT: 'bg-gray-100 text-gray-600',
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">User</th>
            <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Action</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Resource</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">IP</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0">
                    {initials(log.user.firstName, log.user.lastName)}
                  </div>
                  <div>
                    <p className="font-medium text-xs">{log.user.firstName} {log.user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{log.user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge color={actionColor[log.action] ?? 'bg-gray-100 text-gray-600'}>{log.action}</Badge>
              </td>
              <td className="px-4 py-3">
                <span className="font-medium">{log.resource}</span>
                {log.resourceId && <span className="ml-1 text-xs text-muted-foreground">#{log.resourceId.slice(0, 8)}</span>}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{log.ipAddress ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No audit logs yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function StaffPage() {
  const [tab, setTab] = useState<'staff' | 'invitations' | 'audit'>('staff');

  const { data: stats } = useQuery<Stats>({
    queryKey: ['staff-stats'],
    queryFn: staffApi.getStats,
  });

  const s = stats ?? { totalStaff: 0, pendingInvitations: 0, auditLogCount: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Staff Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage admin accounts, invitations, and audit logs</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Staff Members',       value: s.totalStaff,          icon: Users,         color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Invitations', value: s.pendingInvitations,   icon: Mail,          color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Audit Log Entries',   value: s.auditLogCount,        icon: ClipboardList, color: 'text-purple-600 bg-purple-50' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b">
        {([
          { id: 'staff',       label: 'Staff Members', icon: Users },
          { id: 'invitations', label: 'Invitations',   icon: Mail },
          { id: 'audit',       label: 'Audit Log',     icon: ClipboardList },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'staff'       && <StaffTab />}
      {tab === 'invitations' && <InvitationsTab />}
      {tab === 'audit'       && <AuditLogTab />}
    </div>
  );
}
