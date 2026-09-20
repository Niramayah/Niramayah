"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Newspaper, ChevronRight, Calendar } from "lucide-react";

interface News {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  publishedAt: string;
}

export function NewsPreview() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/news?limit=3", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setNewsList(data.news || []);
        }
      } catch (error) {
        console.error("Failed to fetch latest news:", error);
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
          <div key={i} className="h-[350px] bg-slate-50 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (newsList.length === 0) {
    return (
      <div className="py-12 px-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 mb-12">
        <Newspaper className="h-10 w-10 text-slate-200 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No news updates available at this time.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8 mb-12 text-left">
      {newsList.map((news) => (
        <Link key={news.id} href={`/news/${news.slug}`} className="group">
          <Card className="h-full hover:shadow-xl transition-all duration-300 overflow-hidden border-slate-100 flex flex-col bg-white">
            <div className="h-40 bg-orange-50 flex items-center justify-center relative overflow-hidden">
               <Newspaper className="h-10 w-10 text-orange-200 group-hover:scale-110 transition-transform duration-500" />
               <div className="absolute top-4 left-4 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-[9px] font-bold text-orange-600 rounded-full uppercase tracking-widest shadow-sm">
                 News
               </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                <Calendar className="h-3 w-3 text-orange-500" />
                {new Date(news.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <CardTitle className="text-lg font-bold group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
                {news.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                {news.excerpt || news.content.substring(0, 100)}...
              </p>
              <div className="mt-auto pt-4 flex items-center text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform uppercase tracking-tighter">
                View Report <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
