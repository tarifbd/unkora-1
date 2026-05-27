'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MessageSquare, Phone, Mail, Send, CheckCircle, Clock, XCircle, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useLanguage } from '@/lib/i18n/language-context';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

const CATEGORIES = ['General', 'Order Issue', 'Payment', 'Delivery', 'Return / Refund', 'Product Query', 'Other'];

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: any }> = {
  OPEN:              { label: 'Open',        cls: 'bg-blue-100 text-blue-700',   icon: MessageSquare },
  IN_PROGRESS:       { label: 'In Progress', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  WAITING_CUSTOMER:  { label: 'Waiting',     cls: 'bg-purple-100 text-purple-700', icon: Clock },
  RESOLVED:          { label: 'Resolved',    cls: 'bg-green-100 text-green-700', icon: CheckCircle },
  CLOSED:            { label: 'Closed',      cls: 'bg-gray-100 text-gray-600',   icon: XCircle },
};

export default function SupportPage() {
  const { isAuthenticated, token } = useAuthStore() as any;
  const { lang } = useLanguage();
  const [tab, setTab] = useState<'new' | 'my'>('new');
  const [form, setForm] = useState({ subject: '', message: '', category: 'General' });
  const [submitted, setSubmitted] = useState(false);

  const { data: tickets, refetch } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => api.get('/support/tickets/my').then(r => r.data.data?.data ?? r.data.data ?? []),
    enabled: isAuthenticated && tab === 'my',
  });

  const submit = useMutation({
    mutationFn: () => api.post('/support/tickets', form).then(r => r.data.data),
    onSuccess: () => {
      setSubmitted(true);
      toast.success(lang === 'bn' ? 'টিকেট সফলভাবে জমা হয়েছে!' : 'Ticket submitted successfully!');
    },
    onError: () => toast.error(lang === 'bn' ? 'কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Something went wrong. Please try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    submit.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-1">
        {lang === 'bn' ? 'সাপোর্ট সেন্টার' : 'Support Center'}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        {lang === 'bn' ? 'আমরা সবসময় আপনার পাশে আছি।' : "We're here to help you."}
      </p>

      {/* Quick contact row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <a href="tel:+8801911369686" className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary hover:shadow-sm transition-all text-center">
          <Phone className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold text-gray-600">{lang === 'bn' ? 'ফোন' : 'Call'}</span>
          <span className="text-[10px] text-gray-400">+880 1911-369686</span>
        </a>
        <a href="mailto:support@unkora.shop" className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary hover:shadow-sm transition-all text-center">
          <Mail className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold text-gray-600">{lang === 'bn' ? 'ইমেইল' : 'Email'}</span>
          <span className="text-[10px] text-gray-400">support@unkora.shop</span>
        </a>
        <a href="https://wa.me/8801911369686" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary hover:shadow-sm transition-all text-center">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold text-gray-600">WhatsApp</span>
          <span className="text-[10px] text-gray-400">{lang === 'bn' ? 'এখনই চ্যাট' : 'Chat Now'}</span>
        </a>
      </div>

      {/* Tabs — only show "My Tickets" if logged in */}
      {isAuthenticated && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {lang === 'bn' ? 'নতুন টিকেট' : 'New Ticket'}
          </button>
          <button
            onClick={() => { setTab('my'); refetch(); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${tab === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {lang === 'bn' ? 'আমার টিকেট' : 'My Tickets'}
          </button>
        </div>
      )}

      {/* New ticket form */}
      {tab === 'new' && (
        <>
          {!isAuthenticated && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 font-medium">
              {lang === 'bn' ? 'টিকেট ট্র্যাক করতে ' : 'To track your ticket, '}
              <Link href="/login" className="underline font-bold">{lang === 'bn' ? 'লগইন করুন' : 'login'}</Link>.
              {lang === 'bn' ? ' অথবা নিচে সরাসরি জমা দিন।' : ' Or submit directly below.'}
            </p>
          )}
          {submitted ? (
            <div className="text-center py-12 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-black text-gray-900 text-lg mb-1">{lang === 'bn' ? 'টিকেট জমা হয়েছে!' : 'Ticket Submitted!'}</p>
              <p className="text-sm text-gray-500 mb-6">{lang === 'bn' ? 'আমরা শীঘ্রই যোগাযোগ করব।' : "We'll get back to you shortly."}</p>
              <button onClick={() => { setSubmitted(false); setForm({ subject: '', message: '', category: 'General' }); }}
                className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                {lang === 'bn' ? 'আরেকটি টিকেট করুন' : 'Submit Another'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">{lang === 'bn' ? 'বিষয়' : 'Subject'}</label>
                <input
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder={lang === 'bn' ? 'সমস্যার বিষয় লিখুন' : 'Briefly describe your issue'}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">{lang === 'bn' ? 'বিভাগ' : 'Category'}</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">{lang === 'bn' ? 'বিস্তারিত বার্তা' : 'Message'}</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={5}
                  required
                  placeholder={lang === 'bn' ? 'আপনার সমস্যা বিস্তারিত লিখুন...' : 'Describe your issue in detail...'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submit.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {lang === 'bn' ? 'টিকেট জমা দিন' : 'Submit Ticket'}
              </button>
            </form>
          )}
        </>
      )}

      {/* My tickets */}
      {tab === 'my' && isAuthenticated && (
        <div className="space-y-3">
          {!tickets || tickets.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{lang === 'bn' ? 'কোনো টিকেট নেই।' : 'No tickets yet.'}</p>
            </div>
          ) : (
            tickets.map((t: any) => {
              const meta = STATUS_STYLES[t.status] ?? STATUS_STYLES['OPEN']!;
              return (
                <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{t.subject}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(t.createdAt).toLocaleDateString('en-BD')}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${meta.cls}`}>{meta.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
