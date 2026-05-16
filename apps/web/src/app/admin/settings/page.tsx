'use client';

import { useState } from 'react';
import { Store, Truck, CreditCard, Info, CheckCircle, XCircle } from 'lucide-react';

type TabId = 'store' | 'shipping' | 'payment' | 'about';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'store', label: 'Store Info', icon: Store },
  { id: 'shipping', label: 'Shipping Rates', icon: Truck },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  { id: 'about', label: 'About', icon: Info },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center py-3 border-b last:border-0">
      <span className="w-40 flex-shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function DevNote() {
  return (
    <p className="mt-4 rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">Note:</span> These settings are managed at the server level. Contact the developer to make changes.
    </p>
  );
}

function StoreInfoTab() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="font-semibold">Store Information</h2>
        <p className="text-sm text-muted-foreground">Basic information about your store</p>
      </div>
      <div className="rounded-xl border bg-card px-5">
        <InfoRow label="Store Name" value="Unkora" />
        <InfoRow label="Tagline" value="Your Bangladeshi Bookstore & Marketplace" />
        <InfoRow label="Phone" value="+880 1700-000000" />
        <InfoRow label="Email" value="support@unkora.com" />
        <InfoRow label="Address" value="Dhaka, Bangladesh" />
        <InfoRow label="Currency" value="BDT (৳)" />
        <InfoRow label="Language" value="English / বাংলা" />
        <InfoRow label="Timezone" value="Asia/Dhaka (GMT+6)" />
      </div>
      <DevNote />
    </div>
  );
}

function ShippingTab() {
  const rates = [
    { zone: 'Dhaka City', time: '1–2 days', cost: '৳60', threshold: null },
    { zone: 'Outside Dhaka', time: '3–5 days', cost: '৳100', threshold: null },
    { zone: 'Free Shipping', time: 'On orders above ৳500', cost: 'Free', threshold: '৳500+' },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-semibold">Shipping Rates</h2>
        <p className="text-sm text-muted-foreground">Current configured shipping zones and rates</p>
      </div>
      <div className="space-y-3">
        {rates.map(rate => (
          <div
            key={rate.zone}
            className="flex items-center justify-between rounded-xl border bg-card px-5 py-4"
          >
            <div>
              <p className="font-medium">{rate.zone}</p>
              <p className="text-xs text-muted-foreground">{rate.time}</p>
              {rate.threshold && (
                <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  Threshold: {rate.threshold}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">{rate.cost}</p>
            </div>
          </div>
        ))}
      </div>
      <DevNote />
    </div>
  );
}

function PaymentTab() {
  const methods = [
    { id: 'bkash', name: 'bKash', type: 'Mobile Banking', enabled: true, color: 'bg-pink-50 border-pink-200' },
    { id: 'nagad', name: 'Nagad', type: 'Mobile Banking', enabled: true, color: 'bg-orange-50 border-orange-200' },
    { id: 'cod', name: 'Cash on Delivery', type: 'Cash', enabled: true, color: 'bg-green-50 border-green-200' },
    { id: 'card', name: 'Credit / Debit Card', type: 'Online Payment', enabled: false, color: 'bg-muted border-muted-foreground/20' },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-semibold">Payment Methods</h2>
        <p className="text-sm text-muted-foreground">Configured payment options for your store</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map(method => (
          <div
            key={method.id}
            className={`flex items-center justify-between rounded-xl border px-5 py-4 ${method.color}`}
          >
            <div>
              <p className="font-semibold">{method.name}</p>
              <p className="text-xs text-muted-foreground">{method.type}</p>
            </div>
            <div className="flex items-center gap-2">
              {method.enabled ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Enabled</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Disabled</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Note:</span> Payment method toggles are UI indicators only. To enable or disable payment methods, contact the developer.
      </p>
    </div>
  );
}

function AboutTab() {
  const info = [
    { label: 'Application', value: 'Unkora Admin Panel' },
    { label: 'Version', value: 'v1.0.0' },
    { label: 'Framework', value: 'Next.js 15 (App Router)' },
    { label: 'Language', value: 'TypeScript' },
    { label: 'Database', value: 'PostgreSQL (via Prisma ORM)' },
    { label: 'API', value: 'NestJS REST API' },
    { label: 'Deployment', value: 'Production' },
    { label: 'Support Email', value: 'dev@unkora.com' },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-semibold">About Unkora</h2>
        <p className="text-sm text-muted-foreground">System and application information</p>
      </div>
      <div className="rounded-xl border bg-card px-5">
        {info.map(item => (
          <InfoRow key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
      <div className="mt-4 rounded-xl border bg-card px-5 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tech Stack</p>
        <div className="flex flex-wrap gap-2">
          {['Next.js 15', 'TypeScript', 'Tailwind CSS', 'TanStack Query', 'Zustand', 'NestJS', 'Prisma', 'PostgreSQL', 'Redis'].map(tech => (
            <span
              key={tech}
              className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('store');

  const tabContent: Record<TabId, React.ReactNode> = {
    store: <StoreInfoTab />,
    shipping: <ShippingTab />,
    payment: <PaymentTab />,
    about: <AboutTab />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Store configuration and system information</p>
      </div>

      <div className="flex gap-6 flex-col sm:flex-row">
        {/* Sidebar tabs */}
        <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible sm:w-44 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap sm:whitespace-normal text-left ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{tabContent[activeTab]}</div>
      </div>
    </div>
  );
}
