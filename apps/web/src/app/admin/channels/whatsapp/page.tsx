'use client';
import { useState } from 'react';
import { MessageCircle, CheckCircle, Loader2, ExternalLink, Info, Send, Radio, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function WhatsAppPage() {
  // Quick Send state
  const [sendPhone, setSendPhone] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Test connection state
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 bg-white';
  const textareaCls = `${inputCls} resize-none`;

  const handleSend = async () => {
    if (!sendPhone.trim() || !sendMessage.trim()) {
      toast.error('Phone number and message are required');
      return;
    }
    setSending(true);
    try {
      await api.post('/whatsapp/send', { to: sendPhone.trim(), message: sendMessage.trim() });
      toast.success('Message sent successfully');
      setSendPhone('');
      setSendMessage('');
    } catch {
      toast.error('Failed to send message. Check API configuration.');
    } finally {
      setSending(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      toast.error('Message is required');
      return;
    }
    setShowConfirm(false);
    setBroadcasting(true);
    try {
      // Fetch all customer phones then broadcast
      const res = await api.get('/users?role=CUSTOMER&limit=5000');
      const users: Array<{ phone?: string }> = res.data?.data ?? [];
      const phones = users.map((u: any) => u.phone).filter(Boolean) as string[];
      if (phones.length === 0) {
        toast.error('No customers with phone numbers found');
        return;
      }
      const result = await api.post('/whatsapp/broadcast', { phones, message: broadcastMessage.trim() });
      const { sent, total } = result.data ?? { sent: 0, total: phones.length };
      toast.success(`Broadcast complete: ${sent}/${total} delivered`);
      setBroadcastMessage('');
    } catch {
      toast.error('Broadcast failed. Check API configuration.');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testPhone.trim()) {
      toast.error('Enter a phone number to test');
      return;
    }
    setTesting(true);
    try {
      await api.post('/whatsapp/send', {
        to: testPhone.trim(),
        message: 'Hello from UNKORA! Your WhatsApp Business API is working correctly. ✅',
      });
      toast.success('Test message sent! Check your WhatsApp.');
    } catch {
      toast.error('Test failed — API not configured or invalid token.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp Business API
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Send order notifications, broadcasts, and transactional messages via Meta WhatsApp Business Cloud API.
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            <span className="font-semibold text-gray-900 text-sm">Connection Status</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
            <AlertCircle className="h-3 w-3" /> Not Verified
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Send a test message to verify your API credentials are correctly configured.
        </p>
        <div className="flex gap-2">
          <input
            value={testPhone}
            onChange={e => setTestPhone(e.target.value)}
            className={inputCls}
            placeholder="+8801XXXXXXXXX"
          />
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors text-sm whitespace-nowrap"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Test Connection
          </button>
        </div>
      </div>

      {/* Quick Send */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-gray-600" />
          <h2 className="font-semibold text-gray-900 text-sm">Quick Send</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
          <input
            value={sendPhone}
            onChange={e => setSendPhone(e.target.value)}
            className={inputCls}
            placeholder="+8801XXXXXXXXX or 01XXXXXXXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
          <textarea
            value={sendMessage}
            onChange={e => setSendMessage(e.target.value)}
            rows={4}
            className={textareaCls}
            placeholder="Type your message here. Supports WhatsApp formatting: *bold*, _italic_"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={sending}
          className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors text-sm"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send Message
        </button>
      </div>

      {/* Broadcast */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-gray-600" />
          <h2 className="font-semibold text-gray-900 text-sm">Broadcast</h2>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            Broadcasts will be sent to all customers who have a phone number on file.
            Ensure users have opted in to receive WhatsApp messages as required by Meta policy.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
          <textarea
            value={broadcastMessage}
            onChange={e => setBroadcastMessage(e.target.value)}
            rows={4}
            className={textareaCls}
            placeholder="Your broadcast message. Supports WhatsApp formatting: *bold*, _italic_"
          />
        </div>
        {showConfirm ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-red-800">Are you sure?</p>
            <p className="text-xs text-red-700">This will send a WhatsApp message to all customers with a phone number. This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={handleBroadcast}
                disabled={broadcasting}
                className="flex items-center gap-2 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors text-sm"
              >
                {broadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Yes, Send Broadcast
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="border border-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={broadcasting || !broadcastMessage.trim()}
            className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors text-sm"
          >
            <Radio className="h-4 w-4" />
            Send Broadcast
          </button>
        )}
      </div>

      {/* Setup Guide */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-4 w-4 text-gray-600" />
          <h2 className="font-semibold text-gray-900 text-sm">Setup Guide</h2>
        </div>
        <ol className="space-y-3 text-sm text-gray-700">
          {[
            { step: 1, text: 'Go to Meta Business Manager at business.facebook.com and create or log in to your account.' },
            { step: 2, text: 'Create a new App → Select "Business" type → Add "WhatsApp" product to your app.' },
            { step: 3, text: 'In WhatsApp → Getting Started, note your Phone Number ID and generate a permanent API Token.' },
            { step: 4, text: 'Add to your API server environment: WHATSAPP_API_TOKEN=<token> and WHATSAPP_PHONE_NUMBER_ID=<id>.' },
            { step: 5, text: 'Restart the API server for the environment variables to take effect.' },
          ].map(({ step, text }) => (
            <li key={step} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                {step}
              </span>
              <span className="text-gray-600 text-xs leading-relaxed pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Official WhatsApp Cloud API Docs
          </a>
        </div>
      </div>
    </div>
  );
}
