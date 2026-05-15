export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">গোপনীয়তা নীতি</h1>
      <p className="text-gray-500 text-sm mb-8">Privacy Policy — সর্বশেষ আপডেট: মে ২০২৬</p>
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">১. তথ্য সংগ্রহ</h2>
          <p>আমরা আপনার নাম, ইমেইল, ফোন নম্বর, ডেলিভারি ঠিকানা সংগ্রহ করি। এই তথ্য শুধুমাত্র অর্ডার প্রক্রিয়াকরণের জন্য ব্যবহৃত হয়।</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">২. তৃতীয় পক্ষের সাথে ভাগ</h2>
          <p>আমরা কখনো আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি করি না।</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">৩. যোগাযোগ</h2>
          <p><a href="mailto:privacy@unkora.shop" className="text-primary font-medium hover:underline">privacy@unkora.shop</a></p>
        </section>
      </div>
    </div>
  );
}
