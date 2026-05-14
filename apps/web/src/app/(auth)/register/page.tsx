import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Create Account' };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-serif text-3xl font-bold">Create account</h1>
          <p className="text-sm text-muted-foreground">Join UNKORA today</p>
        </div>

        {/* RegisterForm component will be wired in V1 */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-center text-sm text-muted-foreground">
            Registration form — implemented in V1
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
