'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  CheckCircle2, XCircle, Eye, Edit2, Package, Users,
  TrendingUp, Clock, BarChart2, Download, AlertTriangle, ExternalLink, Tag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ConditionGrade = 'A+' | 'A' | 'B' | 'C';
type ListingStatus = 'Pending' | 'Active' | 'Rejected';

interface Listing {
  id: string;
  product: string;
  seller: string;
  grade: ConditionGrade;
  price: number;
  status: ListingStatus;
}

interface Seller {
  id: string;
  name: string;
  email: string;
  totalListings: number;
  rating: number;
  verified: boolean;
}

interface GradeCriteria {
  grade: ConditionGrade;
  label: string;
  description: string;
  example: string;
  color: string;
  bg: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_LISTINGS: Listing[] = [
  { id: '1', product: 'iPhone 13 Pro 256GB', seller: 'Rahim Electronics', grade: 'A+', price: 62000, status: 'Active' },
  { id: '2', product: 'Samsung Galaxy S22', seller: 'TechSell BD', grade: 'A', price: 38000, status: 'Pending' },
  { id: '3', product: 'MacBook Air M1 2020', seller: 'Laptop Bazar', grade: 'B', price: 72000, status: 'Active' },
  { id: '4', product: 'Sony WH-1000XM4 Headphones', seller: 'Audio World', grade: 'A+', price: 18000, status: 'Pending' },
  { id: '5', product: 'iPad 9th Gen 64GB', seller: 'Rahim Electronics', grade: 'C', price: 22000, status: 'Rejected' },
  { id: '6', product: 'Dell XPS 15 Laptop', seller: 'TechSell BD', grade: 'B', price: 85000, status: 'Active' },
];

const MOCK_SELLERS: Seller[] = [
  { id: '1', name: 'Rahim Electronics', email: 'rahim@electronics.com', totalListings: 24, rating: 4.8, verified: true },
  { id: '2', name: 'TechSell BD', email: 'info@techsellbd.com', totalListings: 17, rating: 4.5, verified: true },
  { id: '3', name: 'Laptop Bazar', email: 'laptopbazar@mail.com', totalListings: 11, rating: 4.2, verified: false },
  { id: '4', name: 'Audio World', email: 'audio@world.com', totalListings: 8, rating: 4.9, verified: true },
  { id: '5', name: 'Gadget Galaxy', email: 'gadgets@galaxy.com', totalListings: 5, rating: 3.8, verified: false },
];

const GRADE_CRITERIA: GradeCriteria[] = [
  {
    grade: 'A+',
    label: 'Mint / Like New',
    description: 'Product is in perfect or near-perfect condition. No visible scratches, dents, or marks. Functions 100% as new.',
    example: 'iPhone 13 used for 1 month with original box and accessories.',
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    grade: 'A',
    label: 'Excellent',
    description: 'Minor signs of use visible only on close inspection. Fully functional with no performance issues.',
    example: 'Samsung Galaxy S22 with a tiny hairline scratch on the back.',
    color: '#0284c7',
    bg: '#e0f2fe',
  },
  {
    grade: 'B',
    label: 'Good / Fair',
    description: 'Noticeable scratches or light dents but fully functional. May have minor cosmetic flaws.',
    example: 'MacBook Air with visible keyboard wear and small lid scuff.',
    color: '#d97706',
    bg: '#fef3c7',
  },
  {
    grade: 'C',
    label: 'Acceptable / Worn',
    description: 'Heavy cosmetic damage or significant wear. Works but may have minor functional limitations.',
    example: 'iPad with cracked back glass but working screen and battery.',
    color: '#dc2626',
    bg: '#fee2e2',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function GradeBadge({ grade }: { grade: ConditionGrade }) {
  const map: Record<ConditionGrade, { bg: string; color: string }> = {
    'A+': { bg: '#ecfdf5', color: '#059669' },
    'A':  { bg: '#e0f2fe', color: '#0284c7' },
    'B':  { bg: '#fef3c7', color: '#d97706' },
    'C':  { bg: '#fee2e2', color: '#dc2626' },
  };
  const s = map[grade];
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: s.bg, color: s.color }}>
      {grade}
    </span>
  );
}

