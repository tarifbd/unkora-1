'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { aiApi } from '@/lib/api/ai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

const STORAGE_KEY = 'unkora-ai-chat';
const GREETING = 'আমি UNKORA AI! কীভাবে সাহায্য করতে পারি? বই, অর্ডার বা ডেলিভারি সংক্রান্ত যেকোনো প্রশ্ন করুন।';

function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    // ignore quota errors
  }
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-500">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-700 px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AiChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load persisted messages on mount
  useEffect(() => {
    const saved = loadMessages();
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      const greeting: ChatMessage = { role: 'assistant', content: GREETING, id: 'greeting' };
      setMessages([greeting]);
      saveMessages([greeting]);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text, id: Date.now().toString() };
    const next = [...messages, userMsg];
    setMessages(next);
    saveMessages(next);
    setInput('');
    setLoading(true);

    try {
      const { reply } = await aiApi.chat(text, pathname);
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: reply,
        id: (Date.now() + 1).toString(),
      };
      const withReply = [...next, aiMsg];
      setMessages(withReply);
      saveMessages(withReply);
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'দুঃখিত, একটি সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।',
        id: (Date.now() + 1).toString(),
      };
      const withErr = [...next, errMsg];
      setMessages(withErr);
      saveMessages(withErr);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, pathname]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const clearChat = () => {
    const greeting: ChatMessage = { role: 'assistant', content: GREETING, id: 'greeting' };
    setMessages([greeting]);
    saveMessages([greeting]);
  };

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* Collapsed button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-50 sm:bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all"
          aria-label="AI সাহায্য"
          title="AI সাহায্য"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 sm:bottom-6 flex w-[calc(100vw-2rem)] max-w-[340px] flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          style={{ height: 480 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-orange-500 px-4 py-3 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">UNKORA AI সহায়তা</p>
              <p className="text-[10px] text-white/70 mt-0.5">সাধারণত সঙ্গে সঙ্গে উত্তর দেয়</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-[10px] font-medium px-2"
                title="নতুন কথোপকথন"
              >
                নতুন
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-500">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-orange-500 text-white'
                      : 'rounded-bl-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="প্রশ্ন লিখুন..."
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none min-w-0"
                disabled={loading}
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || loading}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white disabled:opacity-40 hover:bg-orange-600 active:scale-95 transition-all"
                aria-label="পাঠান"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
