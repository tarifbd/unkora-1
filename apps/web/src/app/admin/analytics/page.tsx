'use client';
import Link from 'next/link';
import { BarChart3, Target, Tag, Globe, CheckCircle2, XCircle } from 'lucide-react';

const TOOLS = [
  { href: '/admin/analytics/google-analytics', icon: BarChart3, title: 'Google Analytics 4', desc: 'Track traffic, conversions and user behavior with GA4 measurement', color: '#f97316', badge: 'GA4', configured: false },
  { href: '/admin/analytics/google-tag-manager', icon: Tag, title: 'Google Tag Manager', desc: 'Manage all tracking tags from one place without touching code', color: '#3b82f6', badge: 'GTM', configured: false },
  { href: '/admin/analytics/meta-pixel', icon: Target, title: 'Meta Pixel & CAPI', desc: 'Facebook & Instagram conversion tracking with Conversions API', color: '#1877f2', badge: 'META', configured: false },
  { href: '/admin/analytics/google-search-console', icon: Globe, title: 'Google Search Console', desc: 'Monitor SEO performance, indexing status and search visibility', color: '#10b981', badge: 'GSC', configured: false },
];

export default function AnalyticsHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Marketing Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure tracking pixels and analytics integrations for your store</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-2xl border bg-card p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="rounded-xl p-3" style={{ background: tool.color + '15' }}>
                <tool.icon className="h-6 w-6" style={{ color: tool.color }} />
              </div>
              <div className="flex items-center gap-2">
                {tool.configured
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: tool.color + '15', color: tool.color }}>
                  {tool.badge}
                </span>
              </div>
            </div>
            <h3 className="font-bold text-base group-hover:text-primary transition-colors">{tool.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{tool.desc}</p>
            <p className="text-xs mt-3 font-medium" style={{ color: tool.color }}>
              Configure →
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Tip:</span> For best results, use Google Tag Manager to manage all your tags (GA4, Meta Pixel, etc.) from a single container. This reduces code complexity and allows non-developers to add tags.
        </p>
      </div>
    </div>
  );
}
