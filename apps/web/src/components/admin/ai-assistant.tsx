'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Loader2, Minimize2, Maximize2, Sparkles, RotateCcw } from 'lucide-react';
import api from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: 'Sales summary', prompt: 'Give me a brief summary of what I should focus on to boost sales this week.' },
  { label: 'Low stock tips', prompt: 'What are best practices for managing low-stock products in an eCommerce store?' },
  { label: 'COD risk', prompt: 'How can I reduce COD (cash on delivery) fraud and improve reconciliation?' },
  { label: 'Abandoned cart', prompt: 'What are effective strategies to recover abandoned carts?' },
];

const SYSTEM_CONTEXT = `You are UNKORA Admin AI — a smart assistant for the UNKORA eCommerce admin panel.
UNKORA is a Bangladeshi eCommerce platform selling books, organic foods, leather products, handicrafts, baby products, and daily necessities.
Be concise, practical, and specific to Bangladeshi eCommerce context. Use ৳ for currency.
Respond in plain text (no markdown formatting) unless the user specifically asks for formatted content.
Keep responses under 300 words unless a longer answer is clearly needed.`;

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m your UNKORA AI assistant. Ask me anything about your store, products, sales strategies, or admin tasks.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build conversation context for the prompt
    const history = messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    const fullPrompt = `${SYSTEM_CONTEXT}\n\n${history ? `Previous conversation:\n${history}\n\n` : ''}User: ${trimmed}\nAssistant:`;

    try {
      const { data } = await api.post('/admin/ai/generate/custom', { prompt: fullPrompt, outputFormat: 'text' });
      const content = data?.data?.generatedContent ?? data?.data?.content ?? data?.data ?? 'Sorry, I couldn\'t generate a response.';
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: String(content), timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I couldn\'t connect to the AI service. Make sure an AI provider is configured in AI Studio → Providers.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const reset = () => setMessages([{
    id: 'welcome',
    role: 'assistant',
    content: 'Conversation cleared. How can I help you?',
    timestamp: new Date(),
  }]);

  const panelWidth = expanded ? 'w-[520px]' : 'w-[360px]';
  const panelHeight = expanded ? 'h-[600px]' : 'h-[460px]';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {open && (
        <div className={`${panelWidth} ${panelHeight} flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden transition-all duration-200`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">UNKORA AI</p>
                <p className="text-[10px] text-white/60 mt-0.5">Admin Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={reset} title="Clear chat" className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setExpanded(e => !e)} title={expanded ? 'Minimize' : 'Expand'} className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-0.5" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mr-2" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                  <span className="text-xs text-gray-400">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto [scrollbar-width:none] border-t border-gray-100">
              {QUICK_PROMPTS.map(q => (
                <button key={q.label} onClick={() => void sendMessage(q.prompt)}
                  className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors whitespace-nowrap">
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-gray-100 flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about your store…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              style={{ maxHeight: 100, overflowY: 'auto' }}
            />
            <button
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        title="AI Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
        )}
      </button>
    </div>
  );
}
