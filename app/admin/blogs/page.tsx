'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Newspaper, Plus, Search, Edit, Trash2, Globe, EyeOff, Loader2, ArrowLeft, X, CheckCircle2, AlertCircle } from "lucide-react";
import Link from 'next/link';

interface ContentItem {
  id: string;
  title: string;
  slug?: string;
  content: string;
  categoryId?: string;
  published: boolean;
  createdAt: string;
}

export default function BlogManagement() {
  const [blogs, setBlogs] = useState<ContentItem[]>([]);
  const [news, setNews] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'blogs' | 'news'>('blogs');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    categoryId: '',
    published: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, nRes] = await Promise.all([
        fetch('/api/admin/blogs'),
        fetch('/api/admin/news')
      ]);
      const bData = await bRes.json();
      const nData = await nRes.json();
      if (bData.blogs) setBlogs(bData.blogs);
      if (nData.news) setNews(nData.news);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'blogs' ? '/api/admin/blogs' : '/api/admin/news';
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessage({ type: 'success', text: `${activeTab === 'blogs' ? 'Blog' : 'News'} ${editingItem ? 'updated' : 'created'} successfully` });
      setShowModal(false);
      setEditingItem(null);
      setForm({ title: '', slug: '', content: '', categoryId: '', published: false });
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit content';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab === 'blogs' ? 'blog' : 'news'}?`)) return;
    try {
      const endpoint = activeTab === 'blogs' ? '/api/admin/blogs' : '/api/admin/news';
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete content';
      alert(errorMessage);
    }
  };

  const togglePublish = async (item: ContentItem) => {
    try {
      const endpoint = activeTab === 'blogs' ? '/api/admin/blogs' : '/api/admin/news';
      const res = await fetch(`${endpoint}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, published: !item.published })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle status';
      alert(errorMessage);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Content Management</h1>
          <p className="text-slate-500 mt-2">Manage your blog posts, healthcare news, and announcements.</p>
        </div>
        <button 
          onClick={() => {
            setEditingItem(null);
            setForm({ title: '', slug: '', content: '', categoryId: '', published: false });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create {activeTab === 'blogs' ? 'Blog' : 'News'}
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('blogs')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'blogs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blogs ({blogs.length})
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('news')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'news' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            News ({news.length})
          </div>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Title</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
                    </td>
                  </tr>
                ) : (activeTab === 'blogs' ? blogs : news).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                      No {activeTab} found. Click "Create" to start.
                    </td>
                  </tr>
                ) : (
                  (activeTab === 'blogs' ? blogs : news).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{item.title}</span>
                          {activeTab === 'blogs' && <span className="text-[10px] text-slate-400 italic">/{item.slug}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {item.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => togglePublish(item)}
                            className={`p-1.5 rounded border border-transparent transition-all ${item.published ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                            title={item.published ? 'Unpublish' : 'Publish'}
                          >
                            {item.published ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                          </button>
                          <button 
                            onClick={() => {
                              setEditingItem(item);
                              setForm({
                                title: item.title,
                                slug: item.slug || '',
                                content: item.content,
                                categoryId: item.categoryId || '',
                                published: item.published
                              });
                              setShowModal(true);
                            }}
                            className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-500 transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl border-0 shadow-2xl">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-serif">{editingItem ? 'Edit' : 'Create'} {activeTab === 'blogs' ? 'Blog' : 'News'}</CardTitle>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter catchy title..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    value={form.title}
                    onChange={e => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                      setForm({ ...form, title, slug: activeTab === 'blogs' ? slug : '' });
                    }}
                  />
                </div>

                {activeTab === 'blogs' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Slug (URL Path)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="how-to-stay-healthy"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                      value={form.slug}
                      onChange={e => setForm({ ...form, slug: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Content (HTML or Markdown)</label>
                  <textarea 
                    required
                    placeholder="Write your content here..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[200px]"
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="published"
                    checked={form.published}
                    onChange={e => setForm({ ...form, published: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="published" className="text-sm font-medium text-slate-700">Publish immediately</label>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  {editingItem ? 'Update' : 'Create'} {activeTab === 'blogs' ? 'Blog' : 'News'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex justify-center">
        <Link 
          href="/admin" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
