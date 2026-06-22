'use client';

import { useState } from 'react';
import { Bot, Zap, MessageSquare, Clock, CheckCircle, Plus, Trash2, ChevronDown, ChevronRight, Settings } from 'lucide-react';

type TriggerType = 'keyword' | 'order_status' | 'time_delay' | 'rating';
type ActionType = 'send_reply' | 'assign_agent' | 'create_ticket' | 'close_ticket' | 'send_sms';

interface AutoRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: { type: TriggerType; value: string };
  action: { type: ActionType; value: string };
  executions: number;
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  keyword: 'Contains Keyword',
  order_status: 'Order Status Change',
  time_delay: 'Time Without Response',
  rating: 'Rating Received',
};

const ACTION_LABELS: Record<ActionType, string> = {
  send_reply: 'Auto Reply',
  assign_agent: 'Assign to Agent',
  create_ticket: 'Create Support Ticket',
  close_ticket: 'Close Ticket',
  send_sms: 'Send SMS',
};

const DEFAULT_RULES: AutoRule[] = [
  {
    id: '1', name: 'Delivery Status Auto-Reply', enabled: true,
    trigger: { type: 'keyword', value: 'delivery,কখন,ডেলিভারি,tracking' },
    action: { type: 'send_reply', value: 'আপনার অর্ডার ট্র্যাক করতে এই লিংকে ক্লিক করুন: [tracking_link]। সাধারণত ৩-৫ কার্যদিবসের মধ্যে ডেলিভারি হয়।' },
    executions: 1234,
  },
  {
    id: '2', name: 'Low Rating Alert', enabled: true,
    trigger: { type: 'rating', value: '1,2' },
    action: { type: 'assign_agent', value: 'senior_agent' },
    executions: 89,
  },
  {
    id: '3', name: 'Order Cancellation', enabled: true,
    trigger: { type: 'keyword', value: 'cancel,বাতিল,ক্যান্সেল,refund' },
    action: { type: 'create_ticket', value: 'cancellation_team' },
    executions: 312,
  },
  {
    id: '4', name: 'Payment Query', enabled: true,
    trigger: { type: 'keyword', value: 'payment,পেমেন্ট,বকash,nagad' },
    action: { type: 'send_reply', value: 'আমরা bKash, Nagad, Visa, Mastercard এবং Cash on Delivery গ্রহণ করি। পেমেন্ট সমস্যায় ০১৯১১-৩৬৯৬৮৬ নম্বরে কল করুন।' },
    executions: 567,
  },
  {
    id: '5', name: '24h No Response Escalate', enabled: false,
    trigger: { type: 'time_delay', value: '24h' },
    action: { type: 'assign_agent', value: 'manager' },
    executions: 23,
  },
  {
    id: '6', name: 'Delivered Order Auto-Close', enabled: true,
    trigger: { type: 'order_status', value: 'delivered' },
    action: { type: 'send_sms', value: 'আপনার বই পৌঁছেছে। আমাদের সেবায় সন্তুষ্ট হলে রিভিউ দিন: [review_link]' },
    executions: 3421,
  },
];

export default function SupportAutomationPage() {
  const [rules, setRules] = useState<AutoRule[]>(DEFAULT_RULES);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => setRules(rs => rs.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const remove = (id: string) => setRules(rs => rs.filter(r => r.id !== id));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalExec = rules.reduce((sum, r) => sum + r.executions, 0);
  const activeCount = rules.filter(r => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Bot className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Support Automation</h2>
            <p className="text-xs text-muted-foreground">Auto-reply rules, routing, and escalation triggers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
            <Plus className="h-4 w-4" /> Add Rule
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : 'Save All'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Rules', value: activeCount, color: 'text-green-600', bg: 'bg-green-50', icon: Zap },
          { label: 'Total Rules', value: rules.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Settings },
          { label: 'Executions (30d)', value: totalExec.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50', icon: Bot },
          { label: 'Avg Response Time', value: '< 2 min', color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className={`${s.bg} rounded-lg p-2 w-fit mb-2`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rules */}
      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${rule.enabled ? '' : 'opacity-60'}`}>
            <div className="flex items-center gap-4 p-4">
              <button
                onClick={() => toggle(rule.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${rule.enabled ? 'bg-primary' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${rule.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm">{rule.name}</p>
                  {rule.enabled && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Active</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    {TRIGGER_LABELS[rule.trigger.type]}
                  </span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {ACTION_LABELS[rule.action.type]}
                  </span>
                  <span className="ml-2">{rule.executions.toLocaleString()} executions</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === rule.id ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => remove(rule.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {expanded === rule.id && (
              <div className="border-t p-4 bg-gray-50 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Trigger</p>
                  <div className="bg-white rounded-lg border p-3">
                    <p className="text-xs font-semibold text-orange-600 mb-1">{TRIGGER_LABELS[rule.trigger.type]}</p>
                    <p className="text-sm">{rule.trigger.value}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Action</p>
                  <div className="bg-white rounded-lg border p-3">
                    <p className="text-xs font-semibold text-blue-600 mb-1">{ACTION_LABELS[rule.action.type]}</p>
                    <p className="text-sm">{rule.action.value}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add rule CTA */}
      <button className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-3">
        <Plus className="h-5 w-5" />
        <span className="font-semibold">Add New Automation Rule</span>
      </button>
    </div>
  );
}
