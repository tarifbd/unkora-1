'use client';

import { useState } from 'react';
import { Megaphone, Plus, Play, Pause, Mail, MessageSquare, Bell, Users, TrendingUp, DollarSign, Eye, MousePointer, Calendar, Filter, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type CampaignStatus = 'active' | 'scheduled' | 'draft' | 'completed' | 'paused';
type CampaignChannel = 'email' | 'sms' | 'push' | 'whatsapp';

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channel: CampaignChannel;
  audience: string;
  sent: number;
  opened: number;
  clicked: number;
  revenue: number;
  startDate: string;
  endDate?: string;
}

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: 'Active', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
  scheduled: { label: 'Scheduled', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  draft: { label: 'Draft', color: 'text-gray-500', bg: 'bg-gray-50', dot: 'bg-gray-400' },
  completed: { label: 'Completed', color: 'text-purple-600', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  paused: { label: 'Paused', color: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
};

const CHANNEL_CONFIG: Record<CampaignChannel, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
  push: { label: 'Push', icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

const CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Eid-ul-Adha Flash Sale', status: 'active', channel: 'email', audience: 'All subscribers', sent: 12400, opened: 5208, clicked: 1984, revenue: 284000, startDate: 'Jun 8', endDate: 'Jun 15' },
  { id: '2', name: 'Win-back: 30 Day Inactive', status: 'active', channel: 'sms', audience: 'At-Risk segment', sent: 4512, opened: 2256, clicked: 678, revenue: 87400, startDate: 'Jun 5' },
  { id: '3', name: 'New Arrivals — June', status: 'scheduled', channel: 'push', audience: 'App users', sent: 0, opened: 0, clicked: 0, revenue: 0, startDate: 'Jun 10' },
  { id: '4', name: 'Academic Season Promo', status: 'completed', channel: 'email', audience: 'Academic buyers', sent: 8234, opened: 3705, clicked: 1482, revenue: 198000, startDate: 'May 20', endDate: 'May 31' },
  { id: '5', name: 'VIP Early Access', status: 'completed', channel: 'whatsapp', audience: 'Champion customers', sent: 342, opened: 312, clicked: 289, revenue: 142000, startDate: 'May 15', endDate: 'May 18' },
  { id: '6', name: 'Cart Abandonment Series', status: 'active', channel: 'email', audience: 'Cart abandonners', sent: 2891, opened: 1156, clicked: 578, revenue: 123400, startDate: 'Jun 1' },
  { id: '7', name: 'Ramadan Offer Draft', status: 'draft', channel: 'sms', audience: 'All subscribers', sent: 0, opened: 0, clicked: 0, revenue: 0, startDate: 'TBD' },
];

const performanceData = CAMPAIGNS.filter(c => c.sent > 0).map(c => ({
  name: c.name.length > 20 ? c.name.slice(0, 18) + '…' : c.name,
  openRate: Math.round(c.opened / c.sent * 100),
  clickRate: Math.round(c.clicked / c.sent * 100),
  revenue: Math.round(c.revenue / 1000),
}));

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<CampaignChannel | 'all'>('all');

  const filtered = CAMPAIGNS.filter(c =>
    (statusFilter === 'all' || c.status === statusFilter) &&
    (channelFilter === 'all' || c.channel === channelFilter)
  );

  const totalRevenue = CAMPAIGNS.reduce((s, c) => s + c.revenue, 0);
  const totalSent = CAMPAIGNS.reduce((s, c) => s + c.sent, 0);
  const avgOpenRate = Math.round(CAMPAIGNS.filter(c => c.sent > 0).reduce((s, c) => s + c.opened / c.sent, 0) / CAMPAIGNS.filter(c => c.sent > 0).length * 100);
  const avgClickRate = Math.round(CAMPAIGNS.filter(c => c.sent > 0).reduce((s, c) => s + c.clicked / c.sent, 0) / CAMPAIGNS.filter(c => c.sent > 0).length * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Campaign Management</h2>
            <p className="text-xs text-muted-foreground">Email, SMS, push, and WhatsApp marketing campaigns</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `৳${(totalRevenue / 1000).toFixed(0)}k`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Messages Sent', value: totalSent.toLocaleString(), icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Open Rate', value: `${avgOpenRate}%`, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Click Rate', value: `${avgClickRate}%`, icon: MousePointer, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className={`${s.bg} rounded-lg p-2 w-fit mb-2`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Performance chart */}
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h3 className="font-bold text-sm mb-4">Campaign Performance — Open & Click Rates</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={performanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 10 }} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
            <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="openRate" fill="#6366f1" radius={[0, 3, 3, 0]} name="Open Rate" />
            <Bar dataKey="clickRate" fill="#10b981" radius={[0, 3, 3, 0]} name="Click Rate" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border overflow-hidden text-xs">
          {(['all', 'active', 'scheduled', 'completed', 'draft', 'paused'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 font-medium capitalize whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border overflow-hidden text-xs">
          {(['all', 'email', 'sms', 'push', 'whatsapp'] as const).map(c => (
            <button key={c} onClick={() => setChannelFilter(c)}
              className={`px-3 py-1.5 font-medium capitalize whitespace-nowrap transition-colors ${channelFilter === c ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-muted-foreground uppercase border-b">
              <tr>
                <th className="px-5 py-3 text-left">Campaign</th>
                <th className="px-5 py-3 text-left">Channel</th>
                <th className="px-5 py-3 text-left">Audience</th>
                <th className="px-5 py-3 text-right">Sent</th>
                <th className="px-5 py-3 text-right">Open Rate</th>
                <th className="px-5 py-3 text-right">Click Rate</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(c => {
                const sc = STATUS_CONFIG[c.status];
                const ch = CHANNEL_CONFIG[c.channel];
                const ChIcon = ch.icon;
                const openRate = c.sent > 0 ? (c.opened / c.sent * 100).toFixed(1) : '—';
                const clickRate = c.sent > 0 ? (c.clicked / c.sent * 100).toFixed(1) : '—';
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {c.startDate}{c.endDate ? ` – ${c.endDate}` : ''}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${ch.bg} ${ch.color}`}>
                        <ChIcon className="h-3 w-3" />{ch.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{c.audience}</td>
                    <td className="px-5 py-3 text-right">{c.sent > 0 ? c.sent.toLocaleString() : '—'}</td>
                    <td className="px-5 py-3 text-right font-semibold">{openRate}{c.sent > 0 ? '%' : ''}</td>
                    <td className="px-5 py-3 text-right font-semibold">{clickRate}{c.sent > 0 ? '%' : ''}</td>
                    <td className="px-5 py-3 text-right font-bold text-green-600">{c.revenue > 0 ? `৳${(c.revenue/1000).toFixed(0)}k` : '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${sc.bg} ${sc.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">No campaigns found</div>
        )}
      </div>
    </div>
  );
}
