'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, TrendingDown, Minus, Sparkles, Loader2, Calendar,
  Package, AlertTriangle, Flame, Trash2, ChevronDown, ChevronUp,
  FileText, XCircle, Rocket, Globe2, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const STATUS_BADGE: Record<string, string> = {
  GENERATING: 'bg-blue-100 text-blue-700 animate-pulse',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

const TREND_BADGE: Record<string, string> = {
  RISING: 'bg-green-100 text-green-700',
  FALLING: 'bg-red-100 text-red-700',
  STABLE: 'bg-gray-100 text-gray-600',
};

const EMERGING_BADGE: Record<string, string> = {
  EXPLOSIVE: 'bg-red-100 text-red-700',
  EMERGING: 'bg-violet-100 text-violet-700',
  RISING: 'bg-green-100 text-green-700',
  STEADY: 'bg-gray-100 text-gray-600',
  DECLINING: 'bg-slate-100 text-slate-500',
};

const DIRECTION_BADGE: Record<string, string> = {
  HOT: 'bg-red-100 text-red-700',
  RISING: 'bg-green-100 text-green-700',
  EMERGING: 'bg-violet-100 text-violet-700',
  COOLING: 'bg-blue-100 text-blue-600',
};

// Tiny inline sparkline for 8-week sales series
function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-[2px] h-6">
      {data.map((v, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm ${i >= data.length - 2 ? 'bg-orange-500' : 'bg-orange-200 dark:bg-orange-900/50'}`}
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function heatClass(value: number, max: number) {
  if (!value || max <= 0) return 'bg-gray-50 dark:bg-gray-700/40 text-gray-400';
  const ratio = value / max;
  if (ratio > 0.66) return 'bg-orange-500 text-white font-bold';
  if (ratio > 0.33) return 'bg-orange-300 text-orange-950 font-semibold';
  return 'bg-orange-100 text-orange-800';
}

// Very light markdown rendering: headings + bold, rest preformatted
function renderAnalysis(text: string) {
  return text.split('\n').map((line, i) => {
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const sizes = ['text-lg', 'text-base', 'text-sm', 'text-sm'];
      const level = (h[1] ?? '#').length - 1;
      return (
        <p key={i} className={`${sizes[level] ?? 'text-sm'} font-bold text-gray-900 dark:text-white mt-4 mb-1`}>
          {(h[2] ?? '').replace(/\*\*/g, '')}
        </p>
      );
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>
        : part,
    );
    return <p key={i} className="min-h-[1em]">{parts}</p>;
  });
}

export default function PredictionsPage() {
  const qc = useQueryClient();
  const [openReportId, setOpenReportId] = useState<string | null>(null);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['predictions-dashboard'],
    queryFn: () => api.get('/predictions/admin/dashboard').then(r => r.data.data),
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['predictions-reports'],
    queryFn: () => api.get('/predictions/admin/reports?page=1&limit=20').then(r => r.data.data),
  });

  const forecastMutation = useMutation({
    mutationFn: () => api.post('/predictions/admin/forecast').then(r => r.data.data),
    onSuccess: (report: any) => {
      if (report?.status === 'FAILED') {
        toast.error(report?.errorMessage ?? 'Forecast generation failed');
      } else {
        toast.success('AI forecast generated');
      }
      if (report?.id) setOpenReportId(report.id);
      qc.invalidateQueries({ queryKey: ['predictions-reports'] });
    },
    onError: () => toast.error('Failed to generate forecast'),
  });

  const marketTrendsMutation = useMutation({
    mutationFn: () => api.post('/predictions/admin/market-trends/generate').then(r => r.data.data),
    onSuccess: (res: any) => {
      if (res?.configured === false) {
        toast.error('No AI provider configured — set an API key in AI Studio settings');
      } else if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Market trend radar updated');
      }
      qc.invalidateQueries({ queryKey: ['predictions-dashboard'] });
    },
    onError: () => toast.error('Failed to generate market trends'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/predictions/admin/reports/${id}`),
    onSuccess: () => {
      toast.success('Report deleted');
      qc.invalidateQueries({ queryKey: ['predictions-reports'] });
    },
    onError: () => toast.error('Failed to delete report'),
  });

  const festivals: any[] = dashboard?.festivals ?? [];
  const trending: any[] = dashboard?.trending ?? [];
  const emerging: any[] = dashboard?.emerging ?? [];
  const marketTrends: any[] = dashboard?.marketTrends?.trends ?? [];
  const marketGeneratedAt: string | null = dashboard?.marketTrends?.generatedAt ?? null;
  const seasonalMonths: string[] = dashboard?.seasonal?.months ?? [];
  const seasonalCategories: any[] = dashboard?.seasonal?.categories ?? [];
  const stats = dashboard?.stats ?? {};
  const reports: any[] = reportsData?.data ?? [];

  const risingCount = trending.filter(t => t?.trend === 'RISING').length;
  const nextFestival = festivals[0];
  const seasonalMax = Math.max(
    1,
    ...seasonalCategories.flatMap((c: any) => c?.monthly ?? []),
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Predictive Analysis</h1>
            <p className="text-sm text-gray-500">AI-powered demand forecasting & stocking recommendations</p>
          </div>
        </div>
        <button
          onClick={() => forecastMutation.mutate()}
          disabled={forecastMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          {forecastMutation.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Sparkles className="h-4 w-4" />}
          {forecastMutation.isPending ? 'Generating…' : 'Generate AI Forecast'}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Products', value: stats.activeProducts ?? 0, icon: Package, color: 'text-blue-600 bg-blue-50' },
          { label: 'Low Stock Items', value: stats.lowStockCount ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
          { label: 'Rising Trends', value: risingCount, icon: Flame, color: 'text-orange-600 bg-orange-50' },
          {
            label: 'Next Festival',
            value: nextFestival ? `${nextFestival.name}` : '—',
            sub: nextFestival ? `in ${nextFestival.daysUntil} days` : undefined,
            icon: Calendar,
            color: 'text-purple-600 bg-purple-50',
          },
        ].map((s: any) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-black text-gray-900 dark:text-white truncate">
                {dashboardLoading ? '…' : s.value}
              </div>
              <div className="text-xs text-gray-500">{s.sub ? `${s.label} · ${s.sub}` : s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Festivals & Seasons */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-500" /> Upcoming Festivals & Seasons
        </h2>
        {festivals.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-400">
            No festivals or seasons in the next 180 days.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {festivals.map((f: any) => {
              const urgent = f.daysUntil <= f.leadTimeDays;
              return (
                <div
                  key={`${f.name}-${f.date}`}
                  className={`rounded-xl border p-4 ${
                    urgent
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{f.name}</p>
                      <p className="text-xs text-gray-500">{f.nameBn} · {new Date(`${f.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl font-black ${urgent ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                        {f.daysUntil}
                      </div>
                      <div className="text-[10px] text-gray-500 -mt-0.5">days left</div>
                    </div>
                  </div>
                  {urgent && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="h-3 w-3" /> Stock up now!
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(f.categories ?? []).map((c: string) => (
                      <span key={c} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trending Products */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" /> Trending Products
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {trending.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              Not enough order data yet — trends appear once you have sales history.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Last 30d</th>
                    <th className="px-4 py-3 text-right">Prev 30d</th>
                    <th className="px-4 py-3 text-right">Growth</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-center">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {trending.map((t: any) => (
                    <tr key={t.productId} className="border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white max-w-[240px] truncate">{t.name}</td>
                      <td className="px-4 py-3 text-gray-500">{t.category}</td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{t.recentQty}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{t.previousQty}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 font-bold ${t.growthPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.growthPct >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {t.growthPct > 0 ? '+' : ''}{t.growthPct}%
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${t.stockQuantity < 10 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {t.stockQuantity}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${TREND_BADGE[t.trend] ?? TREND_BADGE.STABLE}`}>
                          {t.trend === 'RISING' ? <TrendingUp className="h-3 w-3" /> : t.trend === 'FALLING' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          {t.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Predicted to trend — next 30 days */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-violet-500" /> Predicted to Trend — Next 30 Days
        </h2>
        <p className="text-xs text-gray-500 -mt-2 mb-3">
          Momentum model over 8 weekly buckets — catches products that are accelerating before they become bestsellers
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {emerging.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              Not enough weekly sales data yet — predictions appear with more order history.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">8-Week Pattern</th>
                    <th className="px-4 py-3 text-right">Trend Score</th>
                    <th className="px-4 py-3 text-right">Predicted 30d</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-center">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {emerging.map((e: any) => {
                    const underStocked = e.stockCoverage !== null && e.stockCoverage < 1;
                    return (
                      <tr key={e.productId} className="border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white max-w-[240px] truncate">{e.name}</td>
                        <td className="px-4 py-3 text-gray-500">{e.category}</td>
                        <td className="px-4 py-3"><Sparkline data={e.weekly ?? []} /></td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${e.trendScore >= 62 ? 'bg-violet-500' : e.trendScore >= 45 ? 'bg-green-500' : 'bg-gray-400'}`}
                                style={{ width: `${e.trendScore}%` }}
                              />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white w-7 text-right">{e.trendScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                          ~{e.predicted30d} <span className="text-[10px] font-normal text-gray-400">units</span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${underStocked ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {e.stockQuantity}
                          {underStocked && (
                            <span className="block text-[10px] font-bold text-red-500">restock!</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${EMERGING_BADGE[e.label] ?? EMERGING_BADGE.STEADY}`}>
                            {e.label === 'EXPLOSIVE' && <Flame className="h-3 w-3" />}
                            {e.label === 'EMERGING' && <Rocket className="h-3 w-3" />}
                            {e.label === 'RISING' && <TrendingUp className="h-3 w-3" />}
                            {e.label === 'STEADY' && <Minus className="h-3 w-3" />}
                            {e.label === 'DECLINING' && <TrendingDown className="h-3 w-3" />}
                            {e.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Market-wide category trend radar */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-blue-500" /> Market Category Radar (AI)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Predicts trending categories across ALL of Bangladesh e-commerce — including ones you don't sell yet
              {marketGeneratedAt && ` · updated ${new Date(marketGeneratedAt).toLocaleDateString()}`}
            </p>
          </div>
          <button
            onClick={() => marketTrendsMutation.mutate()}
            disabled={marketTrendsMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40 disabled:opacity-60 transition-colors"
          >
            {marketTrendsMutation.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
            {marketTrends.length ? 'Regenerate' : 'Generate Radar'}
          </button>
        </div>
        {marketTrends.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-400">
            <Globe2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
            No market radar yet — click "Generate Radar" to predict next month's trending categories with AI.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {marketTrends.map((t: any, i: number) => (
              <div key={`${t.category}-${i}`} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{t.category}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIRECTION_BADGE[t.direction] ?? DIRECTION_BADGE.RISING}`}>
                        {t.direction}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.inStore ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {t.inStore ? 'In your store' : 'Opportunity — not in store'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{t.trendScore}</div>
                    <div className="text-[10px] text-gray-400 -mt-0.5">score</div>
                  </div>
                </div>
                {t.peakWindow && (
                  <p className="text-[11px] font-semibold text-violet-600 mt-2">Peak: {t.peakWindow}</p>
                )}
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{t.reason}</p>
                {Array.isArray(t.exampleProducts) && t.exampleProducts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {t.exampleProducts.map((p: string) => (
                      <span key={p} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Seasonal pattern heatmap */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-500" /> Seasonal Pattern (units sold, last 12 months)
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {seasonalCategories.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No seasonal data yet — patterns appear once you have sales history.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 uppercase">
                    <th className="px-3 py-2.5 sticky left-0 bg-white dark:bg-gray-800">Category</th>
                    {seasonalMonths.map((m: string) => (
                      <th key={m} className="px-2 py-2.5 text-center font-medium whitespace-nowrap">
                        {new Date(`${m}-01T00:00:00`).toLocaleDateString('en-US', { month: 'short' })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {seasonalCategories.map((cat: any) => (
                    <tr key={cat.name} className="border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                      <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 whitespace-nowrap">
                        {cat.name}
                      </td>
                      {(cat.monthly ?? []).map((v: number, i: number) => (
                        <td key={i} className="p-1 text-center">
                          <div className={`rounded-md py-1.5 px-1 min-w-[36px] ${heatClass(v, seasonalMax)}`}>
                            {v || ''}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* AI Forecast Reports */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-500" /> AI Forecast Reports
        </h2>
        <div className="space-y-2">
          {reportsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-sm text-gray-400">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              No forecast reports yet. Click "Generate AI Forecast" to create your first one.
            </div>
          ) : (
            reports.map((report: any) => {
              const isOpen = openReportId === report.id;
              const canOpen = report.status === 'COMPLETED' || report.status === 'FAILED';
              return (
                <div key={report.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div
                    className={`flex items-center justify-between gap-3 p-4 ${canOpen ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40' : ''}`}
                    onClick={() => canOpen && setOpenReportId(isOpen ? null : report.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{report.title}</p>
                        <p className="text-xs text-gray-500">
                          {report.periodLabel ? `${report.periodLabel} · ` : ''}
                          {new Date(report.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[report.status] ?? STATUS_BADGE.GENERATING}`}>
                        {report.status}
                      </span>
                      {canOpen && (isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(report.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete report"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {isOpen && report.status === 'COMPLETED' && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 lg:p-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {renderAnalysis(report.aiAnalysis ?? 'No analysis content.')}
                    </div>
                  )}
                  {isOpen && report.status === 'FAILED' && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-start gap-2 text-sm text-red-600">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {report.errorMessage ?? 'Forecast generation failed.'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
