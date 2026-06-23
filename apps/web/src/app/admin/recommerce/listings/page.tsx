'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, CheckCircle2, XCircle, Eye, Clock, Package, Filter } from 'lucide-react';

type Status = 'all' | 'pending' | 'active' | 'rejected' | 'sold';
type Grade  = 'A+' | 'A' | 'B' | 'C';

const LISTINGS = [
  { id: 'RC001', title: 'Samsung Galaxy S21',    seller: 'Rahim Ahmed',    grade: 'A' as Grade,  price: 28000, status: 'active'  as const, cat: 'Electronics', postedAt: '2026-06-22' },
  { id: 'RC002', title: 'Dell Laptop Core i5',   seller: 'Karim Hossain',  grade: 'B' as Grade,  price: 35000, status: 'pending' as const, cat: 'Electronics', postedAt: '2026-06-23' },
  { id: 'RC003', title: 'Sony Smart TV 43"',     seller: 'Nadia Islam',    grade: 'A+' as Grade, price: 22000, status: 'active'  as const, cat: 'Electronics', postedAt: '2026-06-21' },
  { id: 'RC004', title: 'Dining Table Set',      seller: 'Faruk Ahmed',    grade: 'B' as Grade,  price: 12000, status: 'sold'    as const, cat: 'Furniture',   postedAt: '2026-06-18' },
  { id: 'RC005', title: 'iPhone 13 Pro',         seller: 'Rahim Ahmed',    grade: 'A+' as Grade, price: 65000, status: 'pending' as const, cat: 'Electronics', postedAt: '2026-06-23' },
  { id: 'RC006', title: 'Cricket Bat & Kit',     seller: 'Jakir Hossen',   grade: 'B' as Grade,  price: 3200,  status: 'rejected'as const, cat: 'Sports',      postedAt: '2026-06-20' },
];

const GRADE_COLOR: Record<Grade, string> = {
  'A+': 'bg-emerald-100 text-emerald-700',
  'A':  'bg-green-100 text-green-700',
  'B':  'bg-yellow-100 text-yellow-700',
  'C':  'bg-orange-100 text-orange-700',
};

const STATUS_META: Record<string, { color: string; label: string }> = {
  active:   { color: 'bg-green-100 text-green-700',   label: 'Active' },
  pending:  { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
  rejected: { color: 'bg-red-100 text-red-700',       label: 'Rejected' },
  sold:     { color: 'bg-gray-100 text-gray-600',     label: 'Sold' },
};

export default function AdminRecommerceListingsPage() {
  const [statusFilter, setStatusFilter] = useState<Status>('all');
  const [search, setSearch] = useState('');

  const filtered = LISTINGS.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.seller.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: LISTINGS.length,
    pending:  LISTINGS.filter(l => l.status === 'pending').length,
    active:   LISTINGS.filter(l => l.status === 'active').length,
    rejected: LISTINGS.filter(l => l.status === 'rejected').length,
    sold:     LISTINGS.filter(l => l.status === 'sold').length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/recommerce" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-xl font-black text-gray-900">Recommerce Listings</h1>
          <p className="text-sm text-gray-500">Review, approve, or reject second-hand item listings</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {(['all', 'pending', 'active', 'rejected', 'sold'] as Status[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-colors ${
              statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {s} <span className="text-xs opacity-60">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or seller..."
            className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Listing</th>
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Seller</th>
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Grade</th>
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Price</th>
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(l => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{l.title}</p>
                      <p className="text-[11px] text-gray-400">{l.id} · {l.cat}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{l.seller}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${GRADE_COLOR[l.grade]}`}>{l.grade}</span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-amber-600">৳ {l.price.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_META[l.status]?.color ?? ''}`}>
                    {STATUS_META[l.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors" title="View">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {l.status === 'pending' && (
                      <>
                        <button className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Approve">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Reject">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No listings found</p>
          </div>
        )}
      </div>
    </div>
  );
}
