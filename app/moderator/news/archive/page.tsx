"use client";

import { useState, useEffect } from "react";
import { 
  History, RotateCcw, Trash2, Loader2, 
  FileText, Clock, User, AlertCircle, Search, Newspaper, ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface News {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: string;
  authorId: string;
  author?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}

export default function NewsArchivePage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchArchive = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moderator/news?scope=archive');
      const data = await res.json();
      if (data.success) {
        setNewsList(data.news || []);
      }
    } catch (err) {
      console.error("Failed to fetch archive:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  const handleRestore = async (id: string) => {
    if (!confirm("Restore this news article to drafts?")) return;
    try {
      const res = await fetch(`/api/moderator/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' })
      });
      if (res.ok) fetchArchive();
    } catch (err) {
      alert("Error restoring news");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("PERMANENT DELETE: This action cannot be undone. Delete this news from database?")) return;
    try {
      const res = await fetch(`/api/moderator/news/${id}/permanent`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "News deleted permanently");
        fetchArchive();
      } else {
        alert(data.message || "Failed to delete news");
      }
    } catch (err) {
      alert("Error deleting news");
    }
  };

  const filteredNews = newsList.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
        <p className="text-slate-500 font-medium">Accessing vault...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">News Archive</h1>
            <p className="text-slate-500">Restore or permanently remove archived articles</p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search archive..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-500/20"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 mb-10">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          <span className="font-bold">Important:</span> Archived articles are hidden from the public site but retained in the system for internal records. Permanent deletion is irreversible.
        </p>
      </div>

      {filteredNews.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <Newspaper className="h-12 w-12 text-slate-100 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-300">Vault is empty</h3>
          <p className="text-slate-400 text-xs mt-1">No archived news articles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((news) => (
            <Card key={news.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white flex flex-col h-full grayscale opacity-80 hover:grayscale-0 hover:opacity-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full uppercase tracking-wider">Archived</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    Deleted: {new Date(news.deletedAt).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold line-clamp-2 text-slate-700">{news.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
                  <User className="h-3 w-3" />
                  <span>{news.author?.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  Originally created on {new Date(news.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
              <div className="p-4 bg-slate-50/50 border-t flex gap-2">
                <Button 
                  onClick={() => handleRestore(news.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 rounded-lg border-slate-200 text-emerald-600 font-bold text-[10px] uppercase hover:bg-emerald-50"
                >
                  <RotateCcw className="h-3 w-3 mr-1.5" /> Restore
                </Button>
                <Button 
                  onClick={() => handlePermanentDelete(news.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 rounded-lg border-slate-200 text-red-500 font-bold text-[10px] uppercase hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1.5" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
