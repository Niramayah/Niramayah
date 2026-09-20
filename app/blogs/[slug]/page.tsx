"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, User, Calendar, Share2, Facebook, Twitter, Link as LinkIcon, Loader2, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`/api/blogs/${slug}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setBlog(data.blog);
        }
      } catch (error) {
        console.error("Failed to fetch blog:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
          <p className="text-slate-500 font-medium">Loading article...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">Article Not Found</h1>
          <p className="text-slate-600 mb-8 max-w-md">The blog post you are looking for might have been moved or removed.</p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/blogs">Back to Blog List</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 w-full">
        {/* Progress Bar */}
        <div className="fixed top-20 left-0 w-full h-1 bg-slate-100 z-50">
          <div className="h-full bg-emerald-500 w-1/3" />
        </div>

        {/* Hero Section */}
        <section className="bg-slate-50 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <Link href="/blogs" className="inline-flex items-center text-sm font-bold text-emerald-600 hover:text-emerald-700 mb-8 group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Blog
            </Link>

            <div className="max-w-4xl mx-auto">
              {blog.category && (
                <div className="inline-flex items-center px-4 py-1.5 mb-6 text-sm font-bold text-emerald-600 bg-emerald-100/50 rounded-full uppercase tracking-widest">
                  {blog.category.name}
                </div>
              )}
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-8 leading-tight">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-slate-500 border-y border-slate-200 py-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                    {blog.author?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Written By</p>
                    <p className="text-sm font-bold text-slate-900">{blog.author?.name || "Niramayah Team"}</p>
                  </div>
                </div>
                
                <div className="h-10 w-px bg-slate-200 hidden md:block" />

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Published On</p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex-1 flex justify-end gap-2">
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900 prose-img:rounded-3xl">
                <div className="whitespace-pre-wrap">
                  {blog.content}
                </div>
              </div>

              {/* Author Bio Mini */}
              <div className="mt-20 p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                <div className="h-20 w-20 rounded-full bg-slate-200 shrink-0 border-4 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-slate-400">
                   {blog.author?.name?.charAt(0) || "A"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">About the Author</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {blog.author?.name || "Niramayah Editorial Team"} is dedicated to bringing you the most accurate and up-to-date information regarding cardiac health, AI diagnostic advancements, and wellness strategies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
