"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, User, ChevronRight, Loader2, FileText, Calendar } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  publishedAt: string;
  category?: { name: string };
  author?: { name: string; profileImage: string | null };
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("/api/blogs", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setBlogs(data.blogs);
        }
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <main className="flex-1 w-full py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 mb-6 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full">
              Latest Health Insights
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
              Niramayah Wellness Blog
            </h1>
            <p className="text-lg text-slate-600">
              Expert articles, latest research, and lifestyle tips for a heart-healthy life.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
              <p className="text-slate-500 font-medium">Loading articles...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
              <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900">No blogs published yet</h3>
              <p className="text-slate-500 mt-2">Check back soon for our latest health insights.</p>
              <Button variant="outline" className="mt-8 border-slate-200" asChild>
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Link key={blog.id} href={`/blogs/${blog.slug}`}>
                  <Card className="h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white flex flex-col">
                    <div className="h-52 bg-slate-100 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent z-10" />
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 italic group-hover:scale-110 transition-transform duration-700">
                        <FileText className="h-12 w-12 opacity-20" />
                      </div>
                      {blog.category && (
                        <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-emerald-700 rounded-full uppercase tracking-widest shadow-sm">
                          {blog.category.name}
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="pb-3 flex-1">
                      <div className="flex items-center gap-3 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" /> 
                          {new Date(blog.publishedAt || "").toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight">
                        {blog.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed">
                        {blog.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {blog.author?.name?.charAt(0) || "A"}
                          </div>
                          <span className="text-xs font-bold text-slate-600">{blog.author?.name || "Niramayah Team"}</span>
                        </div>
                        <div className="text-emerald-600 flex items-center gap-1 text-xs font-bold group-hover:translate-x-1 transition-transform">
                          Read More <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
