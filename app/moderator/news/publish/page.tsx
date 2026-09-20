"use client";

import { useState, useEffect } from "react";
import { 
  FileCheck, CheckCircle2, XCircle, Undo2, Loader2, FileText, 
  MessageCircle, Clock, Calendar, User, Eye, History, Trash2, Newspaper, ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
}

export default function NewsPublisherPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingNews, setReviewingNews] = useState<News | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moderator/news?scope=publisher');
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
    fetchPending();
  }, []);

  const handleAction = async (id: string, action: string, fb?: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/moderator/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback: fb })
      });
      const data = await res.json();
      if (data.success) {
        setReviewingNews(null);
        setFeedback("");
        fetchPending();
      } else {
        alert(data.message || "Action failed");
      }
    } catch (err) {
      alert("Error processing news");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading news queue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {!reviewingNews ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900">News Publisher</h1>
                <p className="text-slate-500">Review and approve news articles for publication</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-800">Pending Review</h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">News Queue</p>
            </div>

            {newsList.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                <CheckCircle2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
                <p className="text-slate-500 text-sm mt-1">There are no news articles waiting for review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsList.map((news) => (
                  <Card key={news.id} className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white flex flex-col h-full group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 uppercase text-[9px] tracking-widest px-2 py-0">Review</Badge>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {new Date(news.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold line-clamp-2 text-slate-900 group-hover:text-orange-600 transition-colors">
                        {news.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="flex items-center gap-2 mb-4 text-xs text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        <span className="font-medium truncate">{news.author?.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {news.excerpt || news.content.substring(0, 150)}...
                      </p>
                    </CardContent>
                    <div className="p-4 bg-slate-50/50 border-t">
                      <Button 
                        onClick={() => setReviewingNews(news)}
                        className="w-full bg-white hover:bg-orange-600 hover:text-white text-orange-600 border border-orange-200 text-xs font-bold rounded-xl h-10 transition-all shadow-sm"
                      >
                        Review Content
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => setReviewingNews(null)} className="text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Queue
            </Button>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={async () => {
                   if (!confirm("Are you sure you want to archive this submission?")) return;
                   setIsProcessing(true);
                   try {
                     const res = await fetch(`/api/moderator/news/${reviewingNews.id}`, { method: 'DELETE' });
                     if (res.ok) {
                       setReviewingNews(null);
                       fetchPending();
                     }
                   } finally {
                     setIsProcessing(false);
                   }
                }} 
                disabled={isProcessing}
                className="rounded-xl px-6 border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Archive
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (!feedback.trim()) return alert("Please provide feedback first.");
                  handleAction(reviewingNews.id, 'return_for_edit', feedback);
                }} 
                disabled={isProcessing}
                className="rounded-xl px-6 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Undo2 className="h-4 w-4 mr-2" /> Return
              </Button>
              <Button 
                onClick={() => handleAction(reviewingNews.id, 'publish')} 
                disabled={isProcessing}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 shadow-lg shadow-orange-600/20"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Publish Now
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg overflow-hidden rounded-3xl">
                <div className="h-64 bg-slate-100 flex items-center justify-center text-slate-300">
                   <Newspaper className="h-20 w-20 opacity-20" />
                </div>
                <CardContent className="p-10">
                  <h2 className="text-4xl font-serif font-bold text-slate-900 mb-6 leading-tight">{reviewingNews.title}</h2>
                  <div className="flex items-center gap-6 mb-10 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                        {reviewingNews.author?.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{reviewingNews.author?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">{new Date(reviewingNews.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed whitespace-pre-wrap">
                    {reviewingNews.content}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-0 shadow-lg rounded-3xl sticky top-8">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                  <CardTitle className="text-lg">Publisher Feedback</CardTitle>
                  <CardDescription>Required for returning articles</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <textarea 
                    className="w-full h-40 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                    placeholder="Provide specific instructions for the author..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                  />
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-2xl flex gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      Constructive feedback helps writers improve article quality and adherence to guidelines.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Removed local Badge in favor of @/components/ui/badge
