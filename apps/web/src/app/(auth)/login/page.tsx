'use client';

import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-3xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your UNKORA account</p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <LoginForm />
          <SocialLoginButtons />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
