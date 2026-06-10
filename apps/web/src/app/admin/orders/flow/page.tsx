'use client';

import { useState } from 'react';
import { GitBranch, Plus, Trash2, GripVertical, Settings, ChevronRight, CheckCircle, Bell, Mail, MessageSquare, Zap } from 'lucide-react';

type ActionType = 'notify_admin' | 'send_sms' | 'send_email' | 'auto_assign' | 'update_stock' | 'webhook';

interface FlowAction {
  id: string;
  type: ActionType;
  label: string;
  config: Record<string, string>;
}

interface FlowStep {
  id: string;
  status: string;
  color: string;
  actions: FlowAction[];
  autoAdvanceTo?: string;
  delayMinutes?: number;
}

const ACTION_TYPES: { type: ActionType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'notify_admin', label: 'Notify Admin', icon: Bell, color: 'text-blue-500' },
  { type: 'send_sms', label: 'Send SMS', icon: MessageSquare, color: 'text-green-500' },
  { type: 'send_email', label: 'Send Email', icon: Mail, color: 'text-purple-500' },
  { type: 'auto_assign', label: 'Auto Assign', icon: Zap, color: 'text-orange-500' },
  { type: 'update_stock', label: 'Update Stock', icon: Settings, color: 'text-gray-500' },
  { type: 'webhook', label: 'Webhook', icon: GitBranch, color: 'text-pink-500' },
];

const DEFAULT_FLOW: FlowStep[] = [
  {
    id: 's1', status: 'Order Placed', color: '#6366f1',
    actions: [
      { id: 'a1', type: 'notify_admin', label: 'Notify Admin', config: { channel: 'email' } },
      { id: 'a2', type: 'send_sms', label: 'Send SMS', config: { template: 'order_confirmation' } },
    ],
    autoAdvanceTo: 'Processing',
  },
  {
    id: 's2', status: 'Processing', color: '#f59e0b',
    actions: [
      { id: 'a3', type: 'update_stock', label: 'Update Stock', config: {} },
      { id: 'a4', type: 'auto_assign', label: 'Auto Assign', config: { rule: 'nearest_warehouse' } },
    ],
  },
  {
    id: 's3', status: 'Packed', color: '#10b981',
    actions: [
      { id: 'a5', type: 'send_sms', label: 'Send SMS', config: { template: 'ready_to_ship' } },
    ],
  },
  {
    id: 's4', status: 'Shipped', color: '#0ea5e9',
    actions: [
      { id: 'a6', type: 'send_email', label: 'Send Email', config: { template: 'tracking_info' } },
      { id: 'a7', type: 'webhook', label: 'Webhook', config: { url: 'https://courier-api.unkora.shop/shipped' } },
    ],
  },
  {
    id: 's5', status: 'Delivered', color: '#22c55e',
    actions: [
      { id: 'a8', type: 'send_sms', label: 'Send SMS', config: { template: 'delivery_confirmation' } },
      { id: 'a9', type: 'send_email', label: 'Send Email', config: { template: 'review_request' } },
    ],
  },
];

export default function OrderFlowPage() {
  const [flow, setFlow] = useState<FlowStep[]>(DEFAULT_FLOW);
  const [expandedStep, setExpandedStep] = useState<string | null>('s1');
  const [saved, setSaved] = useState(false);
  const [showAddAction, setShowAddAction] = useState<string | null>(null);

  const removeAction = (stepId: string, actionId: string) => {
    setFlow(f => f.map(s => s.id === stepId ? { ...s, actions: s.actions.filter(a => a.id !== actionId) } : s));
  };

  const addAction = (stepId: string, type: ActionType) => {
    const meta = ACTION_TYPES.find(a => a.type === type);
    if (!meta) return;
    const newAction: FlowAction = { id: Date.now().toString(), type, label: meta.label, config: {} };
    setFlow(f => f.map(s => s.id === stepId ? { ...s, actions: [...s.actions, newAction] } : s));
    setShowAddAction(null);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <GitBranch className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-black text-lg">Order Flow Customization</h2>
            <p className="text-xs text-muted-foreground">Define automated actions at each order status transition</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
        >
          {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : 'Save Flow'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flow editor */}
        <div className="lg:col-span-2 space-y-3">
          {flow.map((step, si) => (
            <div key={step.id}>
              {/* Step card */}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: step.color }} />
                  <span className="font-bold text-sm flex-1">{step.status}</span>
                  <span className="text-xs text-muted-foreground">{step.actions.length} action{step.actions.length !== 1 ? 's' : ''}</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedStep === step.id ? 'rotate-90' : ''}`} />
                </button>

                {expandedStep === step.id && (
                  <div className="border-t p-4 space-y-2">
                    {step.actions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">No actions configured</p>
                    ) : (
                      step.actions.map(action => {
                        const meta = ACTION_TYPES.find(a => a.type === action.type);
                        const Icon = meta?.icon ?? Settings;
                        return (
                          <div key={action.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <GripVertical className="h-4 w-4 text-gray-300 cursor-grab flex-shrink-0" />
                            <div className="h-7 w-7 rounded-lg bg-white border flex items-center justify-center flex-shrink-0">
                              <Icon className={`h-3.5 w-3.5 ${meta?.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{action.label}</p>
                              {action.config.template && <p className="text-xs text-muted-foreground">Template: {action.config.template}</p>}
                              {action.config.url && <p className="text-xs text-muted-foreground truncate">{action.config.url}</p>}
                              {action.config.rule && <p className="text-xs text-muted-foreground">{action.config.rule}</p>}
                            </div>
                            <button
                              onClick={() => removeAction(step.id, action.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                    {/* Add action */}
                    {showAddAction === step.id ? (
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        {ACTION_TYPES.map(at => (
                          <button
                            key={at.type}
                            onClick={() => addAction(step.id, at.type)}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-lg border hover:border-primary hover:bg-indigo-50 transition-all text-center"
                          >
                            <at.icon className={`h-4 w-4 ${at.color}`} />
                            <span className="text-[11px] font-medium">{at.label}</span>
                          </button>
                        ))}
                        <button onClick={() => setShowAddAction(null)} className="col-span-3 text-xs text-muted-foreground py-1">Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddAction(step.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs text-primary border border-dashed border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Action
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Arrow between steps */}
              {si < flow.length - 1 && (
                <div className="flex items-center justify-center py-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-px h-4 bg-gray-200" />
                    <ChevronRight className="h-3 w-3 text-gray-300 rotate-90" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-3">Flow Overview</h3>
            <div className="space-y-2">
              {flow.map(step => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: step.color }} />
                  <span className="text-sm flex-1">{step.status}</span>
                  <span className="text-xs text-muted-foreground">{step.actions.length}x</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
            <h3 className="font-bold text-sm text-indigo-800 mb-2">Pro Tips</h3>
            <ul className="text-xs text-indigo-700 space-y-2">
              <li>• SMS notifications at "Shipped" reduce WISMO calls by 60%</li>
              <li>• Review request email 24h after delivery boosts reviews 3×</li>
              <li>• Webhook integration syncs with your courier in real-time</li>
              <li>• Auto stock update prevents overselling automatically</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-3">Action Stats (30d)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">SMS sent</span><span className="font-bold">4,821</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Emails sent</span><span className="font-bold">3,412</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Webhooks fired</span><span className="font-bold">2,891</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Automations run</span><span className="font-bold">18,234</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
