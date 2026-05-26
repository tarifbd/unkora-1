'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, TrendingUp, Sparkles, Clock, AlertTriangle, Loader2, ChevronRight, Users } from 'lucide-react';
import api from '@/lib/api';

// ─── API helpers ──────────────────────────────────────────────

const segApi = {
  getOverview: () => api.get('/segments/overview').then(r => r.data.data),
  getUsers: (segment: string) => api.get(`/segments/${segment}/users`).then(r => r.data.data),
};

// ─── Types ────────────────────────────────────────────────────

interface SegmentInfo {
  segment: string;
  label: string;
  count: number;
  description: string;
  color: string;
}

interface SegmentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  orderCount: number;
  totalSpent: number;
}

// ─── Segment config ───────────────────────────────────────────

const SEGMENT_ICONS: Record<string, React.ElementType> = {
  vip:         Crown,
  'high-value': TrendingUp,
  new:         Sparkles,
  inactive:    Clock,
  'at-risk':   AlertTriangle,
};

const SEGMENT_COLORS: Record<string, { card: string; icon: string; badge: string }> = {
  vip:          { card: 'border-purple-200 bg-purple-50',   icon: 'bg-purple-500 text-white',     badge: 'bg-purple-100 text-purple-700' },
  'high-value': { card: 'border-yellow-200 bg-yellow-50',   icon: 'bg-yellow-500 text-white',     badge: 'bg-yellow-100 text-yellow-700' },
  new:          { card: 'border-green-200 bg-green-50',     icon: 'bg-green-500 text-white',      badge: 'bg-green-100 text-green-700' },
  inactive:     { card: 'border-gray-200 bg-gray-50',       icon: 'bg-gray-400 text-white',       badge: 'bg-gray-100 text-gray-600' },
  'at-risk':    { card: 'border-red-200 bg-red-50',         icon: 'bg-red-500 text-white',        badge: 'bg-red-100 text-red-700' },
};

// ─── Main Page ────────────────────────────────────────────────

export default function SegmentsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const { data: segments = [], isLoading: loadingSegments } = useQuery<SegmentInfo[]>({
    queryKey: ['segment-overview'],
    queryFn: segApi.getOverview,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery<SegmentUser[]>({
    queryKey: ['segment-users', selected],
    queryFn: () => segApi.getUsers(selected!),
    enabled: !!selected,
  });

  const selectedSegment = segments.find(s => s.segment === selected);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Customer Segmentation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Auto-computed segments based on customer behavior
        </p>
      </div>

      {loadingSegments ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Left: Segment Cards */}
          <div className="w-full lg:w-72 flex-shrink-0 space-y-3">
            {segments.map(seg => {
              const Icon = SEGMENT_ICONS[seg.segment] ?? Users;
              const colors = SEGMENT_COLORS[seg.segment] ?? { card: 'border-gray-200 bg-gray-50', icon: 'bg-gray-400 text-white', badge: 'bg-gray-100 text-gray-600' };
              const isActive = selected === seg.segment;

              return (
                <button
                  key={seg.segment}
                  onClick={() => setSelected(isActive ? null : seg.segment)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    isActive
                      ? `${colors.card} ring-2 ring-offset-1 ring-current`
                      : `${colors.card} hover:shadow-sm`
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.icon}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{seg.label}</p>
                        <p className="text-xs text-muted-foreground">{seg.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${colors.badge}`}>
                        {seg.count}
                      </span>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: User List */}
          <div className="flex-1 min-w-0">
            {!selected ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="font-semibold text-muted-foreground">Select a segment</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Click any segment card to view its customers</p>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  {(() => {
                    const Icon = SEGMENT_ICONS[selected] ?? Users;
                    const colors = SEGMENT_COLORS[selected] ?? { icon: 'bg-gray-400 text-white' };
                    return (
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.icon}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="font-bold">{selectedSegment?.label}</h2>
                    <p className="text-xs text-muted-foreground">{selectedSegment?.count} customers in this segment</p>
                  </div>
                </div>

                {loadingUsers ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Customer</th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Phone</th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Orders</th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                                  {u.firstName?.[0]}{u.lastName?.[0]}
                                </div>
                                <div>
                                  <p className="font-medium">{u.firstName} {u.lastName}</p>
                                  <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{u.phone ?? '—'}</td>
                            <td className="px-4 py-3 text-right font-semibold">{u.orderCount}</td>
                            <td className="px-4 py-3 text-right font-bold">৳{Number(u.totalSpent).toLocaleString()}</td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                              No customers in this segment
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
