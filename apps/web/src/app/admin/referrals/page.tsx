'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Share2, DollarSign, CheckCircle2, Clock, Users } from 'lucide-react';
import { referralsApi, type Referral, type ReferralStats } from '@/lib/api/referrals';
import { formatCurrency } from '@/lib/utils';

export default function ReferralsPage() {
  const qc = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: referralsApi.adminStats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['referrals-admin'],
    queryFn: () => referralsApi.adminList({ limit: 50 }),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => referralsApi.markPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referrals-admin'] });
      qc.invalidateQueries({ queryKey: ['referral-stats'] });
    },
  });

  const referrals: Referral[] = data?.data ?? [];
  const stats: ReferralStats = statsData ?? { total: 0, paid: 0, unpaid: 0, totalRewards: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referral Program</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track and manage customer referrals and rewards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Referrals', value: stats.total, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Paid Out', value: stats.paid, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
          { label: 'Pending Payment', value: stats.unpaid, icon: Clock, color: 'text-orange-600 bg-orange-50' },
          { label: 'Total Rewards', value: formatCurrency(Number(stats.totalRewards)), icon: DollarSign, color: 'text-purple-600 bg-purple-50', isText: true },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="rounded-xl border bg-gradient-to-r from-purple-50 to-pink-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-white">
            <Share2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-purple-900">How Referrals Work</h3>
            <p className="text-xs text-purple-700 mt-0.5">
              Each customer gets a unique referral code. When a new customer signs up using that code and places their first order,
              the referrer earns a reward. Mark rewards as "Paid" once you've credited the amount.
            </p>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Referred User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Referrer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Code</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Reward</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {referrals.map(ref => (
                <tr key={ref.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    {ref.referredUser ? (
                      <div>
                        <p className="text-sm font-medium">{ref.referredUser.firstName} {ref.referredUser.lastName}</p>
                        <p className="text-xs text-muted-foreground">{ref.referredUser.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">{ref.referredUserId.slice(0, 8)}...</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ref.referrer ? (
                      <div>
                        <p className="text-sm font-medium">{ref.referrer.firstName} {ref.referrer.lastName}</p>
                        <p className="text-xs text-muted-foreground">{ref.referrer.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">{ref.referrerId.slice(0, 8)}...</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{ref.referralCode?.code ?? '—'}</code>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-sm">{formatCurrency(Number(ref.rewardAmount))}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ref.isPaid ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(ref.createdAt).toLocaleDateString('en-BD')}
                    {ref.paidAt && (
                      <p className="text-green-600">Paid: {new Date(ref.paidAt).toLocaleDateString('en-BD')}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!ref.isPaid && (
                      <button
                        onClick={() => markPaid.mutate(ref.id)}
                        disabled={markPaid.isPending}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
                        {markPaid.isPending && markPaid.variables === ref.id && <Loader2 className="h-3 w-3 animate-spin" />}
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Share2 className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No referrals yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
