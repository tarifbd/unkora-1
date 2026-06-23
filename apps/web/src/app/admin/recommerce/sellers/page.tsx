'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, CheckCircle2, XCircle, Star, Users } from 'lucide-react';

const SELLERS = [
  { id: 'S001', name: 'Rahim Ahmed',   email: 'rahim@example.com',  phone: '01712345678', totalListings: 5,  activeSales: 3,  rating: 4.7, verified: true,  joinedAt: '2025-03-15' },
  { id: 'S002', name: 'Karim Hossain', email: 'karim@example.com',  phone: '01812345678', totalListings: 2,  activeSales: 1,  rating: 4.2, verified: true,  joinedAt: '2025-05-01' },
  { id: 'S003', name: 'Nadia Islam',   email: 'nadia@example.com',  phone: '01912345678', totalListings: 8,  activeSales: 5,  rating: 4.9, verified: false, joinedAt: '2025-01-20' },
  { id: 'S004', name: 'Faruk Ahmed',   email: 'faruk@example.com',  phone: '01612345678', totalListings: 1,  activeSales: 0,  rating: 3.8, verified: false, joinedAt: '2026-02-10' },
  { id: 'S005', name: 'Jakir Hossen',  email: 'jakir@example.com',  phone: '01512345678', totalListings: 3,  activeSales: 2,  rating: 4.5, verified: true,  joinedAt: '2025-08-30' },
];

export default function AdminRecommerceSellersPage() {
  const [search, setSearch]       = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  const filtered = SELLERS.filter(s => {
    if (verifiedFilter === 'verified'   && !s.verified) return false;
    if (verifiedFilter === 'unverified' &&  s.verified) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.includes(search)) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/recommerce" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-xl font-black text-gray-900">Recommerce Sellers</h1>
          <p className="text-sm text-gray-500">Manage seller accounts and verification</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sellers',    value: SELLERS.length,                          color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'Verified',         value: SELLERS.filter(s => s.verified).length,  color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Verify',   value: SELLERS.filter(s => !s.verified).length, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 border`}>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs font-semibold text-gray-600 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search seller..."
            className="border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-400 w-64" />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(['all', 'verified', 'unverified'] as const).map(v => (
            <button key={v} onClick={() => setVerifiedFilter(v)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-colors ${
                verifiedFilter === v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b text-left">
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Seller</th>
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Contact</th>
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Listings</th>
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Rating</th>
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-sm font-black text-amber-700">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                      <p className="text-[11px] text-gray-400">{s.id} · Since {s.joinedAt}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-gray-700">{s.email}</p>
                  <p className="text-[11px] text-gray-400">{s.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-bold text-gray-900">{s.totalListings}</p>
                  <p className="text-[11px] text-gray-400">{s.activeSales} active</p>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-sm font-bold text-gray-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" /> {s.rating}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {s.verified ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full w-fit">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {!s.verified && (
                      <button className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors">
                        Verify
                      </button>
                    )}
                    <button className="px-2.5 py-1 border hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors text-gray-600">
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No sellers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
