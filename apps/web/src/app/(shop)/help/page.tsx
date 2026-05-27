import Link from 'next/link';
import { MessageSquare, Phone, Mail, Package, RefreshCw, Truck, ShieldCheck } from 'lucide-react';

const TOPICS = [
  { icon: Package,    title: 'অর্ডার ট্র্যাকিং',       desc: 'আপনার অর্ডার কোথায় আছে জানুন', href: '/account/orders' },
  { icon: RefreshCw,  title: 'ফেরত ও রিফান্ড',          desc: '৭ দিনের মধ্যে সহজে ফেরত দিন',  href: '/refund-policy' },
  { icon: Truck,      title: 'শিপিং তথ্য',              desc: 'ডেলিভারি সময় ও চার্জ জানুন',    href: '/shipping-policy' },
  { icon: ShieldCheck,title: 'গোপনীয়তা ও নিরাপত্তা',  desc: 'আপনার তথ্য সুরক্ষিত',           href: '/privacy' },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-2">হেল্প সেন্টার</h1>
      <p className="text-gray-500 mb-10">আমরা সবসময় আপনার পাশে আছি।</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        {TOPICS.map(({ icon: Icon, title, desc, href }) => (
          <Link key={href} href={href}
            className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-xl hover:border-primary hover:shadow-md transition-all group">
            <div className="p-2 bg-green-50 rounded-lg group-hover:bg-primary transition-colors">
              <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm mb-0.5">{title}</p>
              <p className="text-gray-500 text-xs">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="bg-gray-50 rounded-2xl p-8">
        <h2 className="text-xl font-black text-gray-900 mb-6">সরাসরি যোগাযোগ করুন</h2>
        <div className="space-y-4">
          <a href="tel:+8801708166233" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary transition-colors">
            <div className="p-2 bg-green-50 rounded-lg"><Phone className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">ফোন (সকাল ৯টা – রাত ৯টা)</p>
              <p className="font-bold text-gray-900">+880 1911-369686</p>
            </div>
          </a>
          <a href="mailto:support@unkora.shop" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary transition-colors">
            <div className="p-2 bg-green-50 rounded-lg"><Mail className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">ইমেইল</p>
              <p className="font-bold text-gray-900">support@unkora.shop</p>
            </div>
          </a>
          <a href="https://wa.me/8801708166233" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary transition-colors">
            <div className="p-2 bg-green-50 rounded-lg"><MessageSquare className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">WhatsApp লাইভ চ্যাট</p>
              <p className="font-bold text-gray-900">এখনই চ্যাট করুন →</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
