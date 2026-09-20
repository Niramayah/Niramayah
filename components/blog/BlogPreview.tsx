"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ChevronRight, Calendar } from "lucide-react";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  publishedAt: string;
  category?: { name: string };
}

export function BlogPreview() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/blogs?limit=3", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setBlogs(data.blogs);
        }
      } catch (error) {
        console.error("Failed to fetch latest blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[400px] bg-slate-50 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="py-12 px-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 mb-12">
        <FileText className="h-10 w-10 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No health insights published yet. Stay tuned!</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 mb-12 text-left">
      {blogs.map((blog) => (
        <Link key={blog.id} href={`/blogs/${blog.slug}`} className="group">
          <Card className="h-full hover:shadow-xl transition-all duration-300 overflow-hidden border-slate-100 flex flex-col">
            <div className="h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center">
               <FileText className="h-12 w-12 text-slate-200 group-hover:scale-110 transition-transform duration-500" />
               {blog.category && (
                 <div className="absolute top-4 left-4 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-[9px] font-bold text-niramayah-green rounded-full uppercase tracking-widest shadow-sm">
                   {blog.category.name}
                 </div>
               )}
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                <Calendar className="h-3 w-3" />
                {new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <CardTitle className="text-lg font-bold group-hover:text-niramayah-green transition-colors line-clamp-2 leading-tight">
                {blog.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-niramayah-gray line-clamp-3 leading-relaxed mb-4">
                {blog.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
              </p>
              <div className="mt-auto pt-4 flex items-center text-xs font-bold text-niramayah-green group-hover:translate-x-1 transition-transform">
                Read Full Insight <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
