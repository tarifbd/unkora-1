'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Star, TrendingUp, Users, Coins, Settings2, RefreshCw } from 'lucide-react';
import { loyaltyApi, type LoyaltyConfig, type PointTransaction, type LoyaltyStats } from '@/lib/api/loyalty';

export default function LoyaltyPage() {
  const qc = useQueryClient();
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');
  const [configEditing, setConfigEditing] = useState(false);

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['loyalty-config'],
    queryFn: loyaltyApi.getConfig,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['loyalty-transactions'],
    queryFn: () => loyaltyApi.getTransactions({ limit: 50 }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['loyalty-stats'],
    queryFn: loyaltyApi.getStats,
  });

  const [configForm, setConfigForm] = useState<Partial<LoyaltyConfig>>({});

  const updateConfig = useMutation({
    mutationFn: (data: Partial<LoyaltyConfig>) => loyaltyApi.updateConfig(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty-config'] }); setConfigEditing(false); },
  });

  const adjust = useMutation({
    mutationFn: () => loyaltyApi.adminAdjust({
      userId: adjustUserId,
      points: Number(adjustPoints),
      description: adjustDesc,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      setAdjustUserId(''); setAdjustPoints(''); setAdjustDesc('');
    },
  });

  const transactions: PointTransaction[] = txData?.data ?? [];
  const stats: LoyaltyStats = statsData ?? { totalIssued: 0, totalRedeemed: 0, outstanding: 0 };

  const TYPE_COLORS: Record<string, string> = {
    EARNED: 'text-green-600 bg-green-50',
    REDEEMED: 'text-red-600 bg-red-50',
    EXPIRED: 'text-gray-600 bg-gray-100',
    BONUS: 'text-purple-600 bg-purple-50',
    REFERRAL: 'text-blue-600 bg-blue-50',
    ADJUSTED: 'text-orange-600 bg-orange-50',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Club Points / Loyalty</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure earning rules and manage customer point balances</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Issued', value: stats.totalIssued?.toLocaleString() ?? '0', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'Total Redeemed', value: stats.totalRedeemed?.toLocaleString() ?? '0', icon: Coins, color: 'text-red-600 bg-red-50' },
          { label: 'Outstanding', value: stats.outstanding?.toLocaleString() ?? '0', icon: Star, color: 'text-blue-600 bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label} pts</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Config */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Earning Rules</h2>
            </div>
            <button onClick={() => {
              setConfigEditing(!configEditing);
              if (!configEditing && config) setConfigForm({ ...config });
            }} className="text-xs text-primary hover:underline">
              {configEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {configLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : configEditing ? (
            <div className="space-y-3">
              {[
                { key: 'pointsPerTaka', label: 'Points per ৳1 spent', type: 'number' },
                { key: 'pointValue', label: 'Value per point (৳)', type: 'number' },
                { key: 'minRedeemPoints', label: 'Min. points to redeem', type: 'number' },
                { key: 'maxRedeemPercent', label: 'Max. discount % per order', type: 'number' },
                { key: 'expiryDays', label: 'Points expire after (days, 0=never)', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                  <input
                    type={f.type}
                    className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={(configForm as any)[f.key] ?? ''}
                    onChange={e => setConfigForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
              <button
                onClick={() => updateConfig.mutate(configForm)}
                disabled={updateConfig.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                {updateConfig.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Config
              </button>
            </div>
          ) : config ? (
            <div className="space-y-2.5">
              {[
                ['Points per ৳1', `${config.pointsPerTaka} pts`],
                ['Value per point', `৳${config.pointValue}`],
                ['Min. redeem', `${config.minRedeemPoints} pts`],
                ['Max. discount', `${config.maxRedeemPercent}% of order`],
                ['Expiry', config.expiryDays ? `${config.expiryDays} days` : 'Never'],
                ['Status', config.isActive ? '🟢 Active' : '🔴 Inactive'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Manual Adjust */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Manual Adjustment</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">User ID</label>
              <input
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={adjustUserId}
                onChange={e => setAdjustUserId(e.target.value)}
                placeholder="User ID..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Points (negative to deduct)</label>
              <input
                type="number"
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={adjustPoints}
                onChange={e => setAdjustPoints(e.target.value)}
                placeholder="e.g. 100 or -50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Reason</label>
              <input
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={adjustDesc}
                onChange={e => setAdjustDesc(e.target.value)}
                placeholder="Admin adjustment for..."
              />
            </div>
            <button
              onClick={() => adjust.mutate()}
              disabled={adjust.isPending || !adjustUserId || !adjustPoints}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
              {adjust.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Apply Adjustment
            </button>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b px-4 py-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Recent Transactions</h2>
        </div>
        {txLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">User</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase">Points</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase">Balance</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-sm font-mono text-xs text-muted-foreground">{tx.userId.slice(0, 8)}...</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLORS[tx.type] ?? ''}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right text-sm font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm">{tx.balance}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground truncate max-w-[200px]">{tx.description ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString('en-BD')}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
