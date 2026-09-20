"use client";

import { useState, useEffect } from "react";
import { 
  FileCheck, CheckCircle2, XCircle, Undo2, Loader2, FileText, 
  MessageCircle, Clock, Calendar, User, Eye, History, Trash2, RotateCcw, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Blog {
  id: string;
  title: string;
  content: string;
  status: string;
  authorId: string;
  publisherId?: string;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  deletedAt?: string;
  category?: { name: string };
  author?: { name: string; email: string };
}

export default function BlogPublishPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingBlog, setReviewingBlog] = useState<Blog | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState("");

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/moderator/blogs?scope=publisher`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to fetch blogs: ${res.status}`);
      }

      setBlogs(data.blogs || []);
    } catch (err: any) {
      console.error("[BlogPublish] Fetch error:", err);
      setError(err.message || "Unable to load blogs. Please check your permissions.");
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleAction = async (blogId: string, action: string, feedbackText?: string) => {
    if ((action === 'return_for_edit' || action === 'reject') && !feedbackText?.trim()) {
      alert(`Please provide feedback for the author to ${action.replace(/_/g, ' ')}.`);
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/moderator/blogs/${blogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback: feedbackText })
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        alert(`${action.replace(/_/g, ' ').toUpperCase()} successful`);
        setReviewingBlog(null);
        setFeedback("");
        fetchBlogs();
      } else {
        throw new Error(data.message || data.error || "Failed to process blog");
      }
    } catch (err: any) {
      console.error("[BlogPublish] Action error:", err);
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'SUBMITTED': return { label: 'Pending Review', color: 'bg-orange-50 text-orange-600' };
      case 'PUBLISHED': return { label: 'Approved', color: 'bg-emerald-50 text-emerald-600' };
      case 'RETURNED': return { label: 'Returned', color: 'bg-blue-50 text-blue-600' };
      case 'REJECTED': return { label: 'Rejected', color: 'bg-red-50 text-red-600' };
      case 'ARCHIVED': return { label: 'Archived', color: 'bg-slate-50 text-slate-600' };
      default: return { label: status, color: 'bg-slate-50 text-slate-500' };
    }
  };

  const renderBlogList = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
          <p className="text-slate-500">Loading blogs for review...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900">Fetch Error</h3>
          <p className="text-red-600 mt-1 max-w-md mx-auto">{error}</p>
          <Button onClick={fetchBlogs} variant="outline" className="mt-6 border-red-200 text-red-700 hover:bg-red-100">
            Retry Fetch
          </Button>
        </div>
      );
    }

    if (blogs.length === 0) {
      return (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <CheckCircle2 className="h-12 w-12 text-slate-100 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
          <p className="text-slate-500 mt-1">There are no pending submissions for review.</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-6">
        {blogs.map((blog) => (
          <Card key={blog.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusLabel(blog.status).color}`}>
                  {getStatusLabel(blog.status).label}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                  <Clock className="h-3 w-3" />
                  {new Date(blog.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <CardTitle className="text-lg font-bold line-clamp-1">{blog.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs">
                <User className="h-3 w-3" />
                Author: {blog.author?.name || "Unknown"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Created: {new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 italic">
                  {blog.content.substring(0, 100).replace(/<[^>]*>/g, '')}...
                </p>
                {blog.feedback && (
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1 flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> Previous Feedback
                    </p>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{blog.feedback}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => setReviewingBlog(blog)} variant="outline" className="flex-1 text-xs h-9 rounded-lg">
                  <Eye className="h-3 w-3 mr-1" /> Review Content
                </Button>
                <Button onClick={() => handleAction(blog.id, 'archive')} variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {!reviewingBlog ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900">Blog Publisher</h1>
                <p className="text-slate-500">Review and manage health articles</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-800">Pending Review</h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Article Review Dashboard</p>
            </div>

            <div className="mt-6">
              {renderBlogList()}
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => setReviewingBlog(null)} className="text-slate-500 hover:text-slate-900">
              Back to List
            </Button>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleAction(reviewingBlog.id, 'reject', feedback)} 
                disabled={isProcessing}
                className="rounded-xl px-6 border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <XCircle className="h-4 w-4 mr-2" /> Reject
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleAction(reviewingBlog.id, 'return_for_edit', feedback)} 
                disabled={isProcessing}
                className="rounded-xl px-6 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Undo2 className="h-4 w-4 mr-2" /> Return for Edit
              </Button>
              <Button 
                onClick={() => handleAction(reviewingBlog.id, 'publish')} 
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve & Publish
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <h1 className="text-3xl font-serif font-bold text-slate-900">{reviewingBlog.title}</h1>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">{reviewingBlog.content}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-0 shadow-lg rounded-2xl bg-white sticky top-24">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Review Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 pb-4 border-b border-slate-50">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Current Status</span>
                      <span className="font-bold text-slate-700">{reviewingBlog.status}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Author</span>
                      <span className="font-bold text-slate-700">{reviewingBlog.author?.name || "Unknown"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                      <MessageCircle className="h-3 w-3" /> Feedback for Author
                    </label>
                    <textarea 
                      placeholder="Enter feedback or return reason..."
                      className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Mandatory if returning or rejecting the article.
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
