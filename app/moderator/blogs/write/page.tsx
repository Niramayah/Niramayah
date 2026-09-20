"use client";

import { useState, useEffect } from "react";
import { 
  PenTool, Plus, Edit2, Trash2, Loader2, Send, Save, 
  FileText, AlertCircle, CheckCircle2, MessageCircle, Clock 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Blog {
  id: string;
  title: string;
  content: string;
  status: string;
  feedback: string | null;
  updatedAt: string;
  category?: { name: string };
}

export default function BlogWritePage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBlog, setEditingBlog] = useState<Partial<Blog> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/moderator/blogs?scope=writer`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to fetch blogs: ${res.status}`);
      }

      setBlogs(data.blogs || []);
    } catch (err: any) {
      console.error("[BlogWrite] Fetch error:", err);
      setError(err.message || "Unable to load blogs. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSave = async (isSubmitting = false) => {
    if (!editingBlog?.title?.trim() || !editingBlog?.content?.trim()) {
      alert("Please provide both title and content.");
      return;
    }
    setIsSaving(true);
    setSuccessMessage("");
    setError(null);
    
    try {
      const method = editingBlog.id ? 'PATCH' : 'POST';
      const url = editingBlog.id ? `/api/moderator/blogs/${editingBlog.id}` : '/api/moderator/blogs';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editingBlog.title,
          content: editingBlog.content,
          categoryId: editingBlog.categoryId,
          action: isSubmitting ? 'SUBMIT' : undefined
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        fetchBlogs();
        setEditingBlog(null);
        setSuccessMessage(isSubmitting ? "Blog submitted for publisher review" : "Draft saved successfully");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        throw new Error(data.message || data.error || "Failed to save blog");
      }
    } catch (err: any) {
      console.error("[BlogWrite] Save error:", err);
      alert(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Move this blog to archive?")) return;
    try {
      const res = await fetch(`/api/moderator/blogs/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchBlogs();
      } else {
        alert(data.message || "Failed to archive blog");
      }
    } catch (err) {
      alert("Failed to archive blog");
    }
  };

  const renderBlogList = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
          <p className="text-slate-500">Loading your articles...</p>
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
          <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No Articles Here</h3>
          <p className="text-slate-500 mt-1">Start writing your next health insight.</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-6">
        {blogs.map((blog) => (
          <Card key={blog.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  blog.status === 'RETURNED' ? 'bg-red-50 text-red-600' : 
                  blog.status === 'REJECTED' ? 'bg-slate-900 text-white' :
                  blog.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                  'bg-slate-50 text-slate-500'
                }`}>
                  {blog.status}
                </span>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {new Date(blog.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <CardTitle className="text-lg font-bold group-hover:text-purple-600 transition-colors">{blog.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {blog.feedback && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-700">
                    <strong>Review Feedback:</strong> {blog.feedback}
                  </div>
                </div>
              )}
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                {blog.content.replace(/<[^>]*>/g, '')}
              </p>
              <div className="flex items-center justify-end gap-2">
                {(blog.status === 'DRAFT' || blog.status === 'RETURNED' || blog.status === 'REJECTED') && (
                  <Button variant="ghost" size="icon" onClick={() => setEditingBlog(blog)} className="h-9 w-9 text-slate-400 hover:text-purple-600">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {blog.status !== 'PUBLISHED' && (
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(blog.id)} className="h-9 w-9 text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {!editingBlog ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <PenTool className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900">Blog Writer</h1>
                <p className="text-slate-500">Draft and manage your health articles</p>
              </div>
            </div>
            <Button onClick={() => setEditingBlog({ title: '', content: '', status: 'DRAFT' })} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 h-11 shadow-lg">
              <Plus className="h-4 w-4 mr-2" /> Create New
            </Button>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-800">Your Articles</h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Manage your health content</p>
            </div>

            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-700">{successMessage}</p>
              </div>
            )}

            <div className="mt-6">
              {renderBlogList()}
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => setEditingBlog(null)} className="text-slate-500 hover:text-slate-900">
              Back to List
            </Button>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleSave(false)} 
                disabled={isSaving}
                className="rounded-xl px-6 border-slate-200"
              >
                <Save className="h-4 w-4 mr-2" /> Save Draft
              </Button>
              <Button 
                onClick={() => handleSave(true)} 
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 shadow-lg shadow-emerald-600/20"
              >
                <Send className="h-4 w-4 mr-2" /> Submit for Review
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              {editingBlog.feedback && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <h5 className="text-xs font-bold text-red-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <MessageCircle className="h-4 w-4" /> Feedback from Publisher
                  </h5>
                  <p className="text-sm text-red-600 italic leading-relaxed">{editingBlog.feedback}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Article Title</label>
                <input 
                  type="text" 
                  placeholder="Enter a compelling title..."
                  className="w-full text-2xl md:text-3xl font-serif font-bold text-slate-900 border-none outline-none placeholder:text-slate-200"
                  value={editingBlog.title}
                  onChange={e => setEditingBlog({...editingBlog, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Content Body</label>
                <textarea 
                  placeholder="Share your health insights here..."
                  className="w-full min-h-[400px] text-lg text-slate-600 border-none outline-none resize-none placeholder:text-slate-200 leading-relaxed"
                  value={editingBlog.content}
                  onChange={e => setEditingBlog({...editingBlog, content: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
