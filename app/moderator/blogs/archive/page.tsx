"use client";

import { useState, useEffect } from "react";
import { 
  History, RotateCcw, Trash2, Loader2, FileText, 
  Clock, Calendar, User, Eye, Search, AlertCircle, X, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useModeratorPermissions } from "@/hooks/use-moderator-permissions";
import { useAuth } from "@/components/auth/AuthContext";

interface Blog {
  id: string;
  title: string;
  content: string;
  status: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  category?: { name: string };
  author?: { name: string; email: string };
}

export default function BlogArchivePage() {
  const { user: currentUser } = useAuth();
  const { hasPerm } = useModeratorPermissions();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchArchive = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moderator/blogs?scope=archive');
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs(data.blogs || []);
      } else {
        throw new Error(data.message || "Failed to fetch archive");
      }
    } catch (err: any) {
      console.error("Archive fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  const handleRestore = async (blogId: string) => {
    if (!confirm("Restore this blog to draft/review status?")) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/moderator/blogs/${blogId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' })
      });
      const data = await res.json();
      if (data.success) {
        alert("Blog restored successfully.");
        fetchArchive();
      } else {
        throw new Error(data.message || "Failed to restore blog");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteConfirmId) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/moderator/blogs/${deleteConfirmId}/permanent`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert("Blog permanently deleted");
        setDeleteConfirmId(null);
        fetchArchive();
      } else {
        throw new Error(data.message || "Failed to delete blog");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Blog Archive</h1>
            <p className="text-slate-500">Restore or permanently delete archived health articles</p>
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
          <p className="text-slate-500">Loading archived articles...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="h-16 w-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Archive is Empty</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            {searchQuery ? "No archived blogs match your search." : "Deleted articles will appear here for 30 days before permanent removal."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBlogs.map((blog) => {
             // Permission check for delete button
             const isAuthor = blog.authorId === currentUser?.id;
             const canPublish = hasPerm('blogPublish');
             const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
             const showDelete = isAdmin || canPublish || isAuthor;

             return (
              <Card key={blog.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded-full uppercase tracking-wider">
                          Archived
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <Clock className="h-3 w-3" />
                          Deleted {blog.deletedAt ? new Date(blog.deletedAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{blog.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          <span>Author: {blog.author?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Created: {new Date(blog.createdAt).toLocaleDateString()}</span>
                        </div>
                        {blog.category && (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                            <span>{blog.category.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="px-6 py-4 md:py-0 md:px-8 bg-slate-50/50 flex flex-row md:flex-row items-center justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 min-w-[300px]">
                      <Button 
                        onClick={() => handleRestore(blog.id)}
                        disabled={isProcessing}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 shadow-sm transition-all"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" /> Restore
                      </Button>
                      {showDelete && (
                        <Button 
                          onClick={() => setDeleteConfirmId(blog.id)}
                          disabled={isProcessing}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 shadow-sm transition-all"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
             );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-0 shadow-2xl scale-in-center overflow-hidden bg-white">
            <div className="p-6 text-center">
              <div className="h-16 w-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Blog Permanently?</h2>
              <p className="text-slate-500 text-sm mb-6">
                This action cannot be undone. The blog will be permanently removed from the system.
              </p>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 rounded-xl h-12"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePermanentDelete}
                  disabled={isProcessing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 shadow-lg shadow-red-600/20"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {blogs.length > 0 && (
        <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-bold mb-1">Permanent Deletion Policy</p>
            <p className="opacity-80">Articles deleted from the archive are removed permanently from the database. Writers can delete their own articles, while Publishers and Administrators can manage all archived content.</p>
          </div>
        </div>
      )}
    </div>
  );
}
