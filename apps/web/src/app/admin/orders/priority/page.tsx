'use client';

import { useState } from 'react';
import { Flag, Clock, Zap, AlertTriangle, Package, Truck, CheckCircle, Filter } from 'lucide-react';

type Priority = 'urgent' | 'high' | 'normal' | 'low';

interface Order {
  id: string;
  customer: string;
  phone: string;
  items: number;
  total: number;
  priority: Priority;
  status: string;
  age: string;
  district: string;
  notes?: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  high:   { label: 'High',   color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  normal: { label: 'Normal', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  low:    { label: 'Low',    color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' },
};

const MOCK_ORDERS: Order[] = [
  { id: '#ORD-8841', customer: 'Rahim Ahmed', phone: '01711-234567', items: 3, total: 1800, priority: 'urgent', status: 'Pending', age: '2h 14m', district: 'Dhaka', notes: 'Gift — requested urgent delivery' },
  { id: '#ORD-8839', customer: 'Fatema Begum', phone: '01812-345678', items: 1, total: 650, priority: 'urgent', status: 'Processing', age: '3h 02m', district: 'Chittagong' },
  { id: '#ORD-8837', customer: 'Karim Mia', phone: '01934-567890', items: 5, total: 3200, priority: 'high', status: 'Pending', age: '4h 31m', district: 'Sylhet', notes: 'Bulk order — school' },
  { id: '#ORD-8835', customer: 'Nasrin Sultana', phone: '01611-678901', items: 2, total: 980, priority: 'high', status: 'Awaiting Payment', age: '5h 45m', district: 'Rajshahi' },
  { id: '#ORD-8832', customer: 'Anwar Hossain', phone: '01755-789012', items: 1, total: 420, priority: 'normal', status: 'Pending', age: '7h 12m', district: 'Dhaka' },
  { id: '#ORD-8831', customer: 'Roksana Khatun', phone: '01866-890123', items: 4, total: 2100, priority: 'normal', status: 'Processing', age: '8h 33m', district: 'Comilla' },
  { id: '#ORD-8829', customer: 'Jamal Uddin', phone: '01977-901234', items: 1, total: 340, priority: 'low', status: 'Pending', age: '12h 08m', district: 'Barisal' },
  { id: '#ORD-8825', customer: 'Parveen Akter', phone: '01588-012345', items: 2, total: 780, priority: 'low', status: 'Awaiting Payment', age: '1d 2h', district: 'Mymensingh' },
];

export default function OrderPriorityPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [filter, setFilter] = useState<Priority | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const displayed = filter === 'all' ? orders : orders.filter(o => o.priority === filter);
  const counts = { urgent: 0, high: 0, normal: 0, low: 0 };
  orders.forEach(o => counts[o.priority]++);

  const setPriority = (id: string, priority: Priority) => {
    setOrders(os => os.map(o => o.id === id ? { ...o, priority } : o));
  };

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const bulkSetPriority = (priority: Priority) => {
    setOrders(os => os.map(o => selected.has(o.id) ? { ...o, priority } : o));
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Flag className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Order Priority Management</h2>
            <p className="text-xs text-muted-foreground">Flag and manage urgent orders for faster fulfillment</p>
          </div>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
              <button
                key={p}
                onClick={() => bulkSetPriority(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} ${PRIORITY_CONFIG[p].border}`}
              >
                Set {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className={`bg-white rounded-xl border p-4 shadow-sm text-left transition-all ${filter === key ? `ring-2 ring-offset-1 ${key === 'urgent' ? 'ring-red-400' : key === 'high' ? 'ring-orange-400' : key === 'normal' ? 'ring-blue-400' : 'ring-gray-400'}` : 'hover:shadow-md'}`}
          >
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color} ${cfg.border} border mb-2`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </div>
            <p className="text-3xl font-black">{counts[key]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">orders</p>
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">
            {filter === 'all' ? 'All Orders' : `${PRIORITY_CONFIG[filter].label} Priority`} — {displayed.length} orders
          </span>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="ml-auto text-xs text-primary hover:underline">Clear filter</button>
          )}
        </div>
        <div className="divide-y">
          {displayed.map(order => {
            const cfg = PRIORITY_CONFIG[order.priority];
            const isSelected = selected.has(order.id);
            return (
              <div key={order.id} className={`flex items-start gap-4 p-4 transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-gray-50'} ${order.priority === 'urgent' ? 'border-l-4 border-l-red-500' : order.priority === 'high' ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-transparent'}`}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(order.id)}
                  className="mt-1 accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-sm">{order.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{order.status}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                      <Clock className="h-3 w-3" />{order.age} old
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-0.5 text-sm">
                    <span className="font-medium">{order.customer}</span>
                    <span className="text-muted-foreground">{order.phone}</span>
                    <span className="text-muted-foreground">{order.items} item{order.items > 1 ? 's' : ''} · ৳{order.total.toLocaleString()}</span>
                    <span className="text-muted-foreground">{order.district}</span>
                  </div>
                  {order.notes && (
                    <p className="mt-1 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 inline-block">{order.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).filter(p => p !== order.priority).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(order.id, p)}
                      title={`Set ${PRIORITY_CONFIG[p].label}`}
                      className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot} opacity-40 hover:opacity-100 transition-opacity`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
