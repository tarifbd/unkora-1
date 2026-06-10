'use client';

import { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const forecastData = [
  { month: 'Jan', actual: 182000, predicted: 178000 },
  { month: 'Feb', actual: 198000, predicted: 195000 },
  { month: 'Mar', actual: 221000, predicted: 218000 },
  { month: 'Apr', actual: 245000, predicted: 241000 },
  { month: 'May', actual: 267000, predicted: 262000 },
  { month: 'Jun', actual: 289000, predicted: 285000 },
  { month: 'Jul', actual: null, predicted: 312000 },
  { month: 'Aug', actual: null, predicted: 338000 },
  { month: 'Sep', actual: null, predicted: 356000 },
];

const categoryForecast = [
  { category: 'Academic', q3: 82000, q4: 94000 },
  { category: 'Fiction', q3: 67000, q4: 78000 },
  { category: 'Children', q3: 54000, q4: 81000 },
  { category: 'Religious', q3: 48000, q4: 52000 },
  { category: 'Self-Help', q3: 39000, q4: 45000 },
];

const insights = [
  { type: 'positive', title: 'Eid Season Surge Expected', desc: 'AI predicts 34% revenue spike in Eid-ul-Adha week based on 2-year pattern.', confidence: 94 },
  { type: 'positive', title: 'Children\'s Books Trending', desc: 'School reopening in August will drive 2.4× demand for children\'s category.', confidence: 88 },
  { type: 'warning', title: 'Stock Risk: Academic Titles', desc: 'Current inventory may fall short by ~1,200 units in Sep based on prediction.', confidence: 79 },
  { type: 'negative', title: 'Fiction Slowdown', desc: 'Seasonal dip expected in August — consider flash deals to offset.', confidence: 72 },
];

export default function SalesPredictionsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [horizon, setHorizon] = useState<'3m' | '6m' | '12m'>('3m');

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">AI Sales Prediction</h2>
            <p className="text-xs text-muted-foreground">Powered by machine learning — last trained 2 hours ago</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden text-xs">
            {(['3m', '6m', '12m'] as const).map(h => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 font-medium transition-colors ${horizon === h ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-50'}`}
              >
                {h}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Retrain
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Predicted Revenue (Jul)', value: '৳3,12,000', change: '+8.0%', up: true, icon: TrendingUp },
          { label: 'Predicted Orders (Jul)', value: '1,248', change: '+6.2%', up: true, icon: TrendingUp },
          { label: 'Model Accuracy', value: '91.4%', change: '+1.2%', up: true, icon: CheckCircle },
          { label: 'Risk Score', value: 'Low', change: 'Stable', up: true, icon: AlertTriangle },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <k.icon className="h-4 w-4 text-purple-500 mb-2" />
            <p className="text-xl font-black">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <span className={`text-xs font-semibold ${k.up ? 'text-green-600' : 'text-red-500'}`}>{k.change} vs last month</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue forecast */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">Revenue Forecast vs Actual</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `৳${v?.toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Actual" connectNulls={false} />
              <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Predicted" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Q3/Q4 */}
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">Category Forecast Q3 vs Q4</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryForecast} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="q3" fill="#6366f1" name="Q3" radius={[0, 3, 3, 0]} />
              <Bar dataKey="q4" fill="#10b981" name="Q4" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-5 border-b flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h3 className="font-bold text-sm">AI-Generated Insights</h3>
        </div>
        <div className="divide-y">
          {insights.map((ins, i) => (
            <div key={i} className="p-5 flex items-start gap-4">
              <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
                ins.type === 'positive' ? 'bg-green-50' : ins.type === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                {ins.type === 'positive' ? <TrendingUp className="h-4 w-4 text-green-600" /> :
                 ins.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-600" /> :
                 <TrendingDown className="h-4 w-4 text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{ins.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ins.desc}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-sm font-black text-purple-600">{ins.confidence}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
