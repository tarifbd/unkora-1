'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Store, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

type AppStatus = 'pending' | 'review' | 'approved' | 'rejected';

const APPS: { id: string; name: string; owner: string; email: string; phone: string; city: string; category: string; status: AppStatus; applied: string; docs: boolean }[] = [
  { id: 'SA001', name: 'Rofiqul Electronics', owner: 'Rofiqul Islam', email: 'rofiq@electronics.bd', phone: '01711-223344', city: 'Dhaka', category: 'Electronics', status: 'pending', applied: '2026-06-10', docs: true },
  { id: 'SA002', name: 'Tasmin Fashion House', owner: 'Tasmin Akter', email: 'tasmin@fashion.bd', phone: '01912-334455', city: 'Chittagong', category: 'Fashion', status: 'pending', applied: '2026-06-09', docs: true },
  { id: 'SA003', name: 'Rahman Grocery', owner: 'Abdur Rahman', email: 'rahman@grocery.bd', phone: '01815-445566', city: 'Sylhet', category: 'Grocery', status: 'review', applied: '2026-06-08', docs: false },
  { id: 'SA004', name: 'Karim Books', owner: 'Karimul Haque', email: 'karim@books.bd', phone: '01617-556677', city: 'Rajshahi', category: 'Books', status: 'approved', applied: '2026-06-05', docs: true },
  { id: 'SA005', name: 'Nadia Beauty', owner: 'Nadia Sultana', email: 'nadia@beauty.bd', phone: '01518-667788', city: 'Dhaka', category: 'Beauty', status: 'rejected', applied: '2026-06-04', docs: true },
  { id: 'SA006', name: 'Digital Galaxy', owner: 'Farhan Ahmed', email: 'farhan@digital.bd', phone: '01319-778899', city: 'Khulna', category: 'Electronics', status: 'pending', applied: '2026-06-11', docs: true },
  { id: 'SA007', name: 'Arif Home Decor', owner: 'Arif Hossain', email: 'arif@decor.bd', phone: '01700-889900', city: 'Comilla', category: 'Home', status: 'review', applied: '2026-06-07', docs: true },
];

const STATUS_META: Record<AppStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:  { label: 'Pending',  color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  review:   { label: 'In Review',color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Clock },
  approved: { label: 'Approved', color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle },
};

const TABS = ['All', 'Pending', 'In Review', 'Approved', 'Rejected'];

export default function SellerApplicationsPage() {
  const [tab, setTab] = useState('All');

  const filtered = tab === 'All'
    ? APPS
    : APPS.filter(a => STATUS_META[a.status].label === tab);

  const counts = {
    pending: APPS.filter(a => a.status === 'pending').length,
    review: APPS.filter(a => a.status === 'review').length,
    approved: APPS.filter(a => a.status === 'approved').length,
    rejected: APPS.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">Seller Applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and approve new marketplace seller registrations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending', count: counts.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'In Review', count: counts.review, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Approved', count: counts.approved, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Rejected', count: counts.rejected, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.bg}`}>
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${tab === t ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Applications table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Business</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Category</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Location</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Applied</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(app => {
              const sm = STATUS_META[app.status];
              const Icon = sm.icon;
              return (
                <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Store className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-xs text-muted-foreground">{app.owner}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground">{app.category}</td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {app.city}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-muted-foreground">{app.applied}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sm.bg} ${sm.color}`}>
                      <Icon className="h-3 w-3" />
                      {sm.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {app.status === 'pending' || app.status === 'review' ? (
                        <>
                          <button className="rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 transition-colors">
                            Approve
                          </button>
                          <button className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors">
                            Reject
                          </button>
                        </>
                      ) : (
                        <button className="rounded-md border px-3 py-1 text-xs hover:bg-muted transition-colors flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