function StatusBadge({ status }: { status: ListingStatus }) {
  const map: Record<ListingStatus, { bg: string; color: string; icon: React.ReactNode }> = {
    Active:   { bg: '#d1fae5', color: '#065f46', icon: <CheckCircle2 className="w-3 h-3" /> },
    Pending:  { bg: '#fef3c7', color: '#92400e', icon: <Clock className="w-3 h-3" /> },
    Rejected: { bg: '#fee2e2', color: '#991b1b', icon: <XCircle className="w-3 h-3" /> },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
      {s.icon}{status}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-bold text-gray-800">{rating.toFixed(1)}</span>
      <span className="text-yellow-400 text-sm">★</span>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, icon, gradient }: {
  label: string; value: string; sub: string; trend?: string; icon: React.ReactNode; gradient: string;
}) {
  return (
    <div className="rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" style={{ background: gradient }}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
          <p className="text-2xl font-black mt-1.5 tracking-tight">{value}</p>
          <p className="text-xs mt-1.5 opacity-80">{sub}</p>
          {trend && (
            <p className="text-xs mt-1 font-semibold text-white/90">{trend}</p>
          )}
        </div>
        <div className="rounded-xl p-3 flex-shrink-0 ml-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ['Listings', 'Sellers', 'Grading', 'Reports'] as const;
type Tab = typeof TABS[number];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminRecommercePage() {
  const [activeTab, setActiveTab] = useState<Tab>('Listings');
  const [editingGrade, setEditingGrade] = useState<ConditionGrade | null>(null);

  const stats = [
    { label: 'Total Listings', value: '142', sub: '23 added this week', trend: '↑ 18% vs last week', icon: <Package className="w-5 h-5" />, gradient: 'linear-gradient(135deg, #059669, #0d9488)' },
    { label: 'Pending Approval', value: '18', sub: 'Awaiting review', trend: '6 submitted today', icon: <Clock className="w-5 h-5" />, gradient: 'linear-gradient(135deg, #d97706, #b45309)' },
    { label: 'Active Listings', value: '109', sub: 'Live on marketplace', trend: '↑ 5% this month', icon: <CheckCircle2 className="w-5 h-5" />, gradient: 'linear-gradient(135deg, #0284c7, #4f46e5)' },
    { label: 'Gross Revenue', value: '৳8,42,500', sub: 'Lifetime total', trend: '৳64,200 this month', icon: <TrendingUp className="w-5 h-5" />, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Recommerce Admin</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              ♻️ Recommerce
            </span>
          </div>
          <p className="text-sm text-gray-500">Manage refurbished &amp; used item listings, sellers, and grading</p>
        </div>
      </div>

      {/* Quick nav to sub-pages */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: '/admin/recommerce/listings', icon: Package,  label: 'Manage Listings' },
          { href: '/admin/recommerce/sellers',  icon: Users,    label: 'Manage Sellers' },
          { href: '/admin/recommerce/grading',  icon: Tag,      label: 'Grading Criteria' },
          { href: '/recommerce',                icon: ExternalLink, label: 'View Salvage Yard' },
        ].map(link => (
          <Link key={link.href} href={link.href}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white border rounded-lg hover:border-emerald-400 hover:text-emerald-700 transition-colors text-gray-600">
            <link.icon className="w-3.5 h-3.5" />
            {link.label}
          </Link>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── Listings Tab ───────────────────────────────────────────── */}
          {activeTab === 'Listings' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 rounded-xl">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 rounded-l-xl">Product</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Seller</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Condition</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Price</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_LISTINGS.map(listing => (
                    <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-gray-800">{listing.product}</td>
                      <td className="px-4 py-3.5 text-gray-600">{listing.seller}</td>
                      <td className="px-4 py-3.5"><GradeBadge grade={listing.grade} /></td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">৳{listing.price.toLocaleString()}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={listing.status} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Sellers Tab ────────────────────────────────────────────── */}
          {activeTab === 'Sellers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 rounded-xl">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 rounded-l-xl">Seller Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Total Listings</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Rating</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Verified</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_SELLERS.map(seller => (
                    <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-black flex-shrink-0">
                            {seller.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{seller.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{seller.email}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">{seller.totalListings}</td>
                      <td className="px-4 py-3.5"><StarRating rating={seller.rating} /></td>
                      <td className="px-4 py-3.5">
                        {seller.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-500">
                            <AlertTriangle className="w-3 h-3" /> Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            <Eye className="w-3 h-3" /> View
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Grading Tab ────────────────────────────────────────────── */}
          {activeTab === 'Grading' && (
            <div>
              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-800">Condition Grading System</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Each Recommerce listing is assigned a condition grade. Buyers rely on these grades to understand the item&apos;s state before purchase.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {GRADE_CRITERIA.map(gc => (
                  <div key={gc.grade} className="rounded-2xl border-2 p-5 transition-all hover:shadow-md" style={{ borderColor: gc.color + '40', background: gc.bg }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black rounded-xl px-3 py-1.5 text-white" style={{ background: gc.color }}>
                          {gc.grade}
                        </span>
                        <div>
                          <p className="font-bold text-gray-800">{gc.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Condition Grade</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingGrade(editingGrade === gc.grade ? null : gc.grade)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors text-white"
                        style={{ background: gc.color }}
                      >
                        <Edit2 className="w-3 h-3" />
                        {editingGrade === gc.grade ? 'Close' : 'Edit'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{gc.description}</p>
                    <div className="rounded-xl bg-white/70 p-3 border border-white">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Example</p>
                      <p className="text-xs text-gray-600">{gc.example}</p>
                    </div>
                    {editingGrade === gc.grade && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          defaultValue={gc.description}
                          rows={3}
                          className="w-full text-xs border-2 rounded-xl px-3 py-2 focus:outline-none resize-none bg-white"
                          style={{ borderColor: gc.color + '60' }}
                          placeholder="Edit grade description..."
                        />
                        <div className="flex gap-2">
                          <button
                            className="flex-1 rounded-xl py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                            style={{ background: gc.color }}
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingGrade(null)}
                            className="rounded-xl px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Reports Tab ────────────────────────────────────────────── */}
          {activeTab === 'Reports' && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <BarChart2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-800">Recommerce Reports</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                  Export listing data, seller performance, and revenue summaries for your records.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
                  <Download className="w-4 h-4" /> Download CSV
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <BarChart2 className="w-4 h-4" /> View Analytics
                </button>
              </div>
              <p className="text-xs text-gray-400">Last export: Never · Data range: All time</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
