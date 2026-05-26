'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Monitor, ShoppingCart, DollarSign, Package, Plus, Minus,
  Trash2, CreditCard, Banknote, Loader2, CheckCircle2, X,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface PosItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

interface PosDashboard {
  todaySales: number;
  todayOrders: number;
  openSessions: number;
  totalOrders: number;
}

const posApi = {
  getDashboard: () => api.get('/pos/dashboard').then(r => r.data.data as PosDashboard),
  openSession: (openingCash: number) => api.post('/pos/sessions/open', { openingCash }).then(r => r.data.data),
  closeSession: (id: string, closingCash: number) => api.patch(`/pos/sessions/${id}/close`, { closingCash }).then(r => r.data.data),
  getSessions: (page = 1) => api.get('/pos/sessions', { params: { page } }).then(r => r.data.data),
  createOrder: (sessionId: string, data: object) => api.post(`/pos/sessions/${sessionId}/orders`, data).then(r => r.data.data),
};

const productSearchApi = {
  search: (q: string) => api.get('/products/admin', { params: { search: q, limit: 10 } }).then(r => r.data.data),
};

export default function PosPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'terminal' | 'sessions'>('terminal');
  const [cart, setCart] = useState<PosItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [orderDone, setOrderDone] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [openingCash, setOpeningCash] = useState('0');

  const { data: dashboard } = useQuery({ queryKey: ['pos-dashboard'], queryFn: posApi.getDashboard });
  const { data: sessionData } = useQuery({ queryKey: ['pos-sessions'], queryFn: () => posApi.getSessions() });

  const { data: searchResults } = useQuery({
    queryKey: ['pos-search', searchQuery],
    queryFn: () => productSearchApi.search(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const openSession = useMutation({
    mutationFn: () => posApi.openSession(Number(openingCash)),
    onSuccess: (data) => { setActiveSession(data.id); qc.invalidateQueries({ queryKey: ['pos-sessions'] }); },
  });

  const placeOrder = useMutation({
    mutationFn: () => posApi.createOrder(activeSession!, {
      paymentMethod,
      items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.price })),
      amountPaid: Number(amountPaid),
    }),
    onSuccess: (data) => {
      setOrderDone(data);
      setCart([]);
      setAmountPaid('');
      qc.invalidateQueries({ queryKey: ['pos-dashboard'] });
    },
  });

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, price: Number(product.salePrice ?? product.basePrice), quantity: 1 }];
    });
    setSearchQuery('');
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const change = Number(amountPaid) - subtotal;

  if (orderDone) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Sale Complete!</h2>
          <p className="text-muted-foreground">Order #{orderDone.orderNumber}</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(Number(orderDone.total))}</p>
          {Number(orderDone.change) > 0 && (
            <p className="text-lg text-green-600">Change: {formatCurrency(Number(orderDone.change))}</p>
          )}
          <button onClick={() => setOrderDone(null)} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <p className="text-sm text-muted-foreground">In-store sales terminal</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('terminal')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'terminal' ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
            Terminal
          </button>
          <button onClick={() => setActiveTab('sessions')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'sessions' ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'}`}>
            Sessions
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Today's Sales", value: formatCurrency(dashboard?.todaySales ?? 0), icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: "Today's Orders", value: dashboard?.todayOrders ?? 0, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
          { label: 'Open Sessions', value: dashboard?.openSessions ?? 0, icon: Monitor, color: 'text-purple-600 bg-purple-50' },
          { label: 'Total POS Orders', value: dashboard?.totalOrders ?? 0, icon: Package, color: 'text-orange-600 bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'terminal' ? (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Product Search */}
          <div className="lg:col-span-3 space-y-3">
            {!activeSession ? (
              <div className="rounded-xl border bg-card p-6 text-center space-y-3">
                <Monitor className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="font-semibold">No Active Session</h3>
                <p className="text-sm text-muted-foreground">Open a session to start selling</p>
                <div className="flex items-center justify-center gap-3">
                  <input
                    type="number"
                    className="rounded-lg border bg-background px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={openingCash}
                    onChange={e => setOpeningCash(e.target.value)}
                    placeholder="Opening cash"
                  />
                  <button onClick={() => openSession.mutate()} disabled={openSession.isPending}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    {openSession.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Open Session
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Search product by name or SKU..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && searchResults?.data?.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 rounded-xl border bg-card shadow-xl overflow-hidden">
                      {searchResults.data.slice(0, 6).map((p: any) => (
                        <button key={p.id} onClick={() => addToCart(p)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent text-left">
                          {p.images?.[0] && <img src={p.images[0].url} className="h-8 w-8 rounded object-cover" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                          <p className="text-sm font-bold text-primary shrink-0">
                            {formatCurrency(Number(p.salePrice ?? p.basePrice))}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Items */}
                <div className="rounded-xl border bg-card overflow-hidden">
                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <ShoppingCart className="mx-auto h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm">Cart is empty. Search for products above.</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Product</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Qty</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Price</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Total</th>
                          <th className="px-2 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {cart.map(item => (
                          <tr key={item.productId}>
                            <td className="px-3 py-2">
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.sku}</p>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => updateQty(item.productId, -1)} className="rounded p-0.5 hover:bg-accent"><Minus className="h-3 w-3" /></button>
                                <span className="w-6 text-center text-sm">{item.quantity}</span>
                                <button onClick={() => updateQty(item.productId, 1)} className="rounded p-0.5 hover:bg-accent"><Plus className="h-3 w-3" /></button>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right text-sm">{formatCurrency(item.price)}</td>
                            <td className="px-3 py-2 text-right text-sm font-bold">{formatCurrency(item.price * item.quantity)}</td>
                            <td className="px-2 py-2">
                              <button onClick={() => setCart(c => c.filter(i => i.productId !== item.productId))}
                                className="rounded p-1 hover:bg-red-50 text-muted-foreground hover:text-red-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Payment Panel */}
          {activeSession && (
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border bg-card p-5 space-y-4">
                <h2 className="font-semibold">Payment</h2>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between border-t pt-1 font-bold text-base"><span>Total</span><span className="text-primary">{formatCurrency(subtotal)}</span></div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'CASH', label: 'Cash', icon: Banknote },
                      { value: 'CARD', label: 'Card', icon: CreditCard },
                      { value: 'BKASH', label: 'bKash', icon: DollarSign },
                    ].map(m => (
                      <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${paymentMethod === m.value ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent'}`}>
                        <m.icon className="h-4 w-4" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount Paid (৳)</label>
                  <input type="number" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={amountPaid} onChange={e => setAmountPaid(e.target.value)} min={0} />
                  {Number(amountPaid) > 0 && (
                    <p className={`text-sm mt-1 font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change >= 0 ? `Change: ${formatCurrency(change)}` : `Shortfall: ${formatCurrency(Math.abs(change))}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => placeOrder.mutate()}
                  disabled={placeOrder.isPending || cart.length === 0 || !amountPaid || Number(amountPaid) < subtotal}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-40">
                  {placeOrder.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Complete Sale
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Sessions Table */
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Cashier</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Opened</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Closed</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Sales</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Orders</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(sessionData?.data ?? []).map((s: any) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm font-medium">{s.cashier?.firstName} {s.cashier?.lastName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.openedAt).toLocaleString('en-BD')}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.closedAt ? new Date(s.closedAt).toLocaleString('en-BD') : '—'}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold">{formatCurrency(Number(s.totalSales))}</td>
                  <td className="px-4 py-3 text-center text-sm">{s._count?.orders ?? s.totalOrders}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
