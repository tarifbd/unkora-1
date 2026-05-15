export default function CancellationsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">অর্ডার বাতিলকরণ নীতি</h1>
      <p className="text-gray-500 text-sm mb-8">Cancellation Policy — সর্বশেষ আপডেট: মে ২০২৬</p>
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm font-medium text-amber-800">
          ⚡ শিপমেন্টের আগে যেকোনো সময় বিনামূল্যে বাতিল করা যাবে।
        </div>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">কীভাবে বাতিল করবেন</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>My Orders সেকশনে যান</li>
            <li>Cancel Order বাটনে ক্লিক করুন</li>
            <li>৩-৫ কার্যদিবসে রিফান্ড পাবেন</li>
          </ol>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">সহায়তা</h2>
          <p><a href="tel:+8801708166233" className="text-primary font-medium hover:underline">+880 1708-166233</a></p>
        </section>
      </div>
    </div>
  );
}
