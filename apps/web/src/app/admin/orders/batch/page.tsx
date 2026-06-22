'use client';

import { useState } from 'react';
import { Layers, CheckSquare, Printer, Truck, Package, Download, RefreshCw, Search, Filter, ChevronDown } from 'lucide-react';

interface Order {
  id: string;
  customer: string;
  phone: string;
  district: string;
  items: number;
  total: number;
  status: string;
  courier: string;
  date: string;
}

const CUSTOMERS_LIST = ['Rahim Ahmed', 'Fatema Begum', 'Karim Mia', 'Nasrin Sultana', 'Anwar Hossain'] as const;
const DISTRICTS_LIST = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Comilla', 'Mymensingh'] as const;
const STATUSES_LIST = ['Pending', 'Processing', 'Packed'] as const;
const COURIERS_LIST = ['Pathao', 'Paperfly', 'Redx', 'Steadfast'] as const;

const MOCK_ORDERS: Order[] = Array.from({ length: 20 }, (_, i) => ({
  id: `#ORD-${8800 + i}`,
  customer: CUSTOMERS_LIST[i % 5] as string,
  phone: `0171${1 + i}-${100000 + i * 12345}`.slice(0, 14),
  district: DISTRICTS_LIST[i % 8] as string,
  items: Math.floor(Math.random() * 5) + 1,
  total: Math.floor(Math.random() * 3000) + 300,
  status: STATUSES_LIST[i % 3] as string,
  courier: COURIERS_LIST[i % 4] as string,
  date: `Jun ${8 - Math.floor(i / 4)}, 2026`,
}));

export default function BatchProcessingPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const filtered = orders.filter(o =>
    (statusFilter === 'All' || o.status === statusFilter) &&
    (o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()))
  );

  const allSelected = filtered.length > 0 && filtered.every(o => selected.has(o.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(s => { const n = new Set(s); filtered.forEach(o => n.delete(o.id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); filtered.forEach(o => n.add(o.id)); return n; });
    }
  };

  const toggle = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleBatch = (action: string) => {
    setProcessing(true);
    setTimeout(() => {
      if (action === 'mark_packed') {
        setOrders(os => os.map(o => selected.has(o.id) ? { ...o, status: 'Packed' } : o));
      } else if (action === 'mark_shipped') {
        setOrders(os => os.map(o => selected.has(o.id) ? { ...o, status: 'Shipped' } : o));
      }
      setSelected(new Set());
      setProcessing(false);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    }, 1200);
  };

  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Processing: 'bg-blue-50 text-blue-700 border-blue-200',
    Packed: 'bg-purple-50 text-purple-700 border-purple-200',
    Shipped: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Layers className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Order Batch Processing</h2>
            <p className="text-xs text-muted-foreground">Select multiple orders and perform bulk actions</p>
          </div>
        </div>
        {done && <div className="flex items-center gap-2 text-green-600 font-semibold text-sm"><CheckSquare className="h-4 w-4" /> Done!</div>}
      </div>

      {/* Batch actions bar */}
      {selected.size > 0 && (
        <div className="bg-indigo-600 rounded-xl p-4 flex items-center gap-4 text-white shadow-lg">
          <span className="font-bold text-sm">{selected.size} orders selected</span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              onClick={() => handleBatch('mark_packed')}
              disabled={processing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Mark Packed
            </button>
            <button
              onClick={() => handleBatch('mark_shipped')}
              disabled={processing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Truck className="h-4 w-4" /> Mark Shipped
            </button>
            <button
              onClick={() => handleBatch('print')}
              disabled={processing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Print Labels
            </button>
            <button
              onClick={() => handleBatch('export')}
              disabled={processing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order or customer..."
            className="pl-9 pr-3 py-2 rounded-lg border text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex rounded-lg border overflow-hidden text-xs">
          {['All', 'Pending', 'Processing', 'Packed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-muted-foreground uppercase border-b">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-primary" />
                </th>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">District</th>
                <th className="px-4 py-3 text-left">Courier</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(o => (
                <tr key={o.id} className={`hover:bg-gray-50 transition-colors ${selected.has(o.id) ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} className="accent-primary" />
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-xs">{o.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customer}</p>
                    <p className="text-xs text-muted-foreground">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.district}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{o.courier}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{o.items}</td>
                  <td className="px-4 py-3 text-right font-bold">৳{o.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-bold border px-2 py-0.5 rounded-full ${statusColors[o.status] ?? ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t bg-gray-50 text-xs text-muted-foreground flex items-center justify-between">
          <span>Showing {filtered.length} of {orders.length} orders</span>
          <span>{selected.size} selected</span>
        </div>
      </div>
    </div>
  );
}
