'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Tag, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { couponsApi } from '@/lib/api/coupons';
import { formatCurrency } from '@/lib/utils';

interface CouponInputProps {
  orderTotal: number;
  onApply: (discount: number, code: string) => void;
  onRemove: () => void;
}

export function CouponInput({ orderTotal, onApply, onRemove }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const validateMutation = useMutation({
    mutationFn: () => couponsApi.validate(code.trim().toUpperCase(), orderTotal),
    onSuccess: (data) => {
      if (data.valid) {
        setApplied({ code: data.coupon.code, discount: data.discountAmount });
        setErrorMsg(null);
        onApply(data.discountAmount, data.coupon.code);
      } else {
        setErrorMsg('This coupon is not valid for your order.');
      }
    },
    onError: () => {
      setErrorMsg('Invalid or expired coupon code.');
    },
  });

  const handleApply = () => {
    if (!code.trim()) return;
    setErrorMsg(null);
    validateMutation.mutate();
  };

  const handleRemove = () => {
    setApplied(null);
    setCode('');
    setErrorMsg(null);
    onRemove();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Coupon <span className="font-bold">{applied.code}</span> applied
            </p>
            <p className="text-xs text-green-600">
              You save {formatCurrency(applied.discount)}
            </p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-green-700 hover:bg-green-100 transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        <Tag className="h-4 w-4" /> Coupon Code
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value); setErrorMsg(null); }}
          onKeyDown={handleKeyDown}
          placeholder="Enter coupon code"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={validateMutation.isPending}
        />
        <button
          onClick={handleApply}
          disabled={validateMutation.isPending || !code.trim()}
          className="flex items-center gap-1.5 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
        >
          {validateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Apply
        </button>
      </div>
      {errorMsg && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {errorMsg}
        </p>
      )}
    </div>
  );
}
