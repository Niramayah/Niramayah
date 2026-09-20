"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, User, ChevronRight, Loader2, Newspaper, Calendar } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface News {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  publishedAt: string;
  author?: { name: string; profileImage: string | null };
}

export default function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setNewsList(data.news || []);
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <main className="flex-1 w-full py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center px-4 py-1.5 mb-6 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-100 rounded-full uppercase tracking-widest">
              Latest Medical News
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6">
              Niramayah Newsroom
            </h1>
            <p className="text-lg text-slate-600">
              Breaking updates, research announcements, and the latest from the world of digital cardiac health.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600 mb-4" />
              <p className="text-slate-500 font-medium">Fetching latest news...</p>
            </div>
          ) : newsList.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
              <Newspaper className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900">No news available</h3>
              <p className="text-slate-500 mt-2">We haven't published any news updates yet. Please check back later.</p>
              <Button variant="outline" className="mt-8 border-slate-200" asChild>
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newsList.map((news) => (
                <Link key={news.id} href={`/news/${news.slug}`}>
                  <Card className="h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white flex flex-col">
                    <div className="h-48 bg-orange-50/50 relative overflow-hidden flex items-center justify-center">
                      <Newspaper className="h-16 w-16 text-orange-200 group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 right-4 z-20 px-2.5 py-0.5 bg-white/90 backdrop-blur-sm text-[9px] font-bold text-orange-600 rounded-full uppercase tracking-widest shadow-sm">
                        Breaking
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3 flex-1">
                      <div className="flex items-center gap-3 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-orange-500" /> 
                          {new Date(news.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
                        {news.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed">
                        {news.excerpt || news.content.substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {news.author?.name?.charAt(0) || "N"}
                          </div>
                          <span className="text-xs font-bold text-slate-600">{news.author?.name || "Niramayah News"}</span>
                        </div>
                        <div className="text-orange-600 flex items-center gap-1 text-xs font-bold group-hover:translate-x-1 transition-transform">
                          Read Full Story <ChevronRight className="h-3.5 w-3.5" />
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
