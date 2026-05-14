'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

const schema = z.object({
  firstName: z.string().min(2, 'Min 2 characters'),
  lastName: z.string().min(2, 'Min 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = ({ confirmPassword: _, ...data }: FormData) => registerUser.mutate(data);

  const Field = ({ name, label, type = 'text', placeholder }: { name: keyof FormData; label: string; type?: string; placeholder?: string }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input {...register(name)} type={type} placeholder={placeholder}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field name="firstName" label="First Name" placeholder="Rafiq" />
        <Field name="lastName" label="Last Name" placeholder="Islam" />
      </div>
      <Field name="email" label="Email" type="email" placeholder="you@example.com" />
      <Field name="phone" label="Phone (optional)" placeholder="+8801700000000" />
      <Field name="password" label="Password" type="password" placeholder="Min 8 chars" />
      <Field name="confirmPassword" label="Confirm Password" type="password" placeholder="Repeat password" />

      {registerUser.error && <p className="text-xs text-destructive">Registration failed. Try again.</p>}

      <button type="submit" disabled={registerUser.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
        {registerUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Create Account
      </button>
    </form>
  );
}
