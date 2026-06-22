'use client';

import { useState } from 'react';
import { Users, TrendingUp, Target, Award, Search, Plus, Phone, Mail, MoreVertical, CheckCircle, XCircle, Clock, Star, BarChart2, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmpRole = 'admin' | 'manager' | 'agent' | 'support';
type EmpStatus = 'active' | 'inactive' | 'on_leave';

interface Employee {
  id: string;
  name: string;
  role: EmpRole;
  status: EmpStatus;
  phone: string;
  email: string;
  joinDate: string;
  ordersHandled: number;
  target: number;
  rating: number;
  avatar: string;
  department: string;
}

const EMPLOYEES: Employee[] = [
  { id: 'EMP-001', name: 'রহিম উদ্দিন', role: 'manager', status: 'active', phone: '01711-234567', email: 'rahim@shop.com', joinDate: '২০২৩ মার্চ', ordersHandled: 1240, target: 1200, rating: 4.8, avatar: 'র', department: 'অর্ডার ম্যানেজমেন্ট' },
  { id: 'EMP-002', name: 'সুমাইয়া বেগম', role: 'agent', status: 'active', phone: '01812-345678', email: 'sumaiya@shop.com', joinDate: '২০২৩ জুন', ordersHandled: 870, target: 1000, rating: 4.5, avatar: 'সু', department: 'কাস্টমার সাপোর্ট' },
  { id: 'EMP-003', name: 'কামাল হোসেন', role: 'agent', status: 'active', phone: '01913-456789', email: 'kamal@shop.com', joinDate: '২০২৩ আগস্ট', ordersHandled: 1050, target: 1000, rating: 4.7, avatar: 'কা', department: 'অর্ডার প্রক্রিয়াকরণ' },
  { id: 'EMP-004', name: 'নাজমা আক্তার', role: 'support', status: 'on_leave', phone: '01614-567890', email: 'najma@shop.com', joinDate: '২০২৩ অক্টোবর', ordersHandled: 630, target: 800, rating: 4.2, avatar: 'না', department: 'কাস্টমার সাপোর্ট' },
  { id: 'EMP-005', name: 'তারিক আহমেদ', role: 'agent', status: 'active', phone: '01515-678901', email: 'tariq@shop.com', joinDate: '২০২৪ জানুয়ারি', ordersHandled: 590, target: 800, rating: 4.3, avatar: 'তা', department: 'ডেলিভারি ট্র্যাকিং' },
  { id: 'EMP-006', name: 'শারমিন ইসলাম', role: 'admin', status: 'active', phone: '01316-789012', email: 'sharmin@shop.com', joinDate: '২০২২ ডিসেম্বর', ordersHandled: 2100, target: 2000, rating: 4.9, avatar: 'শা', department: 'অ্যাডমিন' },
  { id: 'EMP-007', name: 'আলামিন শেখ', role: 'support', status: 'inactive', phone: '01217-890123', email: 'alamin@shop.com', joinDate: '২০২৪ মার্চ', ordersHandled: 210, target: 600, rating: 3.8, avatar: 'আ', department: 'কাস্টমার সাপোর্ট' },
];

const ROLE_META: Record<EmpRole, { label: string; color: string; bg: string }> = {
  admin:   { label: 'অ্যাডমিন',  color: 'text-purple-700', bg: 'bg-purple-100' },
  manager: { label: 'ম্যানেজার', color: 'text-blue-700',   bg: 'bg-blue-100'   },
  agent:   { label: 'এজেন্ট',    color: 'text-indigo-700', bg: 'bg-indigo-100' },
  support: { label: 'সাপোর্ট',   color: 'text-cyan-700',   bg: 'bg-cyan-100'   },
};

const STATUS_META: Record<EmpStatus, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  active:   { label: 'সক্রিয়',       icon: CheckCircle, color: 'text-green-600', dot: 'bg-green-500' },
  inactive: { label: 'নিষ্ক্রিয়',    icon: XCircle,     color: 'text-red-500',   dot: 'bg-red-500'   },
  on_leave: { label: 'ছুটিতে আছেন', icon: Clock,       color: 'text-amber-600', dot: 'bg-amber-500' },
};

type SortKey = 'ordersHandled' | 'rating' | 'name';

