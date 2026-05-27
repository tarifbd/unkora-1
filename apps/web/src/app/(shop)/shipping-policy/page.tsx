export default function ShippingPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">শিপিং নীতি</h1>
      <p className="text-gray-500 text-sm mb-8">Shipping Policy — সর্বশেষ আপডেট: মে ২০২৬</p>
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'ঢাকার মধ্যে', time: '১-২ কার্যদিবস', cost: '৬০ টাকা' },
            { title: 'ঢাকার বাইরে', time: '৩-৫ কার্যদিবস', cost: '১০০ টাকা' },
            { title: '৫০০+ টাকার অর্ডার', time: 'যেকোনো জায়গায়', cost: 'ফ্রি শিপিং' },
          ].map(item => (
            <div key={item.title} className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
              <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
              <p className="text-primary font-black text-lg">{item.cost}</p>
              <p className="text-gray-500 text-xs mt-1">{item.time}</p>
            </div>
          ))}
        </div>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">শিপিং পার্টনার</h2>
          <p>Pathao, Redx এবং Steadfast-এর মাধ্যমে ডেলিভারি করা হয়।</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">যোগাযোগ</h2>
          <p><a href="tel:+8801911369686" className="text-primary font-medium hover:underline">+880 1911-369686</a></p>
        </section>
      </div>
    </div>
  );
}
