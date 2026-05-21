import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-black text-gray-100 mb-2">404</div>
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">পেজটি পাওয়া যায়নি</h1>
        <p className="text-gray-500 text-sm mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all text-sm"
          >
            হোমে যান
          </Link>
          <Link
            href="/products"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
          >
            পণ্য দেখুন
          </Link>
        </div>
      </div>
    </div>
  );
}