function PerformanceBar({ value, target }: { value: number; target: number }) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{value.toLocaleString()} অর্ডার</span>
        <span className={cn('font-bold', pct >= 100 ? 'text-green-600' : pct >= 80 ? 'text-blue-600' : 'text-amber-600')}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-green-500' : pct >= 80 ? 'bg-blue-500' : 'bg-amber-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">লক্ষ্য: {target.toLocaleString()}</p>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn('w-3 h-3', i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
      ))}
      <span className="text-xs font-bold ml-1">{value}</span>
    </div>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<EmpRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EmpStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('ordersHandled');
  const [showAdd, setShowAdd] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = EMPLOYEES
    .filter(e => roleFilter === 'all' || e.role === roleFilter)
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => !search || e.name.includes(search) || e.id.toLowerCase().includes(search.toLowerCase()) || e.department.includes(search))
    .sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : b[sortBy] - a[sortBy]);

  const totalOrders = EMPLOYEES.reduce((s, e) => s + e.ordersHandled, 0);
  const avgRating = (EMPLOYEES.reduce((s, e) => s + e.rating, 0) / EMPLOYEES.length).toFixed(1);
  const onTarget = EMPLOYEES.filter(e => e.ordersHandled >= e.target).length;
  const activeCount = EMPLOYEES.filter(e => e.status === 'active').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold">Employee Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">কর্মী পরিচালনা ও পারফরম্যান্স ট্র্যাকিং</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> নতুন কর্মী যোগ করুন
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'মোট কর্মী',      value: EMPLOYEES.length,       sub: `${activeCount} সক্রিয়`,    icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'মোট অর্ডার',     value: totalOrders.toLocaleString(), sub: 'এই মাসে',           icon: BarChart2,  color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'গড় রেটিং',       value: avgRating,              sub: '৫.০ এর মধ্যে',           icon: Star,       color: 'text-amber-600',  bg: 'bg-amber-50' },
          { label: 'লক্ষ্য অর্জন',   value: `${onTarget}/${EMPLOYEES.length}`,  sub: 'কর্মী লক্ষ্য পূরণ', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-4 h-4', s.color)} />
                </div>
              </div>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম, ID বা বিভাগ..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'admin', 'manager', 'agent', 'support'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                roleFilter === r ? 'bg-primary text-primary-foreground' : 'border bg-card hover:border-primary/30')}>
              {r === 'all' ? 'সব ভূমিকা' : ROLE_META[r as EmpRole]?.label ?? r}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'on_leave', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'border bg-card hover:border-primary/30')}>
              {s === 'all' ? 'সব অবস্থা' : STATUS_META[s as EmpStatus]?.label ?? s}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
          className="px-3 py-2 rounded-lg border bg-card text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="ordersHandled">অর্ডার অনুযায়ী</option>
          <option value="rating">রেটিং অনুযায়ী</option>
          <option value="name">নাম অনুযায়ী</option>
        </select>
      </div>

      {/* Employee Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(emp => {
          const roleMeta = ROLE_META[emp.role];
          const statusMeta = STATUS_META[emp.status];
          const StatusIcon = statusMeta.icon;
          return (
            <div key={emp.id} className="rounded-xl border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-4 border-b bg-muted/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-black text-primary flex-shrink-0">
                      {emp.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{emp.name}</p>
                      <p className="text-[11px] text-muted-foreground">{emp.id} · {emp.department}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', roleMeta.color, roleMeta.bg)}>
                          {roleMeta.label}
                        </span>
                        <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold', statusMeta.color)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusMeta.dot)} />
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === emp.id ? null : emp.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {openMenuId === emp.id && (
                      <div className="absolute right-0 top-8 z-10 w-36 rounded-xl border bg-card shadow-lg py-1">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors">
                          <Edit2 className="w-3 h-3" /> সম্পাদনা
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors">
                          <Award className="w-3 h-3" /> পারফরম্যান্স
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3 h-3" /> মুছে ফেলুন
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="px-4 py-3 flex items-center gap-4 text-xs text-muted-foreground border-b">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {emp.phone}</span>
                <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" /> {emp.email}</span>
              </div>

              {/* Performance */}
              <div className="p-4 space-y-3">
                <PerformanceBar value={emp.ordersHandled} target={emp.target} />
                <div className="flex items-center justify-between">
                  <StarRating value={emp.rating} />
                  <span className="text-[11px] text-muted-foreground">যোগদান: {emp.joinDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/20 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h2 className="font-bold text-sm">পারফরম্যান্স লিডারবোর্ড</h2>
        </div>
        <div className="divide-y">
          {[...EMPLOYEES].sort((a, b) => b.ordersHandled - a.ordersHandled).slice(0, 5).map((emp, idx) => (
            <div key={emp.id} className="px-5 py-3 flex items-center gap-4">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0',
                idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground')}>
                {idx + 1}
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary flex-shrink-0">
                {emp.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{emp.name}</p>
                <p className="text-[11px] text-muted-foreground">{emp.department}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">{emp.ordersHandled.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">অর্ডার</p>
              </div>
              <StarRating value={emp.rating} />
            </div>
          ))}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold">নতুন কর্মী যোগ করুন</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'পূর্ণ নাম', placeholder: 'কর্মীর নাম লিখুন', type: 'text' },
                { label: 'ফোন নম্বর', placeholder: '০১XXX-XXXXXX', type: 'tel' },
                { label: 'ইমেইল', placeholder: 'email@shop.com', type: 'email' },
                { label: 'বিভাগ', placeholder: 'বিভাগের নাম', type: 'text' },
              ].map(f => (
                <div key={f.label} className="space-y-1.5">
                  <label className="text-xs font-bold">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-xs font-bold">ভূমিকা</label>
                <select className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="agent">এজেন্ট</option>
                  <option value="support">সাপোর্ট</option>
                  <option value="manager">ম্যানেজার</option>
                  <option value="admin">অ্যাডমিন</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">মাসিক অর্ডার লক্ষ্য</label>
                <input type="number" placeholder="যেমন: 1000"
                  className="w-full px-3 py-2.5 rounded-lg border bg-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border rounded-xl text-sm font-bold hover:bg-muted transition-colors">বাতিল</button>
              <button className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
