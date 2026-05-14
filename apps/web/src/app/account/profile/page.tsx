'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';
import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setError('');
    try {
      const updated = await authApi.updateProfile(data);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to update profile. Please try again.');
    }
  };

  const inputCls = (err?: { message?: string }) =>
    `w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${err ? 'border-destructive' : ''}`;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold">Profile Settings</h1>

      <div className="rounded-xl border bg-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">First Name</label>
              <input {...register('firstName')} className={inputCls(errors.firstName)} />
              {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last Name</label>
              <input {...register('lastName')} className={inputCls(errors.lastName)} />
              {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input value={user?.email ?? ''} disabled
              className="w-full rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed" />
            <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input {...register('phone')} className={inputCls()} placeholder="01XXXXXXXXX" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {saved && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" /> Profile updated successfully
            </div>
          )}

          <button type="submit" disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
