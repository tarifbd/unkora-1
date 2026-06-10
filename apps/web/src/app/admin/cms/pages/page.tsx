'use client';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, Pencil, Trash2, Loader2, Globe, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useState } from 'react';

interface CmsPage { id: string; title: string; slug: string; status: string; updatedAt: string }

export default function CmsPagesPage() {
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<{ data: CmsPage[]; total: number }>({
    queryKey: ['cms-pages'],
    queryFn: () => api.get('/cms/pages?limit=50').then(r => r.data.data).catch(() => ({ data: [], total: 0 })),
  });

  const pages = data?.data ?? [];

  const deletePage = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    setDeleting(id);
    try {
      await api.delete(`/cms/pages/${id}`);
      toast.success('Page deleted');
      refetch();
    } catch {
      toast.error('Failed to delete page');
    } finally {
      setDeleting(null);
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    try {
      await api.patch(`/cms/pages/${id}`, { status: current === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' });
      toast.success('Status updated');
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const defaultPages = [
    { title: 'About Us',       slug: 'about' },
    { title: 'Contact Us',     slug: 'contact' },
    { title: 'Privacy Policy', slug: 'privacy-policy' },
    { title: 'Terms of Service', slug: 'terms' },
    { title: 'Return Policy',  slug: 'return-policy' },
    { title: 'FAQ',            slug: 'faq' },
  ];

  const createDefault = async (title: string, slug: string) => {
    try {
      await api.post('/cms/pages', { title, slug, status: 'DRAFT', content: `<h1>${title}</h1><p>Add your content here.</p>` });
      toast.success(`"${title}" page created as Draft`);
      refetch();
    } catch {
      toast.error('Failed to create page');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" /> CMS Pages
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage static pages like About, Contact, Privacy Policy.</p>
        </div>
        <button
          onClick={() => toast.info('Page editor coming soon')}
          className="flex items-center gap-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-xl text-sm hover:bg-orange-600 transition-colors">
          <Plus className="h-4 w-4" /> New Page
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-orange-500" /></div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No pages yet</p>
            <p className="text-sm text-gray-400 mt-1">Create default pages for your store:</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {defaultPages.map(p => (
              <button key={p.slug} onClick={() => createDefault(p.title, p.slug)}
                className="text-left p-3 rounded-xl border border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors group">
                <FileText className="h-5 w-5 text-gray-300 group-hover:text-orange-500 mb-2 transition-colors" />
                <p className="text-sm font-semibold text-gray-700 group-hover:text-orange-600">{p.title}</p>
                <p className="text-xs text-gray-400">/{p.slug}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Title', 'Slug', 'Status', 'Last Updated', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pages.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{p.title}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">/{p.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${p.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(p.updatedAt).toLocaleDateString('en-BD')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a href={`/${p.slug}`} target="_blank"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                        <button onClick={() => toggleStatus(p.id, p.status)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                          {p.status === 'PUBLISHED' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deletePage(p.id)} disabled={deleting === p.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
