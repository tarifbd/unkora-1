'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">কিছু একটা ভুল হয়েছে</h1>
        <p className="text-gray-500 text-sm mb-6">Something went wrong. Please try again.</p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm"
          >
            আবার চেষ্টা করুন
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
          >
            হোমে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
