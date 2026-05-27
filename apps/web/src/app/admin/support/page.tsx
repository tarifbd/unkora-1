'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, Search, Filter, Clock, CheckCircle, XCircle,
  AlertTriangle, ChevronRight, User, Send, Loader2, RefreshCw,
  Tag, ArrowUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/lib/hooks/use-admin-auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

function apiFetch(path: string, token: string, opts: RequestInit = {}) {
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) },
  }).then(r => r.json());
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Clock },
  WAITING_CUSTOMER: { label: 'Waiting', color: 'bg-purple-100 text-purple-700', icon: Clock },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

export default function SupportPage() {
  const { token } = useAdminAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['support-stats'],
    queryFn: () => apiFetch('/support/admin/stats', token),
    enabled: !!token,
    select: r => r.data ?? r,
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['support-tickets', search, statusFilter, priorityFilter],
    queryFn: () => {
      const p = new URLSearchParams({ limit: '50' });
      if (search) p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      if (priorityFilter) p.set('priority', priorityFilter);
      return apiFetch(`/support/admin/tickets?${p}`, token);
    },
    enabled: !!token,
    select: r => r.data ?? r,
  });

  const { data: ticketDetail } = useQuery({
    queryKey: ['ticket-detail', selectedTicket?.id],
    queryFn: () => apiFetch(`/support/admin/tickets/${selectedTicket.id}`, token),
    enabled: !!selectedTicket?.id,
    select: r => r.data ?? r,
  });

  const updateMutation = useMutation({
    mutationFn: (dto: { id: string; status?: string; priority?: string }) =>
      apiFetch(`/support/admin/tickets/${dto.id}`, token, { method: 'PATCH', body: JSON.stringify(dto) }),
    onSuccess: () => {
      toast.success('Ticket updated');
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket-detail', selectedTicket?.id] });
      qc.invalidateQueries({ queryKey: ['support-stats'] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: (dto: { id: string; message: string }) =>
      apiFetch(`/support/admin/tickets/${dto.id}/messages`, token, { method: 'POST', body: JSON.stringify({ message: dto.message }) }),
    onSuccess: () => {
      toast.success('Reply sent');
      setReplyText('');
      qc.invalidateQueries({ queryKey: ['ticket-detail', selectedTicket?.id] });
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });

  const tickets = ticketsData?.data ?? [];

  return (
    <div className="p-4 lg:p-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-sm text-gray-500">Manage customer support requests</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Open', value: stats.open, color: 'text-blue-600 bg-blue-50' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600 bg-amber-50' },
            { label: 'Waiting', value: stats.waitingCustomer, color: 'text-purple-600 bg-purple-50' },
            { label: 'Resolved', value: stats.resolved, color: 'text-green-600 bg-green-50' },
            { label: 'Closed', value: stats.closed, color: 'text-gray-600 bg-gray-50' },
            { label: 'Urgent', value: stats.urgent, color: 'text-red-600 bg-red-50' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
              <div className={`text-2xl font-black ${s.color.split(' ')[0]}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-280px)]">
        {/* Left: Ticket List */}
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col">
          {/* Filters */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tickets..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-2 focus:outline-none"
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No tickets found</div>
            ) : (
              tickets.map((ticket: any) => {
                const statusCfg = STATUS_CONFIG[ticket.status] ?? { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: MessageSquare };
                const priorityCfg = PRIORITY_CONFIG[ticket.priority] ?? { label: 'Medium', color: 'bg-blue-100 text-blue-700' };
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</span>
                          {ticket.priority === 'URGENT' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{ticket.subject}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {ticket.user?.firstName} {ticket.user?.lastName} · {ticket.user?.email}
                        </p>
                        {ticket.messages?.[0] && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{ticket.messages[0].message}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-gray-400">
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </span>
                      {ticket._count?.messages && (
                        <span className="text-[10px] text-gray-400">{ticket._count.messages} messages</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Ticket Detail */}
        <div className="hidden lg:flex flex-1 flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a ticket to view</p>
              </div>
            </div>
          ) : (
            <>
              {/* Ticket Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{selectedTicket.ticketNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(STATUS_CONFIG[ticketDetail?.status ?? selectedTicket.status] ?? { color: 'bg-blue-100 text-blue-700', label: 'Open' }).color}`}>
                        {(STATUS_CONFIG[ticketDetail?.status ?? selectedTicket.status] ?? { color: 'bg-blue-100 text-blue-700', label: 'Open' }).label}
                      </span>
                    </div>
                    <h2 className="font-bold text-gray-900 dark:text-white">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>{selectedTicket.user?.firstName} {selectedTicket.user?.lastName} ({selectedTicket.user?.email})</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={ticketDetail?.status ?? selectedTicket.status}
                      onChange={e => updateMutation.mutate({ id: selectedTicket.id, status: e.target.value })}
                      className="text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <select
                      value={ticketDetail?.priority ?? selectedTicket.priority}
                      onChange={e => updateMutation.mutate({ id: selectedTicket.id, priority: e.target.value })}
                      className="text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-gray-900 dark:text-white"
                    >
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {ticketDetail?.messages?.map((msg: any) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.senderRole === 'admin' ? 'flex-row-reverse' : ''}`}>
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {msg.sender?.firstName?.[0]}{msg.sender?.lastName?.[0]}
                    </div>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.senderRole === 'admin'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${msg.senderRole === 'admin' ? 'text-blue-200' : 'text-gray-500'}`}>
                          {msg.sender?.firstName} {msg.sender?.lastName}
                          {msg.senderRole === 'admin' && ' (Support)'}
                        </span>
                        <span className={`text-[10px] ${msg.senderRole === 'admin' ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && replyText.trim()) {
                        replyMutation.mutate({ id: selectedTicket.id, message: replyText });
                      }
                    }}
                  />
                  <button
                    onClick={() => replyMutation.mutate({ id: selectedTicket.id, message: replyText })}
                    disabled={!replyText.trim() || replyMutation.isPending}
                    className="flex-shrink-0 h-full px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="text-sm font-semibold hidden sm:inline">Send</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Press Ctrl+Enter to send</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
