import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-3xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your UNKORA account</p>
        </div>

        {/* LoginForm component will be wired in V1 */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-center text-sm text-muted-foreground">
            Auth form — implemented in V1
          </p>
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
