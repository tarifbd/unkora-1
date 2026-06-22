'use client';

import { useState } from 'react';
import { Tag, CheckCircle, XCircle, Loader2, Copy, Check } from 'lucide-react';
import { couponsApi } from '@/lib/api/coupons';
import { formatCurrency } from '@/lib/utils';

function CouponChecker() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; discount?: number; message?: string } | null>(null);

  const check = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await couponsApi.validate(code.trim().toUpperCase(), 1000);
      setResult({ valid: res.valid, discount: res.discountAmount });
    } catch {
      setResult({ valid: false, message: 'কুপন কোড অবৈধ বা মেয়াদোত্তীর্ণ।' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Tag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">কুপন কোড যাচাই করুন</h2>
          <p className="text-xs text-gray-500">Check if a coupon code is valid</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="UNKORA20"
          className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-primary transition-colors uppercase"
        />
        <button
          onClick={check}
          disabled={loading || !code.trim()}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? 'যাচাই...' : 'যাচাই করুন'}
        </button>
      </div>

      {result && (
        <div className={`mt-3 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${result.valid ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
          {result.valid
            ? <><CheckCircle className="w-4 h-4 flex-shrink-0" /> কুপন বৈধ! {result.discount ? `${formatCurrency(result.discount)} ছাড় পাবেন।` : 'ছাড় পাওয়া যাবে।'}</>
            : <><XCircle className="w-4 h-4 flex-shrink-0" /> {result.message ?? 'এই কুপন ব্যবহারযোগ্য নয়।'}</>
          }
        </div>
      )}
    </div>
  );
}

function CouponCard({ code, description, discountType, discountValue, minOrderValue, expiresAt }: {
  code: string; description?: string; discountType: string; discountValue: string;
  minOrderValue?: string; expiresAt?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const isExpiringSoon = expiresAt && new Date(expiresAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="bg-white rounded-2xl border border-dashed border-primary/40 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-2xl" />
      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-black text-primary text-lg tracking-widest">{code}</span>
              {isExpiringSoon && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">শেষ হচ্ছে!</span>
              )}
            </div>
            {description && <p className="text-xs text-gray-600 mb-1">{description}</p>}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
              <span className="font-semibold text-primary">
                {discountType === 'PERCENTAGE' ? `${discountValue}% ছাড়` : `৳${discountValue} ছাড়`}
              </span>
              {minOrderValue && parseFloat(minOrderValue) > 0 && (
                <span>ন্যূনতম অর্ডার ৳{minOrderValue}</span>
              )}
              {expiresAt && (
                <span>মেয়াদ: {new Date(expiresAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              )}
            </div>
          </div>
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'কপি হয়েছে' : 'কপি করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CouponsPage() {
  const SAMPLE_COUPONS = [
    { code: 'UNKORA20', description: 'সকল বই অর্ডারে ২০% ছাড়', discountType: 'PERCENTAGE', discountValue: '20', minOrderValue: '500' },
    { code: 'NEWUSER50', description: 'নতুন ব্যবহারকারীদের জন্য ৳৫০ ছাড়', discountType: 'FIXED', discountValue: '50', minOrderValue: '300' },
    { code: 'BOOK10', description: 'যেকোনো বই কিনলে ১০% ছাড়', discountType: 'PERCENTAGE', discountValue: '10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">কুপন</h1>
        <p className="text-sm text-gray-500 mt-1">আপনার কুপন কোড ব্যবহার করুন এবং সাশ্রয় করুন</p>
      </div>

      <CouponChecker />

      <div>
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" /> উপলব্ধ অফার
        </h2>
        <div className="space-y-3">
          {SAMPLE_COUPONS.map(c => (
            <CouponCard key={c.code} {...c} />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">চেকআউটের সময় কোড প্রয়োগ করুন। একটি অর্ডারে একটি কুপন ব্যবহারযোগ্য।</p>
      </div>
    </div>
  );
}
