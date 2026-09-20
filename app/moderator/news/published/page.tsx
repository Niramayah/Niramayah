"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, Edit2, Trash2, Loader2, 
  FileText, Clock, User, Eye, Search, AlertCircle, X, Save, Newspaper
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useModeratorPermissions } from "@/hooks/use-moderator-permissions";

interface News {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: { name: string; email: string };
}

export default function PublishedNewsPage() {
  const { hasPerm } = useModeratorPermissions();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit State
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPublished = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moderator/news?scope=published');
      const data = await res.json();
      if (res.ok && data.success) {
        setNewsList(data.news || []);
      } else {
        throw new Error(data.message || "Failed to fetch published news");
      }
    } catch (err: any) {
      console.error("Published fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublished();
  }, []);

  const handleUpdate = async () => {
    if (!editingNews) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/moderator/news/${editingNews.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingNews.title,
          content: editingNews.content,
          excerpt: editingNews.excerpt,
          action: 'UPDATE_PUBLISHED'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingNews(null);
        fetchPublished();
      } else {
        alert(data.message || "Failed to update news");
      }
    } catch (err) {
      alert("Error updating news");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Move this published news to archive?")) return;
    try {
      const res = await fetch(`/api/moderator/news/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "News moved to archive");
        fetchPublished();
      } else {
        alert(data.message || "Failed to archive news");
      }
    } catch (err) {
      alert("Error archiving news");
    }
  };

  const filteredNews = newsList.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Published News</h1>
            <p className="text-slate-500">Manage medical news articles currently live on the platform</p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search news..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
          <p className="text-slate-500 font-medium">Loading published news...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <Newspaper className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No Published News</h3>
          <p className="text-slate-500 mt-1">Once articles are approved, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((news) => (
            <Card key={news.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white flex flex-col group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full uppercase tracking-wider">
                    Live
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <Clock className="h-3 w-3" />
                    {new Date(news.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-orange-600 transition-colors">{news.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="h-3.5 w-3.5" />
                    <span>{news.author?.name || 'Unknown Author'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 italic leading-relaxed">
                    {news.excerpt || news.content.substring(0, 100)}...
                  </p>
                </div>
                
                <div className="flex items-center justify-end gap-2 mt-auto pt-4 border-t border-slate-50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingNews(news)}
                    className="text-slate-400 hover:text-orange-600 h-8 font-bold text-[10px] uppercase"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleArchive(news.id)}
                    className="text-slate-400 hover:text-red-500 h-8 font-bold text-[10px] uppercase"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingNews && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl shadow-2xl border-0 animate-in zoom-in-95 duration-300 rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 p-6">
              <div>
                <CardTitle className="text-xl">Edit Published News</CardTitle>
                <CardDescription>Updates are immediate and live on the public site</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingNews(null)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Headline</label>
                <input 
                  type="text"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                  value={editingNews.title}
                  onChange={e => setEditingNews({...editingNews, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Summary/Excerpt</label>
                <textarea 
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-orange-500/10 transition-all resize-none min-h-[80px]"
                  value={editingNews.excerpt || ""}
                  onChange={e => setEditingNews({...editingNews, excerpt: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Article Body</label>
                <textarea 
                  className="w-full h-80 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-orange-500/10 transition-all resize-none leading-relaxed"
                  value={editingNews.content}
                  onChange={e => setEditingNews({...editingNews, content: e.target.value})}
                />
              </div>
              
              <div className="flex gap-4 pt-6 border-t">
                <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200" onClick={() => setEditingNews(null)}>
                  Discard Changes
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold" 
                  onClick={handleUpdate}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save & Update Live</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
