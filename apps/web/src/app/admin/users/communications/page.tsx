'use client';

import { useState } from 'react';
import { MessageSquare, Mail, Phone, Search, Filter, Send, Eye, ChevronDown, Clock } from 'lucide-react';

type Channel = 'all' | 'sms' | 'email' | 'whatsapp' | 'call';

interface Message {
  id: string;
  customer: string;
  phone: string;
  channel: 'sms' | 'email' | 'whatsapp' | 'call';
  subject: string;
  preview: string;
  time: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  direction: 'out' | 'in';
}

const CHANNEL_CONFIG = {
  sms: { label: 'SMS', color: 'bg-green-100 text-green-700', icon: MessageSquare },
  email: { label: 'Email', color: 'bg-blue-100 text-blue-700', icon: Mail },
  whatsapp: { label: 'WhatsApp', color: 'bg-emerald-100 text-emerald-700', icon: MessageSquare },
  call: { label: 'Call', color: 'bg-purple-100 text-purple-700', icon: Phone },
};

const STATUS_CONFIG = {
  sent: { label: 'Sent', color: 'text-gray-500' },
  delivered: { label: 'Delivered', color: 'text-blue-500' },
  opened: { label: 'Opened', color: 'text-green-500' },
  clicked: { label: 'Clicked', color: 'text-indigo-500' },
  failed: { label: 'Failed', color: 'text-red-500' },
};

const MOCK_MESSAGES: Message[] = [
  { id: '1', customer: 'Rahim Ahmed', phone: '01711-234567', channel: 'sms', subject: 'Order Confirmation', preview: 'আপনার অর্ডার #ORD-8841 নিশ্চিত হয়েছে। ডেলিভারি: ৩-৫ কার্যদিবস।', time: '11:53 AM', status: 'delivered', direction: 'out' },
  { id: '2', customer: 'Rahim Ahmed', phone: '01711-234567', channel: 'email', subject: 'Order #ORD-8841 Confirmed', preview: 'Dear Rahim, your order has been placed successfully...', time: '11:54 AM', status: 'opened', direction: 'out' },
  { id: '3', customer: 'Fatema Begum', phone: '01812-345678', channel: 'sms', subject: 'Shipping Update', preview: 'আপনার বই পাঠানো হয়েছে। ট্র্যাকিং: PATH-9841234', time: 'Jun 7, 3:00 PM', status: 'delivered', direction: 'out' },
  { id: '4', customer: 'Fatema Begum', phone: '01812-345678', channel: 'whatsapp', subject: 'Delivery Query', preview: 'আমার বই কখন আসবে?', time: 'Jun 8, 10:00 AM', status: 'opened', direction: 'in' },
  { id: '5', customer: 'Fatema Begum', phone: '01812-345678', channel: 'whatsapp', subject: 'Support Reply', preview: 'আপনার বই আজকের মধ্যে পৌঁছে যাবে। ট্র্যাক করুন: ...', time: 'Jun 8, 10:30 AM', status: 'delivered', direction: 'out' },
  { id: '6', customer: 'Karim Mia', phone: '01934-567890', channel: 'email', subject: 'Win-back: Missing You!', preview: 'Hi Karim, it\'s been a while. Here\'s 10% off your next order...', time: 'Jun 5, 10:00 AM', status: 'clicked', direction: 'out' },
  { id: '7', customer: 'Nasrin Sultana', phone: '01611-678901', channel: 'email', subject: 'Wishlist Reminder', preview: 'Nasrin, you have 2 items in your wishlist. Stock is running low...', time: 'Apr 25, 10:00 AM', status: 'sent', direction: 'out' },
  { id: '8', customer: 'Anwar Hossain', phone: '01755-789012', channel: 'sms', subject: 'Payment Reminder', preview: 'আপনার অর্ডার #ORD-8831 পেমেন্ট বাকি আছে। পেমেন্ট করুন: ...', time: 'Jun 8, 9:00 AM', status: 'failed', direction: 'out' },
];

const customers = [...new Set(MOCK_MESSAGES.map(m => m.customer))];

export default function CommunicationsPage() {
  const [channelFilter, setChannelFilter] = useState<Channel>('all');
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const filtered = MOCK_MESSAGES.filter(m =>
    (channelFilter === 'all' || m.channel === channelFilter) &&
    (search === '' || m.customer.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase())) &&
    (selectedCustomer === null || m.customer === selectedCustomer)
  );

  const stats = {
    total: MOCK_MESSAGES.length,
    openRate: Math.round(MOCK_MESSAGES.filter(m => m.status === 'opened' || m.status === 'clicked').length / MOCK_MESSAGES.filter(m => m.direction === 'out').length * 100),
    clickRate: Math.round(MOCK_MESSAGES.filter(m => m.status === 'clicked').length / MOCK_MESSAGES.filter(m => m.direction === 'out').length * 100),
    failed: MOCK_MESSAGES.filter(m => m.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Communication History</h2>
            <p className="text-xs text-muted-foreground">All messages sent/received across SMS, email, and WhatsApp</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-bold hover:bg-primary/90 transition-colors">
          <Send className="h-4 w-4" /> New Message
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Messages', value: stats.total, color: 'text-gray-900' },
          { label: 'Open Rate', value: `${stats.openRate}%`, color: 'text-green-600' },
          { label: 'Click Rate', value: `${stats.clickRate}%`, color: 'text-indigo-600' },
          { label: 'Failed Deliveries', value: stats.failed, color: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="pl-9 pr-3 py-2 rounded-lg border text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex rounded-lg border overflow-hidden text-xs">
          {(['all', 'sms', 'email', 'whatsapp', 'call'] as Channel[]).map(c => (
            <button key={c} onClick={() => setChannelFilter(c)}
              className={`px-3 py-1.5 font-medium capitalize whitespace-nowrap transition-colors ${channelFilter === c ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'}`}>
              {c}
            </button>
          ))}
        </div>
        <select
          value={selectedCustomer ?? ''}
          onChange={e => setSelectedCustomer(e.target.value || null)}
          className="text-sm border rounded-lg px-3 py-2 bg-transparent"
        >
          <option value="">All customers</option>
          {customers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Messages table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-muted-foreground uppercase border-b">
              <tr>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Channel</th>
                <th className="px-5 py-3 text-left">Subject / Message</th>
                <th className="px-5 py-3 text-center">Direction</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(m => {
                const ch = CHANNEL_CONFIG[m.channel];
                const st = STATUS_CONFIG[m.status];
                const ChIcon = ch.icon;
                return (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{m.customer}</p>
                      <p className="text-xs text-muted-foreground">{m.phone}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${ch.color}`}>
                        <ChIcon className="h-3 w-3" />{ch.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      <p className="font-medium truncate">{m.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.preview}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.direction === 'out' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
                        {m.direction === 'out' ? 'Outbound' : 'Inbound'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-semibold ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">{m.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">No messages found</div>
        )}
      </div>
    </div>
  );
}
