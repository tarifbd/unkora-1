import Link from 'next/link';
import { BookOpen, TrendingUp, Users, CheckCircle, ArrowRight, Star } from 'lucide-react';

export const metadata = { title: 'Sell Your Book — UNKORA' };

export default function PublishPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Star className="w-4 h-4 fill-primary" /> বাংলাদেশের #১ বই মার্কেটপ্লেস
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            আপনার বই বিক্রি করুন{' '}
            <span className="text-primary">UNKORA</span>-তে
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-3 max-w-2xl mx-auto">
            Sell Your Books on UNKORA
          </p>
          <p className="text-gray-400 text-base mb-10 max-w-2xl mx-auto">
            বাংলাদেশের সেরা বই মার্কেটপ্লেসে আপনার বই লিস্ট করুন এবং লক্ষ পাঠকের কাছে পৌঁছান। প্রতিটি বিক্রয়ে উপার্জন করুন।
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/publish/submit"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              শুরু করুন <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-xl text-lg transition-all"
            >
              আরো জানুন
            </a>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto border-t border-gray-700 pt-8">
            {[
              { value: '১০,০০০+', label: 'বই' },
              { value: '৫০,০০০+', label: 'পাঠক' },
              { value: '১০%', label: 'রয়্যালটি' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-primary">{s.value}</p>
                <p className="text-sm text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">কিভাবে কাজ করে?</h2>
            <p className="text-gray-500">How It Works</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '০১', icon: '📝', title: 'তথ্য দিন', en: 'Submit Details',
                desc: 'আপনার বইয়ের সম্পূর্ণ তথ্য — নাম, লেখক, বিবরণ, মূল্য — ফর্মে পূরণ করুন।',
              },
              {
                step: '০২', icon: '🔍', title: 'রিভিউ', en: 'We Review',
                desc: 'আমাদের টিম ৩-৫ কার্যদিবসের মধ্যে আপনার বই রিভিউ করে অনুমোদন দেবে।',
              },
              {
                step: '০৩', icon: '💰', title: 'বিক্রি করুন', en: 'Start Selling',
                desc: 'বই অনুমোদিত হলে লাইভ হয়ে যাবে। প্রতিটি বিক্রয়ে ১০% রয়্যালটি আপনার।',
              },
            ].map(item => (
              <div key={item.step} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-4 right-4 text-6xl font-black text-gray-100 select-none">{item.step}</div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-black text-gray-900 mb-1">{item.title}</h3>
                <p className="text-xs text-primary font-bold uppercase tracking-wide mb-3">{item.en}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">কেন UNKORA বেছে নেবেন?</h2>
            <p className="text-gray-500">Why Choose UNKORA</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <TrendingUp className="w-7 h-7" />, color: 'bg-green-50 text-green-600', title: '১০% রয়্যালটি', en: '10% Royalty', desc: 'প্রতিটি বিক্রয়ে ন্যায্য রয়্যালটি পান। স্বচ্ছ পেমেন্ট সিস্টেম।' },
              { icon: <TrendingUp className="w-7 h-7" />, color: 'bg-blue-50 text-blue-600', title: 'বিক্রয় ট্র্যাকিং', en: 'Sales Tracking', desc: 'রিয়েল-টাইম ড্যাশবোর্ডে আপনার বইয়ের বিক্রয় ও আয় ট্র্যাক করুন।' },
              { icon: <Users className="w-7 h-7" />, color: 'bg-orange-50 text-orange-600', title: 'লক্ষ পাঠক', en: 'Reach Readers', desc: 'UNKORA-এর বিশাল পাঠক সম্প্রদায়ের কাছে আপনার বই পৌঁছে দিন।' },
              { icon: <BookOpen className="w-7 h-7" />, color: 'bg-purple-50 text-purple-600', title: 'সহজ প্রক্রিয়া', en: 'Easy Process', desc: 'সহজ অনলাইন ফর্মে তথ্য দিন। কোনো জটিলতা নেই।' },
              { icon: <CheckCircle className="w-7 h-7" />, color: 'bg-emerald-50 text-emerald-600', title: 'দ্রুত অনুমোদন', en: 'Fast Approval', desc: '৩-৫ কার্যদিবসের মধ্যে রিভিউ সম্পন্ন। দ্রুত মার্কেটে আসুন।' },
              { icon: <Star className="w-7 h-7" />, color: 'bg-amber-50 text-amber-600', title: 'বিশ্বস্ত প্ল্যাটফর্ম', en: 'Trusted Platform', desc: 'বাংলাদেশের বিশ্বস্ত ই-কমার্স প্ল্যাটফর্মে আপনার বই বিক্রি করুন।' },
            ].map(b => (
              <div key={b.title} className="flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${b.color}`}>{b.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5">{b.title}</h3>
                  <p className="text-xs text-gray-400 font-medium mb-2">{b.en}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary to-green-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">এখনই আপনার বই জমা দিন</h2>
          <p className="text-green-100 text-lg mb-8">Submit Your Book Now — বিনামূল্যে তালিকাভুক্তি</p>
          <Link
            href="/publish/submit"
            className="inline-flex items-center gap-3 bg-white text-primary font-black py-4 px-10 rounded-xl text-lg hover:bg-gray-100 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <BookOpen className="w-6 h-6" /> বই জমা দিন <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </main>
  );
}
