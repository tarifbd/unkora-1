'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import { useAuthStore } from '@/store/auth.store';
import { ordersApi } from '@/lib/api/orders';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().min(11, 'Valid phone number required'),
  addressLine1: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  district: z.string().min(2, 'District is required'),
  division: z.string().min(2, 'Division is required'),
  postalCode: z.string().optional(),
  paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD']),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const DIVISIONS = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading } = useCart();
  const { isAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'COD' },
  });

  const paymentMethod = watch('paymentMethod');

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <p className="mb-4 text-muted-foreground">Please sign in to checkout</p>
        <Link href="/login" className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) return (
    <div className="container py-20 flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p className="mb-4 text-muted-foreground">Your cart is empty</p>
        <Link href="/products" className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Browse Products
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const shipping = subtotal >= 1000 ? 0 : 80;
  const total = subtotal + shipping;

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    try {
      const order = await ordersApi.create({
        shippingAddress: {
          fullName: data.fullName,
          phone: data.phone,
          addressLine1: data.addressLine1,
          city: data.city,
          district: data.district,
          division: data.division,
          postalCode: data.postalCode,
          country: 'Bangladesh',
        },
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch {
      setIsSubmitting(false);
    }
  };

  const inputCls = (err?: { message?: string }) =>
    `w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${err ? 'border-destructive' : ''}`;

  return (
    <div className="container py-8">
      <h1 className="mb-6 font-serif text-2xl font-bold">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4" /> Shipping Address
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Full Name</label>
                <input {...register('fullName')} className={inputCls(errors.fullName)} placeholder="Enter your full name" />
                {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input {...register('phone')} className={inputCls(errors.phone)} placeholder="01XXXXXXXXX" />
                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Postal Code</label>
                <input {...register('postalCode')} className={inputCls()} placeholder="Optional" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Address</label>
                <input {...register('addressLine1')} className={inputCls(errors.addressLine1)} placeholder="House, Road, Area" />
                {errors.addressLine1 && <p className="mt-1 text-xs text-destructive">{errors.addressLine1.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">City</label>
                <input {...register('city')} className={inputCls(errors.city)} placeholder="City" />
                {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">District</label>
                <input {...register('district')} className={inputCls(errors.district)} placeholder="District" />
                {errors.district && <p className="mt-1 text-xs text-destructive">{errors.district.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Division</label>
                <select {...register('division')} className={inputCls(errors.division)}>
                  <option value="">Select Division</option>
                  {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.division && <p className="mt-1 text-xs text-destructive">{errors.division.message}</p>}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4" /> Payment Method
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: 'COD', label: 'Cash on Delivery', desc: 'Pay when delivered' },
                { value: 'BKASH', label: 'bKash', desc: 'Mobile banking' },
                { value: 'NAGAD', label: 'Nagad', desc: 'Mobile banking' },
              ].map(opt => (
                <label key={opt.value} className={`flex cursor-pointer flex-col gap-1 rounded-lg border-2 p-4 transition-colors ${paymentMethod === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                  <input type="radio" {...register('paymentMethod')} value={opt.value} className="sr-only" />
                  <span className="font-medium text-sm">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          <div className="rounded-xl border bg-card p-6">
            <label className="mb-2 block text-sm font-medium">Order Notes (Optional)</label>
            <textarea {...register('notes')} rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Any special instructions for your order..." />
          </div>
        </div>

        {/* Order Summary */}
        <div className="h-fit rounded-xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Order Summary</h2>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {cart.items.map(item => (
              <div key={item.id} className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground line-clamp-2">{item.product.name} × {item.quantity}</span>
                <span className="flex-shrink-0 font-medium">{formatCurrency(Number(item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatCurrency(shipping)}</span>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-brand-600">{formatCurrency(total)}</span>
          </div>

          <button type="submit" disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Place Order
          </button>
        </div>
      </form>
    </div>
  );
}
