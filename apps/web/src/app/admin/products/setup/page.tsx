'use client';

import Link from 'next/link';
import { Tag, Palette, Sliders, Ruler, ShieldCheck, Bookmark, ArrowRight } from 'lucide-react';

const setupLinks = [
  {
    href: '/admin/products/setup/brands',
    icon: Bookmark,
    title: 'Brands',
    description: 'Manage product brands and manufacturers',
    color: 'bg-blue-500',
  },
  {
    href: '/admin/products/setup/colors',
    icon: Palette,
    title: 'Colors',
    description: 'Define colors for product variants',
    color: 'bg-purple-500',
  },
  {
    href: '/admin/products/setup/attributes',
    icon: Sliders,
    title: 'Attributes',
    description: 'Create product attributes like Size, Material',
    color: 'bg-orange-500',
  },
  {
    href: '/admin/products/setup/size-guides',
    icon: Ruler,
    title: 'Size Guides',
    description: 'Create size guide charts for clothing/shoes',
    color: 'bg-green-500',
  },
  {
    href: '/admin/products/setup/warranties',
    icon: ShieldCheck,
    title: 'Warranties',
    description: 'Define warranty policies for products',
    color: 'bg-teal-500',
  },
  {
    href: '/admin/products/setup/labels',
    icon: Tag,
    title: 'Product Labels',
    description: 'Create labels like "New", "Hot", "Sale"',
    color: 'bg-red-500',
  },
];

export default function ProductSetupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Product Setup</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure product attributes, brands, and other metadata</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {setupLinks.map(({ href, icon: Icon, title, description, color }) => (
          <Link key={href} href={href}
            className="group flex items-start gap-4 rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color} text-white shadow`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
