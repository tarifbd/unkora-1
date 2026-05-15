export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">ফেরত ও রিফান্ড নীতি</h1>
      <p className="text-gray-500 text-sm mb-8">Refund Policy — সর্বশেষ আপডেট: মে ২০২৬</p>
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm font-medium text-green-800">
          ✅ ডেলিভারির ৭ দিনের মধ্যে ফেরত দেওয়া যাবে।
        </div>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">ফেরতযোগ্য পণ্য</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>ভুল পণ্য ডেলিভারি হলে</li>
            <li>পণ্য ক্ষতিগ্রস্ত বা ত্রুটিপূর্ণ অবস্থায় পাওয়া গেলে</li>
            <li>বইয়ের পাতা ছেঁড়া বা মিসিং থাকলে</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">ফেরত প্রক্রিয়া</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>My Orders থেকে অর্ডারটি নির্বাচন করুন</li>
            <li>Return Request করুন ও ছবি আপলোড করুন</li>
            <li>৩-৫ কার্যদিবসের মধ্যে রিফান্ড পাবেন</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
