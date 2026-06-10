'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle2, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ChatWidgetSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [messengerUsername, setMessengerUsername] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/chatbot/config')
      .then(r => {
        const s = r.data.data as Record<string, string>;
        setEnabled(s['chatbot.enabled'] === 'true');
        setWelcomeMessage(s['chatbot.welcomeMessage'] ?? '');
        setWhatsappNumber(s['contact.whatsappNumber'] ?? '');
        setMessengerUsername(s['contact.messengerUsername'] ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      const body: Record<string, string> = {
        'chatbot.enabled': enabled ? 'true' : 'false',
        'chatbot.welcomeMessage': welcomeMessage,
        'contact.whatsappNumber': whatsappNumber,
        'contact.messengerUsername': messengerUsername,
      };
      await api.post('/chatbot/admin/config', body);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail — production would show a toast
    }
  };

  const inputCls =
    'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

  if (loading)
    return (
      <div className="max-w-3xl py-12 text-center text-sm text-muted-foreground">
        Loading settings…
      </div>
    );

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <div
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/settings"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="rounded-xl bg-orange-100 p-2.5">
          <MessageCircle className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold">Chat Widget</h1>
          <p className="text-sm text-muted-foreground">
            Unkora AI chatbot and floating contact buttons
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-0.5">How the widget works</p>
          <p>
            The widget appears on the right side of the storefront. WhatsApp and Messenger buttons
            open direct conversations with your team, while the AI bot answers customer questions
            from the{' '}
            <Link href="/admin/support/knowledge-base" className="underline font-medium">
              Knowledge Base
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Unkora AI */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <h2 className="font-semibold">Unkora AI</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enable Unkora AI Chatbot</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Shows the AI chat button on the storefront
            </p>
          </div>
          <Toggle value={enabled} onChange={() => setEnabled(!enabled)} />
        </div>

        <div className="border-t pt-5">
          <label className="mb-1.5 block text-sm font-medium">Welcome Message</label>
          <textarea
            value={welcomeMessage}
            onChange={e => setWelcomeMessage(e.target.value)}
            placeholder="হ্যালো! 👋 আমি Unkora AI। আপনাকে কীভাবে সাহায্য করতে পারি?"
            rows={3}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The first message customers see when they open the chat
          </p>
        </div>
      </div>

      {/* Contact buttons */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <h2 className="font-semibold">Contact Buttons</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium">WhatsApp Number</label>
          <input
            value={whatsappNumber}
            onChange={e => setWhatsappNumber(e.target.value)}
            placeholder="8801XXXXXXXXX — country code, no +"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Leave blank to hide the WhatsApp button
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Messenger Page Username</label>
          <input
            value={messengerUsername}
            onChange={e => setMessengerUsername(e.target.value)}
            placeholder="yourpage — from m.me/yourpage"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Leave blank to hide the Messenger button
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Saved!
            </>
          ) : (
            'Save Settings'
          )}
        </button>
        <Link
          href="/admin/settings"
          className="rounded-xl border px-6 py-2.5 text-sm hover:bg-accent transition-colors"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
