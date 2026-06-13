'use client';

import { useState } from 'react';
import {
  Phone, PhoneCall, PhoneOff, PhoneMissed, CheckCircle, XCircle,
  Settings, Play, Pause, RotateCcw, Clock, Zap, AlertTriangle,
  Mic, Wallet, History, ChevronDown, ChevronUp, Plus, Download,
  MessageSquare, Bell, Shield, Volume2, RefreshCw, Filter,
  TrendingUp, DollarSign, Search, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────────── */
type CallStatus   = 'pending' | 'calling' | 'confirmed' | 'rejected' | 'forwarded' | 'no_answer' | 'failed';
type TxType       = 'TOPUP' | 'DEDUCTION';
type TabId        = 'config' | 'balance' | 'history';
type VoiceProvider = 'DEFAULT' | 'ELEVENLABS' | 'GOOGLE_TTS';

/* ─── Mock data ──────────────────────────────────────────────── */
const CALL_HISTORY: {
  id: string; order: string; customer: string; phone: string;
  amount: number; status: CallStatus; attempt: number; maxAttempts: number;
  time: string; duration?: string; cost?: number; pressedKey?: string;
}[] = [
  { id: 'C001', order: 'ORD-5512', customer: 'রাফিউল ইসলাম',   phone: '017XX-XXX901', amount: 3200, status: 'confirmed',  attempt: 1, maxAttempts: 3, time: '২ মিনিট আগে',   duration: '0:18', cost: 2.5,  pressedKey: '1' },
  { id: 'C002', order: 'ORD-5511', customer: 'নাসরিন আক্তার',  phone: '018XX-XXX234', amount: 890,  status: 'no_answer',  attempt: 2, maxAttempts: 3, time: '৫ মিনিট আগে' },
  { id: 'C003', order: 'ORD-5510', customer: 'করিম হোসেন',     phone: '019XX-XXX567', amount: 2100, status: 'rejected',   attempt: 1, maxAttempts: 3, time: '৮ মিনিট আগে',   duration: '0:12', cost: 1.5,  pressedKey: '2' },
  { id: 'C004', order: 'ORD-5509', customer: 'সাব্বির আহমেদ',  phone: '017XX-XXX890', amount: 1450, status: 'confirmed',  attempt: 1, maxAttempts: 3, time: '১২ মিনিট আগে', duration: '0:22', cost: 3.0,  pressedKey: '1' },
  { id: 'C005', order: 'ORD-5508', customer: 'ফাতিমা খানম',    phone: '018XX-XXX123', amount: 670,  status: 'calling',    attempt: 1, maxAttempts: 3, time: '১৫ মিনিট আগে' },
  { id: 'C006', order: 'ORD-5507', customer: 'মাহমুদ হাসান',   phone: '019XX-XXX456', amount: 5200, status: 'pending',    attempt: 0, maxAttempts: 3, time: '২০ মিনিট আগে' },
  { id: 'C007', order: 'ORD-5506', customer: 'রিমা বেগম',      phone: '017XX-XXX789', amount: 980,  status: 'confirmed',  attempt: 2, maxAttempts: 3, time: '২৫ মিনিট আগে', duration: '0:31', cost: 4.0,  pressedKey: '1' },
  { id: 'C008', order: 'ORD-5505', customer: 'তানভীর আহমেদ',   phone: '018XX-XXX012', amount: 3800, status: 'failed',     attempt: 3, maxAttempts: 3, time: '৩০ মিনিট আগে' },
  { id: 'C009', order: 'ORD-5504', customer: 'শাহিদা পারভিন',  phone: '016XX-XXX345', amount: 1200, status: 'forwarded',  attempt: 1, maxAttempts: 3, time: '৪৫ মিনিট আগে', duration: '1:24', cost: 12.0, pressedKey: '3' },
  { id: 'C010', order: 'ORD-5503', customer: 'জাহাঙ্গীর আলম',  phone: '015XX-XXX678', amount: 7600, status: 'confirmed',  attempt: 1, maxAttempts: 3, time: '১ ঘন্টা আগে',  duration: '0:19', cost: 2.5,  pressedKey: '1' },
];

const TRANSACTIONS: {
  id: string; type: TxType; amount: number; method?: string; note: string; date: string; balance: number;
}[] = [
  { id: 'T001', type: 'TOPUP',     amount: 500,  method: 'bKash',  note: 'ব্যালেন্স রিচার্জ',       date: '১৩ জুন, ১১:২০',   balance: 500.00 },
  { id: 'T002', type: 'DEDUCTION', amount: 2.5,  note: 'ORD-5512 — নিশ্চিত (0:18)',                  date: '১৩ জুন, ১০:৫৮',   balance: 497.50 },
  { id: 'T003', type: 'DEDUCTION', amount: 1.5,  note: 'ORD-5510 — প্রত্যাখ্যাত (0:12)',             date: '১৩ জুন, ১০:৫২',   balance: 496.00 },
  { id: 'T004', type: 'DEDUCTION', amount: 3.0,  note: 'ORD-5509 — নিশ্চিত (0:22)',                  date: '১৩ জুন, ১০:৪৮',   balance: 493.00 },
  { id: 'T005', type: 'DEDUCTION', amount: 4.0,  note: 'ORD-5506 — নিশ্চিত ২য় চেষ্টা (0:31)',       date: '১৩ জুন, ১০:৩৫',   balance: 489.00 },
  { id: 'T006', type: 'DEDUCTION', amount: 12.0, note: 'ORD-5504 — এজেন্টে ফরোয়ার্ড (1:24)',        date: '১৩ জুন, ১০:১৫',   balance: 477.00 },
  { id: 'T007', type: 'DEDUCTION', amount: 2.5,  note: 'ORD-5503 — নিশ্চিত (0:19)',                  date: '১৩ জুন, ০৯:৫৮',   balance: 474.50 },
  { id: 'T008', type: 'TOPUP',     amount: 1000, method: 'Nagad',  note: 'ব্যালেন্স রিচার্জ',       date: '১২ জুন, ১৮:০০',   balance: -25.50 },
];

const STATUS_META: Record<CallStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:   { label: 'অপেক্ষমাণ',     icon: Clock,         color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
  calling:   { label: 'কল চলছে...',    icon: PhoneCall,     color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  confirmed: { label: 'নিশ্চিত',        icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  rejected:  { label: 'প্রত্যাখ্যাত',  icon: XCircle,       color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
  forwarded: { label: 'এজেন্টে',       icon: Phone,         color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  no_answer: { label: 'উত্তর নেই',     icon: PhoneMissed,   color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  failed:    { label: 'ব্যর্থ',         icon: PhoneOff,      color: 'text-red-400',    bg: 'bg-red-50 border-red-100' },
};

/* ─── Sub-components ─────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted-foreground/30')}
    >
      <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" /> {title}
      </h3>
      {children}
    </div>
  );
}

/* ─── Config Tab ─────────────────────────────────────────────── */
function ConfigTab() {
  const [provider, setProvider] = useState<VoiceProvider>('DEFAULT');
  const [voiceId, setVoiceId] = useState('');
  const [agentPhone, setAgentPhone] = useState('017XXXXXXXX');
  const [statusOnConfirm, setStatusOnConfirm] = useState('CONFIRMED');
  const [callDelay, setCallDelay] = useState('300');
  const [windowStart, setWindowStart] = useState('09:00');
  const [windowEnd, setWindowEnd]     = useState('21:00');
  const [retryEnabled, setRetryEnabled] = useState(true);
  const [retryAfter, setRetryAfter]   = useState('30');
  const [maxRetries, setMaxRetries]   = useState('2');
  const [retryNoAnswer, setRetryNoAnswer] = useState(true);
  const [retryFailed, setRetryFailed]     = useState(true);
  const [smsOnConfirm, setSmsOnConfirm]   = useState(false);
  const [smsTemplate, setSmsTemplate]     = useState('আপনার অর্ডার {order_id} নিশ্চিত হয়েছে। ধন্যবাদ!');
  const [lowAlert, setLowAlert]           = useState(true);
  const [lowThreshold, setLowThreshold]   = useState('100');
  const [lowEmail, setLowEmail]           = useState('');
  const [confirmMsg, setConfirmMsg]       = useState('আপনার UNKORA অর্ডার নিশ্চিত করতে ১ চাপুন। এজেন্টের সাথে কথা বলতে ২ চাপুন। বাতিল করতে ৩ চাপুন।');
  const [agentMsg, setAgentMsg]           = useState('আপনার কল এজেন্টের কাছে সংযুক্ত করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।');
  const [cancelMsg, setCancelMsg]         = useState('আপনার অর্ডারটি বাতিল করা হয়েছে। ধন্যবাদ।');
  const [generating, setGenerating]       = useState(false);
  const [saved, setSaved]                 = useState(false);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-4">
      {/* Voice Provider */}
      <SectionCard title="ভয়েস প্রোভাইডার" icon={Volume2}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { id: 'DEFAULT',     label: 'ডিফল্ট TTS',    desc: 'বেসিক রোবোটিক ভয়েস' },
            { id: 'ELEVENLABS',  label: 'ElevenLabs',    desc: 'প্রিমিয়াম AI ভয়েস' },
            { id: 'GOOGLE_TTS',  label: 'Google TTS',    desc: 'ক্লিয়ার ন্যাচারাল' },
          ] as { id: VoiceProvider; label: string; desc: string }[]).map(p => (
            <button key={p.id} onClick={() => setProvider(p.id)}
              className={cn('text-left p-3 rounded-xl border transition-all',
                provider === p.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40')}>
              <p className="text-sm font-bold">{p.label}</p>
              <p className="text-[11px] text-muted-foreground">{p.desc}</p>
            </button>
          ))}
        </div>

        {provider === 'ELEVENLABS' && (
          <Field label="ElevenLabs Voice ID" hint="ElevenLabs ড্যাশবোর্ড থেকে ভয়েস ID কপি করুন">
            <input value={voiceId} onChange={e => setVoiceId(e.target.value)}
              placeholder="pNInz6obpgDQGcFmaJgB"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono" />
          </Field>
        )}
      </SectionCard>

      {/* IVR Messages */}
      <SectionCard title="IVR বার্তা" icon={Mic}>
        <Field label="কনফার্মেশন বার্তা (১/২/৩ চাপতে বলুন)">
          <textarea rows={3} value={confirmMsg} onChange={e => setConfirmMsg(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" />
        </Field>
        <Field label="এজেন্ট ট্রান্সফার বার্তা (২ চাপলে শোনাবে)">
          <textarea rows={2} value={agentMsg} onChange={e => setAgentMsg(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" />
        </Field>
        <Field label="বাতিলের পর বার্তা (৩ চাপলে শোনাবে)">
          <textarea rows={2} value={cancelMsg} onChange={e => setCancelMsg(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" />
        </Field>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 transition-colors">
            {generating
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> জেনারেট করা হচ্ছে...</>
              : <><Mic className="w-4 h-4" /> AI ভয়েস জেনারেট করুন</>}
          </button>
          <p className="text-[11px] text-muted-foreground">বার্তা পরিবর্তন করলে পুনরায় জেনারেট করতে হবে</p>
        </div>
      </SectionCard>

      {/* Call Settings */}
      <div className="grid sm:grid-cols-2 gap-4">
        <SectionCard title="কল সেটিংস" icon={Settings}>
          <Field label="এজেন্ট ফোন নম্বর" hint="২ চাপলে এই নম্বরে ফরোয়ার্ড হবে">
            <input value={agentPhone} onChange={e => setAgentPhone(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono" />
          </Field>
          <Field label="অর্ডার কনফার্ম স্ট্যাটাস">
            <select value={statusOnConfirm} onChange={e => setStatusOnConfirm(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="READY_TO_SHIP">Ready to Ship</option>
            </select>
          </Field>
          <Field label="অর্ডারের পর কল দেরি (সেকেন্ড)">
            <input type="number" value={callDelay} onChange={e => setCallDelay(e.target.value)}
              min="30" max="1800"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </Field>
        </SectionCard>

        <SectionCard title="কল উইন্ডো" icon={Clock}>
          <p className="text-[11px] text-muted-foreground -mt-2">এই সময়ের বাইরে কল করা হবে না</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="শুরু">
              <input type="time" value={windowStart} onChange={e => setWindowStart(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="শেষ">
              <input type="time" value={windowEnd} onChange={e => setWindowEnd(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">উইন্ডোর বাইরের অর্ডারগুলো পরদিন সকালে কল করা হবে।</p>
          </div>
        </SectionCard>
      </div>

      {/* Retry Settings */}
      <SectionCard title="রিট্রাই নিয়ম" icon={RotateCcw}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">স্বয়ংক্রিয় রিট্রাই</p>
            <p className="text-[11px] text-muted-foreground">উত্তর না পেলে পুনরায় কল করবে</p>
          </div>
          <Toggle checked={retryEnabled} onChange={setRetryEnabled} />
        </div>
        {retryEnabled && (
          <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t">
            <Field label="সর্বোচ্চ চেষ্টা">
              <input type="number" value={maxRetries} onChange={e => setMaxRetries(e.target.value)}
                min="1" max="5"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="রিট্রাই বিরতি (মিনিট)">
              <input type="number" value={retryAfter} onChange={e => setRetryAfter(e.target.value)}
                min="5" max="120"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
            <div className="space-y-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={retryNoAnswer} onChange={e => setRetryNoAnswer(e.target.checked)}
                  className="rounded border-border" />
                <span className="text-xs font-medium">উত্তর না পেলে রিট্রাই</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={retryFailed} onChange={e => setRetryFailed(e.target.checked)}
                  className="rounded border-border" />
                <span className="text-xs font-medium">ব্যর্থ হলে রিট্রাই</span>
              </label>
            </div>
          </div>
        )}
      </SectionCard>

      {/* SMS on Confirm */}
      <SectionCard title="নিশ্চিতকরণ SMS" icon={MessageSquare}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">কনফার্মে SMS পাঠান</p>
            <p className="text-[11px] text-muted-foreground">কল নিশ্চিত হলে কাস্টমারকে SMS পাঠাবে</p>
          </div>
          <Toggle checked={smsOnConfirm} onChange={setSmsOnConfirm} />
        </div>
        {smsOnConfirm && (
          <Field label="SMS টেমপ্লেট" hint="{order_id}, {customer_name}, {amount} ভেরিয়েবল ব্যবহার করুন">
            <textarea rows={3} value={smsTemplate} onChange={e => setSmsTemplate(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" />
          </Field>
        )}
      </SectionCard>

      {/* Low Balance Alert */}
      <SectionCard title="লো ব্যালেন্স অ্যালার্ট" icon={Bell}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">ব্যালেন্স কম হলে নোটিফাই করুন</p>
            <p className="text-[11px] text-muted-foreground">ইমেইলে সতর্কতা পাবেন</p>
          </div>
          <Toggle checked={lowAlert} onChange={setLowAlert} />
        </div>
        {lowAlert && (
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t">
            <Field label="থ্রেশহোল্ড পরিমাণ (৳)">
              <input type="number" value={lowThreshold} onChange={e => setLowThreshold(e.target.value)}
                min="10" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="অ্যালার্ট ইমেইল">
              <input type="email" value={lowEmail} onChange={e => setLowEmail(e.target.value)}
                placeholder="admin@yourdomain.com"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
        )}
      </SectionCard>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave}
          className={cn('flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all',
            saved
              ? 'bg-green-500 text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/90')}>
          {saved ? <><CheckCircle className="w-4 h-4" /> সেভ হয়েছে!</> : 'সেটিংস সেভ করুন'}
        </button>
      </div>
    </div>
  );
}

/* ─── Balance Tab ────────────────────────────────────────────── */
function BalanceTab() {
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('bKash');

  const available = 474.50;
  const totalDeposited = 1500;
  const totalUsed = 1025.50;
  const costToday = 25.50;
  const callsToday = 10;

  return (
    <div className="space-y-4">
      {/* Balance cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'বর্তমান ব্যালেন্স', value: `৳${available.toFixed(2)}`, icon: Wallet,       color: available < 100 ? 'text-red-600' : 'text-green-600', bg: available < 100 ? 'bg-red-50' : 'bg-green-50' },
          { label: 'মোট জমা',           value: `৳${totalDeposited.toFixed(2)}`, icon: TrendingUp,  color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'মোট ব্যবহার',       value: `৳${totalUsed.toFixed(2)}`,    icon: DollarSign,  color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'আজকের খরচ',         value: `৳${costToday.toFixed(2)} (${callsToday} কল)`, icon: Phone, color: 'text-gray-700', bg: 'bg-gray-50' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-xl border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', s.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', s.color)} />
                </div>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
              <p className={cn('text-lg font-black', s.color)}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {available < 100 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">ব্যালেন্স কম!</p>
            <p className="text-xs text-red-600 mt-0.5">
              ব্যালেন্স ৳{available.toFixed(2)} — দ্রুত রিচার্জ করুন নইলে কল সার্ভিস বন্ধ হয়ে যাবে।
            </p>
          </div>
          <button onClick={() => setShowTopup(true)}
            className="ml-auto flex-shrink-0 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">
            রিচার্জ করুন
          </button>
        </div>
      )}

      {/* Top-up button */}
      <div className="flex justify-end">
        <button onClick={() => setShowTopup(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> ব্যালেন্স রিচার্জ
          {showTopup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Top-up form */}
      {showTopup && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" /> ব্যালেন্স রিচার্জ
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="পরিমাণ (৳)">
              <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
                placeholder="500" min="50"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
            <Field label="পেমেন্ট পদ্ধতি">
              <select value={topupMethod} onChange={e => setTopupMethod(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Manual">ম্যানুয়াল</option>
              </select>
            </Field>
            <Field label="নোট (ঐচ্ছিক)">
              <input type="text" placeholder="ট্রানজেকশন ID বা নোট"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {[100, 200, 500, 1000].map(amt => (
              <button key={amt} onClick={() => setTopupAmount(String(amt))}
                className={cn('px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors',
                  topupAmount === String(amt)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:border-primary/60')}>
                ৳{amt}
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowTopup(false)}
              className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-muted transition-colors">বাতিল</button>
            <button className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
              রিচার্জ নিশ্চিত করুন
            </button>
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
          <h3 className="font-bold text-sm">লেনদেনের ইতিহাস</h3>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Download className="w-3.5 h-3.5" /> এক্সপোর্ট
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/20">
              {['তারিখ', 'বিবরণ', 'পরিমাণ', 'ব্যালেন্স'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {TRANSACTIONS.map(t => (
              <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{t.date}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{t.note}</p>
                  {t.method && <span className="text-[10px] text-muted-foreground">{t.method}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-sm font-black',
                    t.type === 'TOPUP' ? 'text-green-600' : 'text-red-500')}>
                    {t.type === 'TOPUP' ? '+' : '-'}৳{t.amount.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-muted-foreground">
                  ৳{Math.abs(t.balance).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── History Tab ────────────────────────────────────────────── */
function HistoryTab() {
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = CALL_HISTORY.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.order.toLowerCase().includes(search.toLowerCase()) &&
        !c.customer.toLowerCase().includes(search.toLowerCase()) &&
        !c.phone.includes(search)) return false;
    return true;
  });

  const totals = {
    total:     CALL_HISTORY.length,
    confirmed: CALL_HISTORY.filter(c => c.status === 'confirmed').length,
    rejected:  CALL_HISTORY.filter(c => c.status === 'rejected').length,
    pending:   CALL_HISTORY.filter(c => c.status === 'pending' || c.status === 'calling').length,
    noAnswer:  CALL_HISTORY.filter(c => c.status === 'no_answer').length,
  };

  return (
    <div className="space-y-4">
      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'মোট', value: totals.total,     color: 'text-gray-900' },
          { label: 'নিশ্চিত', value: totals.confirmed, color: 'text-green-600' },
          { label: 'প্রত্যাখ্যাত', value: totals.rejected,  color: 'text-red-500' },
          { label: 'উত্তর নেই',  value: totals.noAnswer,  color: 'text-amber-600' },
          { label: 'অপেক্ষমাণ', value: totals.pending,   color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border p-3 text-center">
            <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="অর্ডার, নাম বা ফোন সার্চ…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm" />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border bg-background px-3 py-2 text-xs font-semibold">
            <option value="all">সব স্ট্যাটাস</option>
            <option value="confirmed">নিশ্চিত</option>
            <option value="rejected">প্রত্যাখ্যাত</option>
            <option value="no_answer">উত্তর নেই</option>
            <option value="calling">কল চলছে</option>
            <option value="pending">অপেক্ষমাণ</option>
            <option value="forwarded">এজেন্টে</option>
            <option value="failed">ব্যর্থ</option>
          </select>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border transition-colors">
          <Download className="w-3.5 h-3.5" /> CSV এক্সপোর্ট
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b bg-muted/30">
                {['অর্ডার', 'গ্রাহক', 'পরিমাণ', 'চেষ্টা', 'সময়', 'ফলাফল', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    কোনো রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : filtered.map(c => {
                const meta = STATUS_META[c.status];
                const Icon = meta.icon;
                return (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-bold">{c.order}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold">{c.customer}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-black">৳{c.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-xs font-bold text-muted-foreground">{c.attempt}/{c.maxAttempts}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-muted-foreground">{c.time}</p>
                      {c.duration && <p className="text-[11px] text-muted-foreground">{c.duration}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border', meta.bg, meta.color)}>
                        <Icon className="w-2.5 h-2.5" />
                        {meta.label}
                        {c.status === 'calling' && <span className="animate-pulse">●</span>}
                      </span>
                      {c.pressedKey && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">কী: {c.pressedKey}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="বিস্তারিত">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        {(c.status === 'no_answer' || c.status === 'failed') && c.attempt < c.maxAttempts && (
                          <button className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="পুনরায় কল">
                            <RotateCcw className="w-3.5 h-3.5 text-primary" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AutoCallPage() {
  const [enabled, setEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('history');

  const queueCount = CALL_HISTORY.filter(c => c.status === 'pending' || c.status === 'calling' || c.status === 'no_answer').length;

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'history', label: `কল হিস্ট্রি`,        icon: History },
    { id: 'balance', label: 'ব্যালেন্স',           icon: Wallet },
    { id: 'config',  label: 'কনফিগারেশন',          icon: Settings },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-black flex items-center gap-2">
            <Phone className="w-6 h-6 text-primary" /> IVR Auto Call
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">অর্ডার আসার সাথে সাথে স্বয়ংক্রিয় কল করে নিশ্চিত করুন</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {queueCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
              <Clock className="w-3.5 h-3.5" /> {queueCount} কল কিউতে
            </div>
          )}
          <div className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold',
            enabled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500')}>
            <span className={cn('w-2 h-2 rounded-full', enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400')} />
            {enabled ? 'চালু' : 'বন্ধ'}
          </div>
          <button onClick={() => setEnabled(!enabled)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
              enabled
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-primary text-primary-foreground hover:bg-primary/90')}>
            {enabled ? <><Pause className="w-4 h-4" /> বন্ধ করুন</> : <><Play className="w-4 h-4" /> চালু করুন</>}
          </button>
        </div>
      </div>

      {/* IVR Flow diagram */}
      <div className="bg-card rounded-xl border p-4 sm:p-5">
        <h2 className="text-xs font-bold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-primary" /> কল ফ্লো
        </h2>
        <div className="flex items-stretch gap-1.5 flex-wrap">
          {[
            { num: '১', label: 'নতুন অর্ডার',  sub: 'ট্রিগার',           bg: 'bg-primary/8 border-primary/20 text-primary' },
            { arrow: true },
            { num: '২', label: 'কল শুরু',      sub: '৫ মিনিট পর',       bg: 'bg-blue-50 border-blue-200 text-blue-700' },
            { arrow: true },
            { num: '৩', label: 'IVR বার্তা',   sub: 'TTS অটো প্লে',     bg: 'bg-purple-50 border-purple-200 text-purple-700' },
            { arrow: true },
            { num: '১', label: 'নিশ্চিত',      sub: '১ চাপুন',          bg: 'bg-green-50 border-green-200 text-green-700' },
            { num: '২', label: 'এজেন্ট',       sub: 'ফরোয়ার্ড',         bg: 'bg-amber-50 border-amber-200 text-amber-700' },
            { num: '৩', label: 'বাতিল',        sub: '৩ চাপুন',          bg: 'bg-red-50 border-red-200 text-red-600' },
          ].map((s, i) => 'arrow' in s ? (
            <span key={i} className="self-center text-muted-foreground text-lg hidden sm:block">›</span>
          ) : (
            <div key={i} className={cn('flex flex-col items-center px-3 py-2.5 rounded-xl border text-xs font-semibold min-w-[72px]', s.bg)}>
              <span className="font-black text-lg leading-none">{s.num}</span>
              <span className="font-bold mt-0.5">{s.label}</span>
              <span className="text-[10px] opacity-70">{s.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all',
                activeTab === t.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="w-3.5 h-3.5 hidden sm:block" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'config'  && <ConfigTab />}
      {activeTab === 'balance' && <BalanceTab />}
      {activeTab === 'history' && <HistoryTab />}
    </div>
  );
}
