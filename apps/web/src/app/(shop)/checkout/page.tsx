'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2, MapPin, CheckCircle, ChevronDown, Truck, Smartphone, Banknote,
  ShieldCheck, Tag, Package, Store, Clock, Phone, LogIn, UserCheck, ShoppingBag,
  CreditCard, Building2,
} from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import { useAuthStore } from '@/store/auth.store';
import { useGuestCart } from '@/store/guest-cart.store';
import { ordersApi } from '@/lib/api/orders';
import { cartApi } from '@/lib/api/cart';
import { authApi } from '@/lib/api/auth';
import { productsApi } from '@/lib/api/products';
import { formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { CouponInput } from '@/components/checkout/coupon-input';
import { useLanguage } from '@/lib/i18n/language-context';
import { useQuery } from '@tanstack/react-query';
import { pickupPointsApi, type PickupPoint } from '@/lib/api/pickup-points';

const schema = z.object({
  fullName:    z.string().min(2, 'নাম দিন'),
  phone:       z.string().min(11, 'সঠিক ফোন নম্বর দিন'),
  addressLine1:z.string().optional(),
  city:        z.string().optional(),
  district:    z.string().optional(),
  division:    z.string().optional(),
  postalCode:  z.string().optional(),
  paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD', 'CARD', 'BANK_TRANSFER']),
  guestEmail:  z.string().email().optional().or(z.literal('')),
  notes:       z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const DIVISIONS = ['Dhaka','Chittagong','Sylhet','Rajshahi','Khulna','Barisal','Rangpur','Mymensingh'];

const PAYMENT_OPTIONS = [
  {
    value: 'COD',
    icon: Banknote,
    label: 'ক্যাশ অন ডেলিভারি',
    labelEn: 'Cash on Delivery',
    desc: 'পণ্য পেয়ে টাকা দিন',
    descEn: 'Pay when you receive',
    highlight: true,
  },
  {
    value: 'BKASH',
    icon: Smartphone,
    label: 'বিকাশ',
    labelEn: 'bKash',
    desc: 'মোবাইল পেমেন্ট',
    descEn: 'Mobile payment',
    highlight: false,
  },
  {
    value: 'NAGAD',
    icon: Smartphone,
    label: 'নগদ',
    labelEn: 'Nagad',
    desc: 'মোবাইল পেমেন্ট',
    descEn: 'Mobile payment',
    highlight: false,
  },
  {
    value: 'CARD',
    icon: CreditCard,
    label: 'কার্ড পেমেন্ট',
    labelEn: 'Card Payment',
    desc: 'SSLCommerz — Visa / Mastercard',
    descEn: 'SSLCommerz — Visa / Mastercard',
    highlight: false,
  },
  {
    value: 'BANK_TRANSFER',
    icon: Building2,
    label: 'ব্যাংক ট্রান্সফার',
    labelEn: 'Bank Transfer',
    desc: 'সরাসরি ব্যাংকে পাঠান',
    descEn: 'Direct bank transfer',
    highlight: false,
  },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, isLoading: cartLoading } = useCart();
  const { isAuthenticated } = useAuthStore();
  const guestCart = useGuestCart();
  const { lang } = useLanguage();
  const queryClient = useQueryClient();

  const [deliveryMode, setDeliveryMode] = useState<'HOME' | 'PICKUP'>('HOME');
  const [selectedPickup, setSelectedPickup] = useState<PickupPoint | null>(null);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [quickBuyItem, setQuickBuyItem] = useState<{ productId: string; name: string; price: number; quantity: number; image?: string } | null>(null);
  const [quickBuyLoading, setQuickBuyLoading] = useState(false);
  const [addressFilled, setAddressFilled] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deviceFingerprint] = useState(() => {
    if (typeof window === 'undefined') return '';
    const nav = window.navigator;
    const parts = [
      nav.userAgent, nav.language, nav.hardwareConcurrency,
      screen.width, screen.height, screen.colorDepth,
      new Date().getTimezoneOffset(),
      nav.platform ?? '',
    ];
    let hash = 0;
    const str = parts.join('|');
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36);
  });

  const productSlug = searchParams.get('productSlug') ?? searchParams.get('productId');
  const qty = searchParams.get('qty');
  // Derived — re-evaluates whenever searchParams changes (no useState needed)
  const showAuthChoice = !isAuthenticated && searchParams.get('guest') !== '1';

  // Silently request geolocation for fraud detection
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000, enableHighAccuracy: false },
      );
    }
  }, []);

  // Fetch active pickup points
  const { data: pickupPoints = [] } = useQuery({
    queryKey: ['pickup-points'],
    queryFn: pickupPointsApi.getActive,
    staleTime: 5 * 60 * 1000,
  });
  const hasPickupPoints = pickupPoints.length > 0;

  // Fetch saved addresses for logged-in users
  const { data: savedAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => authApi.getAddresses(),
    enabled: isAuthenticated,
  });

  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'COD' },
  });

  const paymentMethod = watch('paymentMethod');

  // Auto-fill first saved address
  useEffect(() => {
    if (isAuthenticated && savedAddresses?.length && !addressFilled) {
      const addr = savedAddresses[0];
      setValue('fullName',     addr.recipientName ?? addr.fullName ?? '');
      setValue('phone',        addr.phone ?? '');
      setValue('addressLine1', addr.addressLine1 ?? '');
      setValue('city',         addr.city ?? '');
      setValue('district',     addr.district ?? '');
      setValue('division',     addr.division ?? '');
      setValue('postalCode',   addr.postalCode ?? '');
      setAddressFilled(true);
    }
  }, [savedAddresses, isAuthenticated, addressFilled, setValue]);

  // Fetch quick-buy product (by slug — supports both /checkout?productSlug=xxx and legacy ?productId=xxx)
  useEffect(() => {
    if (!productSlug) return;
    setQuickBuyLoading(true);
    productsApi.getBySlug(productSlug).then(p => {
      const price = Number(p.salePrice ?? p.basePrice);
      setQuickBuyItem({
        productId: p.id,
        name: p.name,
        price,
        quantity: qty ? Math.max(1, parseInt(qty, 10)) : 1,
        image: p.images?.[0]?.url,
      });
    }).catch(() => {}).finally(() => setQuickBuyLoading(false));
  }, [productSlug, qty]);

  const displayItems = quickBuyItem
    ? [{ id: quickBuyItem.productId, name: quickBuyItem.name, price: quickBuyItem.price, quantity: quickBuyItem.quantity, image: quickBuyItem.image }]
    : isAuthenticated && cart
    ? cart.items.map(i => ({ id: i.id, name: i.product.name, price: Number(i.price), quantity: i.quantity, image: i.product.images?.[0]?.url }))
    : guestCart.items.map(i => ({ id: i.productId, name: i.name, price: i.price, quantity: i.quantity, image: i.image }));

  const subtotal = displayItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = deliveryMode === 'PICKUP' ? 0 : (subtotal >= 1000 ? 0 : 80);
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const total = subtotal + shipping - couponDiscount;

  const isPageLoading = cartLoading || quickBuyLoading;

  const onSubmit = async (data: FormData) => {
    // Validate delivery-specific requirements before submitting
    if (deliveryMode === 'PICKUP') {
      if (!selectedPickup) {
        setPickupError(lang === 'bn' ? 'একটি পিকআপ পয়েন্ট বেছে নিন' : 'Please select a pickup point');
        return;
      }
    } else {
      let hasError = false;
      if (!data.addressLine1 || data.addressLine1.length < 5) {
        setError('addressLine1', { message: lang === 'bn' ? 'ঠিকানা দিন' : 'Enter address' });
        hasError = true;
      }
      if (!data.city || data.city.length < 2) {
        setError('city', { message: lang === 'bn' ? 'শহর দিন' : 'Enter city' });
        hasError = true;
      }
      if (!data.district || data.district.length < 2) {
        setError('district', { message: lang === 'bn' ? 'জেলা দিন' : 'Enter district' });
        hasError = true;
      }
      if (!data.division || data.division.length < 2) {
        setError('division', { message: lang === 'bn' ? 'বিভাগ বেছে নিন' : 'Select division' });
        hasError = true;
      }
      if (hasError) return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const items = quickBuyItem
        ? [{ productId: quickBuyItem.productId, quantity: quickBuyItem.quantity }]
        : isAuthenticated && cart
        ? cart.items.map(i => ({ productId: i.productId, quantity: i.quantity }))
        : guestCart.items.map(i => ({ productId: i.productId, quantity: i.quantity }));

      const shippingAddress = deliveryMode === 'PICKUP' && selectedPickup
        ? {
            fullName: data.fullName,
            phone: data.phone,
            addressLine1: selectedPickup.address,
            city: selectedPickup.city,
            district: selectedPickup.district,
            division: 'Dhaka',
            postalCode: '',
            pickupPoint: selectedPickup.name,
          }
        : {
            fullName: data.fullName,
            phone: data.phone,
            addressLine1: data.addressLine1 ?? '',
            city: data.city ?? '',
            district: data.district ?? '',
            division: data.division ?? '',
            postalCode: data.postalCode ?? '',
          };

      const pickupNote = deliveryMode === 'PICKUP' && selectedPickup
        ? `[পিকআপ: ${selectedPickup.name}, ${selectedPickup.address}, ${selectedPickup.city}]`
        : '';
      const notes = pickupNote
        ? (data.notes ? `${pickupNote} ${data.notes}` : pickupNote)
        : data.notes;

      const order = await ordersApi.createGuest({
        items,
        shippingAddress,
        paymentMethod: data.paymentMethod,
        guestName: data.fullName,
        guestPhone: data.phone,
        guestEmail: data.guestEmail || undefined,
        notes,
        deviceFingerprint,
        geoLat: geoCoords?.lat,
        geoLng: geoCoords?.lng,
      });

      if (!isAuthenticated) {
        guestCart.clearCart();
      } else if (!quickBuyItem) {
        try { await cartApi.clear(); } catch { /* ignore */ }
        void queryClient.invalidateQueries({ queryKey: ['cart'] });
      }

      if (data.paymentMethod === 'CARD') {
        try {
          const { default: apiClient } = await import('@/lib/api');
          const gatewayRes = await apiClient.post(`/payments/${order.id}/sslcommerz`);
          const redirectUrl = gatewayRes.data?.data?.redirectGatewayURL ?? gatewayRes.data?.redirectGatewayURL;
          if (redirectUrl) { window.location.href = redirectUrl; return; }
        } catch { /* fall through to success page */ }
      }
      router.push(`/checkout/success?orderId=${order.id}&orderNumber=${encodeURIComponent(order.orderNumber)}`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setSubmitError(lang === 'bn' ? 'অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Failed to place order. Please try again.');
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Package className="w-14 h-14 text-gray-200" />
        <p className="text-gray-500 font-medium">{lang === 'bn' ? 'কোনো পণ্য নেই' : 'No items to checkout'}</p>
        <Link href="/products" className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
          {lang === 'bn' ? 'পণ্য দেখুন' : 'Browse Products'}
        </Link>
      </div>
    );
  }

  const field = (cls = '') =>
    `w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${cls}`;

  // Auth choice modal — shown to unauthenticated users before checkout form
  if (showAuthChoice) {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/checkout';
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-100 shadow-xl p-8 flex flex-col items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-900 mb-1">
              {lang === 'bn' ? 'অর্ডার করতে চান?' : 'Ready to order?'}
            </h2>
            <p className="text-sm text-gray-400">
              {lang === 'bn' ? 'লগইন করুন অথবা গেস্ট হিসেবে চালিয়ে যান' : 'Sign in or continue as guest'}
            </p>
          </div>
          <div className="w-full space-y-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(currentUrl)}`}
              className="flex w-full items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl font-black text-sm hover:bg-primary/90 active:scale-[.98] transition-all shadow-md shadow-primary/20"
            >
              <LogIn className="w-4 h-4" />
              {lang === 'bn' ? 'লগইন করুন' : 'Sign In'}
            </Link>
            <button
              type="button"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('guest', '1');
                router.push(url.pathname + url.search);
              }}
              className="flex w-full items-center justify-center gap-2 py-3.5 border-2 border-gray-200 rounded-2xl font-black text-sm text-gray-700 hover:border-primary hover:text-primary active:scale-[.98] transition-all"
            >
              <UserCheck className="w-4 h-4" />
              {lang === 'bn' ? 'গেস্ট হিসেবে চালিয়ে যান' : 'Continue as Guest'}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 text-center">
            {lang === 'bn'
              ? 'লগইন করলে অর্ডার ট্র্যাক করতে এবং পরবর্তীতে দ্রুত কিনতে পারবেন'
              : 'Sign in to track orders and checkout faster next time'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">{lang === 'bn' ? 'দ্রুত অর্ডার করুন' : 'Quick Checkout'}</h1>
          <p className="text-xs text-gray-400">{lang === 'bn' ? 'মাত্র কয়েক সেকেন্ডে অর্ডার সম্পন্ন করুন' : 'Complete your order in seconds'}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          {lang === 'bn' ? '১০০% নিরাপদ' : '100% Secure'}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-5">

          {/* ── Left: Form ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-black">১</span>
                {lang === 'bn' ? 'যোগাযোগের তথ্য' : 'Contact Info'}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    {lang === 'bn' ? 'আপনার নাম' : 'Full Name'} <span className="text-red-400">*</span>
                  </label>
                  <input {...register('fullName')} placeholder={lang === 'bn' ? 'আপনার পুরো নাম' : 'Your full name'} className={field(errors.fullName ? 'border-red-300' : '')} />
                  {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'} <span className="text-red-400">*</span>
                  </label>
                  <input {...register('phone')} placeholder="01XXXXXXXXX" className={field(errors.phone ? 'border-red-300' : '')} />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                </div>
                {!isAuthenticated && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">
                      {lang === 'bn' ? 'ইমেইল' : 'Email'} <span className="text-gray-400 font-normal">{lang === 'bn' ? '(ঐচ্ছিক)' : '(optional)'}</span>
                    </label>
                    <input {...register('guestEmail')} type="email" placeholder="you@example.com" className={field()} />
                  </div>
                )}
              </div>
            </div>

            {/* Delivery address / pickup */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-black">২</span>
                  <MapPin className="w-4 h-4 text-primary" />
                  {lang === 'bn' ? 'ডেলিভারি পদ্ধতি' : 'Delivery Method'}
                </h2>
                {isAuthenticated && savedAddresses?.length > 1 && deliveryMode === 'HOME' && (
                  <select
                    onChange={e => {
                      const addr = savedAddresses[parseInt(e.target.value)];
                      if (!addr) return;
                      setValue('fullName', addr.recipientName ?? addr.fullName ?? '');
                      setValue('phone', addr.phone ?? '');
                      setValue('addressLine1', addr.addressLine1 ?? '');
                      setValue('city', addr.city ?? '');
                      setValue('district', addr.district ?? '');
                      setValue('division', addr.division ?? '');
                    }}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-primary font-bold focus:outline-none"
                  >
                    {savedAddresses.map((a: any, i: number) => (
                      <option key={i} value={i}>{a.label ?? `Address ${i + 1}`}</option>
                    ))}
                  </select>
                )}
              </div>
              {/* Delivery method toggle */}
              {hasPickupPoints && (
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => { setDeliveryMode('HOME'); setPickupError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                      deliveryMode === 'HOME'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    {lang === 'bn' ? 'হোম ডেলিভারি' : 'Home Delivery'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeliveryMode('PICKUP'); setPickupError(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                      deliveryMode === 'PICKUP'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    {lang === 'bn' ? 'স্টোর পিকআপ' : 'Store Pickup'}
                  </button>
                </div>
              )}

              {/* Pickup point list */}
              {deliveryMode === 'PICKUP' && (
                <div className="space-y-2">
                  {pickupPoints.map(pt => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => { setSelectedPickup(pt); setPickupError(null); }}
                      className={`w-full text-left rounded-xl border-2 p-3.5 transition-all ${
                        selectedPickup?.id === pt.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedPickup?.id === pt.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Store className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-gray-900">{pt.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{pt.address}, {pt.city}, {pt.district}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {pt.phone && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Phone className="w-3 h-3" />{pt.phone}
                              </span>
                            )}
                            {pt.openHours && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Clock className="w-3 h-3" />{pt.openHours}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center ${
                          selectedPickup?.id === pt.id ? 'border-primary' : 'border-gray-300'
                        }`}>
                          {selectedPickup?.id === pt.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                    </button>
                  ))}
                  {pickupError && <p className="text-xs text-red-500 mt-1">{pickupError}</p>}
                </div>
              )}

              {/* Address form — only for home delivery */}
              {deliveryMode === 'HOME' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    {lang === 'bn' ? 'সম্পূর্ণ ঠিকানা' : 'Street Address'} <span className="text-red-400">*</span>
                  </label>
                  <input {...register('addressLine1')} placeholder={lang === 'bn' ? 'বাড়ি নম্বর, রোড, এলাকা' : 'House no, road, area'} className={field(errors.addressLine1 ? 'border-red-300' : '')} />
                  {errors.addressLine1 && <p className="mt-1 text-xs text-red-500">{errors.addressLine1.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">{lang === 'bn' ? 'শহর / থানা' : 'City / Thana'} <span className="text-red-400">*</span></label>
                    <input {...register('city')} placeholder={lang === 'bn' ? 'শহর' : 'City'} className={field(errors.city ? 'border-red-300' : '')} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">{lang === 'bn' ? 'জেলা' : 'District'} <span className="text-red-400">*</span></label>
                    <input {...register('district')} placeholder={lang === 'bn' ? 'জেলা' : 'District'} className={field(errors.district ? 'border-red-300' : '')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">{lang === 'bn' ? 'বিভাগ' : 'Division'} <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <select {...register('division')} className={field(errors.division ? 'border-red-300 pr-8' : 'pr-8') + ' appearance-none'}>
                        <option value="">{lang === 'bn' ? 'বিভাগ বেছে নিন' : 'Select division'}</option>
                        {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">{lang === 'bn' ? 'পোস্টাল কোড' : 'Postal Code'} <span className="text-gray-400 font-normal">{lang === 'bn' ? '(ঐচ্ছিক)' : '(opt.)'}</span></label>
                    <input {...register('postalCode')} placeholder="1200" className={field()} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">{lang === 'bn' ? 'বিশেষ নির্দেশনা' : 'Order Notes'} <span className="text-gray-400 font-normal">{lang === 'bn' ? '(ঐচ্ছিক)' : '(optional)'}</span></label>
                  <textarea {...register('notes')} rows={2} placeholder={lang === 'bn' ? 'কোনো বিশেষ নির্দেশনা থাকলে লিখুন...' : 'Any special instructions...'} className={field() + ' resize-none'} />
                </div>
              </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-black">{lang === 'bn' ? '৩' : '3'}</span>
                {lang === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}
              </h2>
              <div className="space-y-2.5">
                {PAYMENT_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all ${
                      paymentMethod === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <input type="radio" {...register('paymentMethod')} value={opt.value} className="sr-only" />
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${paymentMethod === opt.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <opt.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-gray-900">{lang === 'bn' ? opt.label : opt.labelEn}</p>
                      <p className="text-xs text-gray-400">{lang === 'bn' ? opt.desc : opt.descEn}</p>
                    </div>
                    {opt.highlight && (
                      <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
                        {lang === 'bn' ? 'জনপ্রিয়' : 'Popular'}
                      </span>
                    )}
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === opt.value ? 'border-primary' : 'border-gray-300'}`}>
                      {paymentMethod === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Order summary ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  {lang === 'bn' ? 'অর্ডার সামারি' : 'Order Summary'}
                </h2>

                {/* Items */}
                <div className="space-y-3 mb-4 max-h-52 overflow-y-auto">
                  {displayItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      {item.image
                        ? <Image src={item.image} alt={item.name} width={40} height={40} unoptimized className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-50" />
                        : <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">📚</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 line-clamp-2">{item.name}</p>
                        <p className="text-[10px] text-gray-400">×{item.quantity}</p>
                      </div>
                      <p className="text-sm font-black text-primary flex-shrink-0">৳{(item.price * item.quantity).toLocaleString('en-BD')}</p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t pt-3 mb-3">
                  <CouponInput
                    orderTotal={subtotal}
                    onApply={(discount, code) => setAppliedCoupon({ discount, code })}
                    onRemove={() => setAppliedCoupon(null)}
                  />
                </div>

                {/* Totals */}
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>{lang === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</span>
                    <span>৳{subtotal.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{lang === 'bn' ? 'ডেলিভারি' : 'Delivery'}</span>
                    {shipping === 0
                      ? <span className="text-green-600 font-bold">{lang === 'bn' ? 'ফ্রি' : 'Free'}</span>
                      : <span>৳{shipping}</span>
                    }
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{appliedCoupon?.code}</span>
                      <span>-৳{couponDiscount}</span>
                    </div>
                  )}
                  {deliveryMode === 'PICKUP' && (
                    <p className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-lg font-bold">
                      {lang === 'bn' ? '🎉 পিকআপে ডেলিভারি চার্জ নেই!' : '🎉 No delivery charge for store pickup!'}
                    </p>
                  )}
                  {deliveryMode === 'HOME' && subtotal < 1000 && (
                    <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                      {lang === 'bn' ? `আরও ৳${1000 - subtotal} কিনলে ফ্রি ডেলিভারি!` : `Add ৳${1000 - subtotal} more for free delivery!`}
                    </p>
                  )}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-black text-base">
                  <span>{lang === 'bn' ? 'মোট' : 'Total'}</span>
                  <span className="text-primary">৳{Math.max(0, total).toLocaleString('en-BD')}</span>
                </div>
              </div>

              {/* Error */}
              {submitError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                  {submitError}
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl text-base font-black hover:bg-primary/90 active:scale-[.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-60"
              >
                {isSubmitting
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> {lang === 'bn' ? 'অপেক্ষা করুন...' : 'Placing order...'}</>
                  : <><CheckCircle className="h-5 w-5" /> {lang === 'bn' ? 'এখনই অর্ডার করুন' : 'Place Order Now'}</>
                }
              </button>

              <p className="text-center text-[10px] text-gray-400">
                <ShieldCheck className="inline w-3 h-3 mr-0.5 text-green-500" />
                {lang === 'bn' ? 'আপনার তথ্য সম্পূর্ণ নিরাপদ' : 'Your information is 100% secure'}
              </p>

              {!isAuthenticated && (
                <p className="text-center text-xs text-gray-400">
                  {lang === 'bn' ? 'অ্যাকাউন্ট আছে?' : 'Have an account?'}{' '}
                  <Link href="/login" className="text-primary font-bold hover:underline">
                    {lang === 'bn' ? 'লগইন করুন' : 'Sign in'}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
