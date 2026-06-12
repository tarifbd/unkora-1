'use client';

import { useState } from 'react';
import { Percent, Plus, Edit2, Trash2 } from 'lucide-react';

const RULES = [
  { id: 'CR001', name: 'Default Commission', category: 'All Categories', type: 'percentage', rate: 10, min: null, max: null, active: true },
  { id: 'CR002', name: 'Electronics Premium', category: 'Electronics', type: 'percentage', rate: 8, min: null, max: 5000, active: true },
  { id: 'CR003', name: 'Fashion & Apparel', category: 'Fashion', type: 'percentage', rate: 12, min: null, max: null, active: true },
  { id: 'CR004', name: 'Grocery & Food', category: 'Grocery', type: 'percentage', rate: 6, min: null, max: null, active: true },
  { id: 'CR005', name: 'Books & Education', category: 'Books', type: 'flat', rate: 15, min: null, max: null, active: true },
  { id: 'CR006', name: 'Luxury Goods', category: 'Luxury', type: 'percentage', rate: 15, min: 500, max: null, active: false },
  { id: 'CR007', name: 'New Seller Promo', category: 'All Categories', type: 'percentage', rate: 5, min: null, max: 2000, active: true },
];

const SUMMARY = [
  { label: 'Total Commission Earned (Jun)', value: '৳2,84,750', trend: '+18%' },
  { label: 'Active Commission Rules', value: '6', trend: null },
  { label: 'Avg. Commission Rate', value: '9.3%', trend: null },
  { label: 'Highest Earning Category', value: 'Electronics', trend: null },
];

export default function CommissionPage() {
  const [rules, setRules] = useState(RULES);

  const toggleActive = (id: string) => {
    setRules(r => r.map(rule => rule.id === id ? { ...rule, active: !rule.active } : rule));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Commission Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Define how much sellers earn on each sale</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {SUMMARY.map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold mt-1">{s.value}</p>
            {s.trend && <p className="text-xs text-green-600 mt-0.5">{s.trend} vs last month</p>}
          </div>
        ))}
      </div>

      {/* Rules table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b px-5 py-3.5 flex items-center gap-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Commission Rules</span>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Rule Name</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Category</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Rate</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Max Cap</th>
              <th className="px-5 py-3 text-center font-medium text-muted-foreground">Active</th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rules.map(rule => (
              <tr key={rule.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">{rule.id}</p>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground">{rule.category}</td>
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-primary">
                    {rule.type === 'percentage' ? `${rule.rate}%` : `৳${rule.rate}`}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">{rule.type}</span>
                </td>
                <td className="px-5 py-3.5 hidden sm:table-cell text-muted-foreground">
                  {rule.max ? `৳${rule.max.toLocaleString()}` : '—'}
                </td>
                <td className="px-5 py-3.5 text-center">
                  <button
                    onClick={() => toggleActive(rule.id)}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${rule.active ? 'bg-green-500' : 'bg-muted'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5 ${rule.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button className="rounded p-1.5 hover:bg-muted transition-colors">
                      <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button className="rounded p-1.5 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
