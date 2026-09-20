"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle2, Edit2, Trash2, Loader2, 
  FileText, Clock, User, Eye, Search, AlertCircle, X, Save
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useModeratorPermissions } from "@/hooks/use-moderator-permissions";

interface Blog {
  id: string;
  title: string;
  content: string;
  status: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  category?: { name: string };
  author?: { name: string; email: string };
}

export default function PublishedBlogsPage() {
  const { hasPerm } = useModeratorPermissions();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit State
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPublished = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moderator/blogs?scope=published');
      const data = await res.json();
      if (res.ok && data.success) {
        setBlogs(data.blogs || []);
      } else {
        throw new Error(data.message || "Failed to fetch published blogs");
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
    if (!editingBlog) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/moderator/blogs/${editingBlog.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingBlog.title,
          content: editingBlog.content,
          action: 'UPDATE_PUBLISHED'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingBlog(null);
        fetchPublished();
      } else {
        alert(data.message || "Failed to update blog");
      }
    } catch (err) {
      alert("Error updating blog");
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Move this published blog to archive?")) return;
    try {
      const res = await fetch(`/api/moderator/blogs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPublished();
      } else {
        alert(data.message || "Failed to archive blog");
      }
    } catch (err) {
      alert("Error archiving blog");
    }
  };

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Published Blogs</h1>
            <p className="text-slate-500">Manage articles currently live on the platform</p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search published..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
          <p className="text-slate-500">Loading published articles...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No Published Articles</h3>
          <p className="text-slate-500 mt-1">Once articles are approved, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <Card key={blog.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-wider">
                    Live
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <Clock className="h-3 w-3" />
                    {new Date(blog.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <CardTitle className="text-lg font-bold line-clamp-2">{blog.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="h-3.5 w-3.5" />
                    <span>{blog.author?.name || 'Unknown Author'}</span>
                  </div>
                  {blog.category && (
                    <div className="inline-flex items-center px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-[10px] font-medium">
                      {blog.category.name}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-end gap-2 mt-auto pt-4 border-t border-slate-50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingBlog(blog)}
                    className="text-slate-400 hover:text-emerald-600 h-8"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleArchive(blog.id)}
                    className="text-slate-400 hover:text-red-500 h-8"
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
      {editingBlog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl shadow-2xl border-0 animate-in zoom-in-95 duration-300">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
              <div>
                <CardTitle className="text-xl">Edit Published Article</CardTitle>
                <CardDescription>Changes will be reflected live immediately</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingBlog(null)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Title</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={editingBlog.title}
                  onChange={e => setEditingBlog({...editingBlog, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Content Body</label>
                <textarea 
                  className="w-full h-64 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none leading-relaxed"
                  value={editingBlog.content}
                  onChange={e => setEditingBlog({...editingBlog, content: e.target.value})}
                />
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setEditingBlog(null)}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                  onClick={handleUpdate}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
