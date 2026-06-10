'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileCode2, ChevronDown, ChevronRight, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface CmsPage {
  id?: string;
  key: string;
  title: string;
  slug: string;
  content: string;
  isDirty: boolean;
}

interface ApiFaq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

interface FaqItem extends ApiFaq {
  isExpanded: boolean;
}

const STATIC_PAGES = [
  { key: 'home',     title: 'Home Page',         slug: 'home' },
  { key: 'about',    title: 'About Us',           slug: 'about' },
  { key: 'contact',  title: 'Contact Us',         slug: 'contact' },
  { key: 'privacy',  title: 'Privacy Policy',     slug: 'privacy-policy' },
  { key: 'terms',    title: 'Terms of Service',   slug: 'terms' },
  { key: 'shipping', title: 'Shipping Policy',     slug: 'shipping-policy' },
  { key: 'returns',  title: 'Return Policy',      slug: 'return-policy' },
  { key: 'faq',      title: 'FAQ Page',           slug: 'faq' },
];

export default function CmsEditorPage() {
  const qc = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string>('about');
  const [pages, setPages] = useState<CmsPage[]>(
    STATIC_PAGES.map(p => ({ ...p, content: '', isDirty: false }))
  );
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  // Load all pages from API
  const { isLoading: loadingPages, data: pagesData } = useQuery<{ data: Array<{ id: string; slug: string; content: string }> }>({
    queryKey: ['cms-all-pages'],
    queryFn: () => api.get('/cms/pages?limit=100').then(r => r.data),
  });

  useEffect(() => {
    if (!pagesData?.data) return;
    setPages(prev =>
      prev.map(p => {
        const found = pagesData.data.find(a => a.slug === p.slug);
        return found ? { ...p, id: found.id, content: found.content, isDirty: false } : p;
      })
    );
  }, [pagesData]);

  // Load FAQs
  const { isLoading: loadingFaqs, data: faqsData } = useQuery<ApiFaq[]>({
    queryKey: ['cms-faqs'],
    queryFn: () => api.get('/cms/faqs').then(r => r.data),
  });

  useEffect(() => {
    if (!faqsData) return;
    setFaqs(faqsData.map(f => ({ ...f, isExpanded: false })));
  }, [faqsData]);

  const selectedPage = pages.find(p => p.key === selectedKey);

  const updateContent = (key: string, content: string) => {
    setPages(ps => ps.map(p => p.key === key ? { ...p, content, isDirty: true } : p));
  };

  const [saving, setSaving] = useState(false);
  const savePage = async (key: string) => {
    const page = pages.find(p => p.key === key);
    if (!page) return;
    setSaving(true);
    try {
      await api.put(`/cms/pages/by-slug/${page.slug}`, {
        title: page.title,
        content: page.content,
        status: 'PUBLISHED',
      });
      setPages(ps => ps.map(p => p.key === key ? { ...p, isDirty: false } : p));
      void qc.invalidateQueries({ queryKey: ['cms-all-pages'] });
      toast.success('Page saved successfully');
    } catch {
      toast.error('Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  // FAQ mutations
  const addFaqMutation = useMutation({
    mutationFn: (data: { question: string; answer: string }) =>
      api.post('/cms/faqs', data).then(r => r.data),
    onSuccess: (created: ApiFaq) => {
      setFaqs(fs => [...fs, { ...created, isExpanded: false }]);
      setNewFaq({ question: '', answer: '' });
      toast.success('FAQ added');
    },
    onError: () => toast.error('Failed to add FAQ'),
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cms/faqs/${id}`),
    onSuccess: (_: unknown, id: string) => {
      setFaqs(fs => fs.filter(f => f.id !== id));
      toast.success('FAQ removed');
    },
    onError: () => toast.error('Failed to remove FAQ'),
  });

  const updateFaqMutation = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      api.patch(`/cms/faqs/${id}`, { answer }).then(r => r.data),
    onSuccess: (updated: ApiFaq) => {
      setFaqs(fs => fs.map(f => f.id === updated.id ? { ...updated, isExpanded: f.isExpanded } : f));
    },
  });

  const addFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }
    addFaqMutation.mutate(newFaq);
  };

  const toggleFaq = (id: string) => {
    setFaqs(fs => fs.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f));
  };

  const inputCls = 'w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50';

  if (loadingPages || loadingFaqs) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileCode2 className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-black text-gray-900">CMS Pages</h1>
        </div>
        <p className="text-sm text-gray-500">Edit static pages and manage FAQ content</p>
      </div>

      {/* Page editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Pages</p>
          </div>
          <nav className="py-1">
            {pages.map(page => (
              <button
                key={page.key}
                onClick={() => setSelectedKey(page.key)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${
                  selectedKey === page.key ? 'bg-primary/5 text-primary border-r-2 border-primary' : 'text-gray-700'
                }`}
              >
                <span>{page.title}</span>
                {page.isDirty && <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3 bg-white rounded-2xl border overflow-hidden">
          {selectedPage ? (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
                <div>
                  <h2 className="font-bold text-sm text-gray-900">{selectedPage.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">/{selectedPage.slug}</p>
                </div>
                <button
                  onClick={() => savePage(selectedPage.key)}
                  disabled={saving || !selectedPage.isDirty}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
              <div className="p-5">
                <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Content (HTML / Markdown)</label>
                <textarea
                  value={selectedPage.content}
                  onChange={e => updateContent(selectedPage.key, e.target.value)}
                  rows={18}
                  placeholder={`Enter content for "${selectedPage.title}"...`}
                  className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                <p className="mt-2 text-xs text-gray-400">Supports basic HTML tags and Markdown. Changes are not saved until you click Save.</p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p className="text-sm">Select a page to edit</p>
            </div>
          )}
        </div>
      </div>

      {/* FAQ Manager */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <div>
            <h2 className="font-bold text-sm text-gray-900">FAQ Manager</h2>
            <p className="text-xs text-gray-400 mt-0.5">Manage frequently asked questions</p>
          </div>
          <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full">{faqs.length} FAQs</span>
        </div>

        {/* Existing FAQs */}
        <div className="divide-y">
          {faqs.map((faq, idx) => (
            <div key={faq.id} className="px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-gray-400 w-5 flex-shrink-0">{idx + 1}</span>
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="flex-1 flex items-center justify-between gap-2 text-left group"
                >
                  <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">{faq.question}</span>
                  {faq.isExpanded
                    ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                <button
                  onClick={() => deleteFaqMutation.mutate(faq.id)}
                  disabled={deleteFaqMutation.isPending}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {faq.isExpanded && (
                <div className="mt-2 ml-8 pl-3 border-l-2 border-gray-100">
                  <textarea
                    value={faq.answer}
                    onChange={e => {
                      const val = e.target.value;
                      setFaqs(fs => fs.map(f => f.id === faq.id ? { ...f, answer: val } : f));
                    }}
                    onBlur={e => updateFaqMutation.mutate({ id: faq.id, answer: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-gray-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">Auto-saved on blur</p>
                </div>
              )}
            </div>
          ))}
          {faqs.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No FAQs yet. Add one below.</div>
          )}
        </div>

        {/* Add new FAQ */}
        <div className="px-5 py-4 border-t bg-gray-50">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Add New FAQ</p>
          <div className="space-y-2">
            <input
              value={newFaq.question}
              onChange={e => setNewFaq(f => ({ ...f, question: e.target.value }))}
              placeholder="Question..."
              className={inputCls}
            />
            <textarea
              value={newFaq.answer}
              onChange={e => setNewFaq(f => ({ ...f, answer: e.target.value }))}
              placeholder="Answer..."
              rows={3}
              className={`${inputCls} resize-none`}
            />
            <div className="flex justify-end">
              <button
                onClick={addFaq}
                disabled={addFaqMutation.isPending}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {addFaqMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add FAQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
