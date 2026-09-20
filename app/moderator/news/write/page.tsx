"use client";

import { useState, useEffect } from "react";
import { 
  PenTool, Plus, Loader2, Send, Trash2, Edit2, 
  FileText, Clock, AlertCircle, CheckCircle2, MessageSquare, Newspaper
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthContext";

interface News {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: string;
  feedback?: string;
  updatedAt: string;
}

export default function NewsWriterPage() {
  const { user } = useAuth();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moderator/news?scope=writer');
      const data = await res.json();
      if (data.success) {
        setNewsList(data.news || []);
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleSave = async (submitAfter = false) => {
    const method = editingNews ? 'PATCH' : 'POST';
    const url = editingNews ? `/api/moderator/news/${editingNews.id}` : '/api/moderator/news';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, excerpt })
      });
      const data = await res.json();

      if (data.success) {
        if (submitAfter) {
          await handleSubmit(editingNews?.id || data.news.id);
        } else {
          resetForm();
          fetchNews();
        }
      } else {
        alert(data.message || "Failed to save news");
      }
    } catch (err) {
      alert("Error saving news");
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      const res = await fetch(`/api/moderator/news/${id}/submit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid API response:", text);
        throw new Error("API returned HTML instead of JSON. Check API route path.");
      }

      if (data.success) {
        // Success Message
        alert(data.message || "News submitted for publisher review");
        
        // Remove from local state immediately
        setNewsList(prev => prev.filter(item => item.id !== id));
        
        resetForm();
      } else {
        alert(data.message || "Failed to submit news");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      alert(err.message || "Error submitting news");
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Move this news to archive?")) return;
    try {
      const res = await fetch(`/api/moderator/news/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "News moved to archive");
        fetchNews();
      } else {
        alert(data.message || "Failed to archive news");
      }
    } catch (err) {
      alert("Error archiving news");
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingNews(null);
    setTitle("");
    setContent("");
    setExcerpt("");
  };

  const startEdit = (news: News) => {
    setEditingNews(news);
    setTitle(news.title);
    setContent(news.content);
    setExcerpt(news.excerpt || "");
    setIsCreating(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">Draft</Badge>;
      case 'SUBMITTED': return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Pending Review</Badge>;
      case 'RETURNED': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 uppercase text-[10px]">Action Required</Badge>;
      case 'REJECTED': return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 uppercase text-[10px]">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading your news desk...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shadow-sm">
            <Newspaper className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">News Writer</h1>
            <p className="text-slate-500">Draft and submit medical news for publication</p>
          </div>
        </div>

        {!isCreating && (
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 h-11 shadow-lg shadow-orange-600/20"
          >
            <Plus className="h-4 w-4 mr-2" /> Create New Article
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{editingNews ? 'Edit News Article' : 'Compose News Article'}</CardTitle>
                <CardDescription>Share the latest medical insights and updates</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-slate-400">Cancel</Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {editingNews?.status === 'RETURNED' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Feedback from Publisher</p>
                  <p className="text-sm text-amber-700 italic">"{editingNews.feedback}"</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Article Title</label>
              <input 
                type="text"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xl font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-300"
                placeholder="Enter a compelling headline..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Short Excerpt</label>
              <textarea 
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-300 min-h-[80px]"
                placeholder="A brief summary for the preview card..."
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Content Body</label>
              <textarea 
                className="w-full h-96 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base outline-none focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-300 resize-none leading-relaxed"
                placeholder="Write your news article here..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={() => handleSave(false)} 
                variant="outline"
                className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Save as Draft
              </Button>
              <Button 
                onClick={() => handleSave(true)}
                className="flex-1 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-600/20"
              >
                Submit for Review <Send className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No articles yet</h3>
              <p className="text-slate-500 text-sm mt-1">Start your first medical news article today.</p>
            </div>
          ) : (
            newsList.map((news) => (
              <Card key={news.id} className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white flex flex-col h-full group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    {getStatusBadge(news.status)}
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      {new Date(news.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold line-clamp-2 text-slate-900 group-hover:text-orange-600 transition-colors">
                    {news.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {news.excerpt || news.content.substring(0, 150)}...
                  </p>
                  
                  {news.status === 'RETURNED' && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl flex gap-2 items-start border border-amber-100">
                      <MessageSquare className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-800 italic line-clamp-2">"{news.feedback}"</p>
                    </div>
                  )}
                </CardContent>
                <div className="p-4 bg-slate-50/50 border-t flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                      onClick={() => startEdit(news)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      onClick={() => handleArchive(news.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {news.status !== 'SUBMITTED' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleSubmit(news.id)}
                      className="h-8 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold px-3 rounded-lg"
                    >
                      Submit
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
