'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2, 'Name required'),
  phone: z.string().min(11, 'Phone required'),
  addressLine1: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  district: z.string().min(2, 'District required'),
  division: z.string().min(2, 'Division required'),
  postalCode: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

const DIVISIONS = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'];

export default function AddressesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => authApi.getAddresses(),
  });

  const addAddress = useMutation({
    mutationFn: (data: AddressFormData) => authApi.addAddress(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addresses'] }); setShowForm(false); reset(); },
  });

  const removeAddress = useMutation({
    mutationFn: (id: string) => authApi.removeAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const inputCls = (err?: { message?: string }) =>
    `w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${err ? 'border-destructive' : ''}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Saved Addresses</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Address
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">New Address</h2>
          <form onSubmit={handleSubmit(data => addAddress.mutate(data))} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium">Label (e.g., Home, Office)</label>
              <input {...register('label')} className={inputCls()} placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Full Name *</label>
              <input {...register('fullName')} className={inputCls(errors.fullName)} />
              {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Phone *</label>
              <input {...register('phone')} className={inputCls(errors.phone)} placeholder="01XXXXXXXXX" />
              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium">Address *</label>
              <input {...register('addressLine1')} className={inputCls(errors.addressLine1)} placeholder="House, Road, Area" />
              {errors.addressLine1 && <p className="mt-1 text-xs text-destructive">{errors.addressLine1.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">City *</label>
              <input {...register('city')} className={inputCls(errors.city)} />
              {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">District *</label>
              <input {...register('district')} className={inputCls(errors.district)} />
              {errors.district && <p className="mt-1 text-xs text-destructive">{errors.district.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Division *</label>
              <select {...register('division')} className={inputCls(errors.division)}>
                <option value="">Select</option>
                {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.division && <p className="mt-1 text-xs text-destructive">{errors.division.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Postal Code</label>
              <input {...register('postalCode')} className={inputCls()} placeholder="Optional" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={addAddress.isPending}
                className="flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {addAddress.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Save Address
              </button>
              <button type="button" onClick={() => { setShowForm(false); reset(); }}
                className="rounded-md border px-5 py-2 text-sm hover:bg-accent transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      )}

      {!isLoading && !addresses?.length && !showForm && (
        <div className="rounded-xl border bg-card p-12 text-center">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No saved addresses</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-sm text-brand-600 hover:underline">Add your first address</button>
        </div>
      )}

      <div className="space-y-3">
        {addresses?.map((addr: { id: string; label?: string; isDefault?: boolean; fullName: string; phone: string; addressLine1: string; city: string; district: string; division: string }) => (
          <div key={addr.id} className="flex items-start justify-between rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="text-sm">
                {addr.label && <p className="font-semibold text-xs uppercase text-muted-foreground mb-0.5">{addr.label}</p>}
                <p className="font-medium">{addr.fullName}</p>
                <p className="text-muted-foreground">{addr.phone}</p>
                <p className="text-muted-foreground">{addr.addressLine1}, {addr.city}, {addr.district}, {addr.division}</p>
                {addr.isDefault && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 font-medium">
                    <Star className="h-3 w-3" /> Default
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => removeAddress.mutate(addr.id)} disabled={removeAddress.isPending}
              className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
