"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { useModeratorPermissions } from "@/hooks/use-moderator-permissions";
import { 
  Shield, 
  Brain, 
  FileText, 
  Newspaper, 
  MessageSquare, 
  Activity, 
  LayoutDashboard,
  Settings,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Send,
  Database,
  HelpCircle,
  PenTool,
  FileCheck,
  Layout,
  History
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ModeratorDashboard() {
  const { user } = useAuth();
  const { hasPerm, loading, permissions } = useModeratorPermissions();
  const router = useRouter();

  // Removed automatic redirect to allow users to see the dashboard overview.

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const modules = [
    {
      title: "AI Test Lab",
      description: "Run diagnostic tests with unlimited staff credits",
      icon: <Brain className="h-5 w-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/moderator/ai-test",
      visible: hasPerm('aiTestAccess')
    },
    {
      title: "AI Training",
      description: "Upload datasets and train cardiac models",
      icon: <Database className="h-5 w-5" />,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      href: "/moderator/ai-training",
      visible: hasPerm('aiTrainingAccess')
    },
    {
      title: "AI Questions",
      description: "Configure diagnostic screening logic",
      icon: <HelpCircle className="h-5 w-5" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/moderator/ai-questions",
      visible: hasPerm('aiQuestionManage')
    },
    {
      title: "Blog Writer",
      description: "Draft and submit health articles for review",
      icon: <PenTool className="h-5 w-5" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/moderator/blogs/write",
      visible: hasPerm('blogWrite')
    },
    {
      title: "Blog Publisher",
      description: "Review, approve and publish health articles",
      icon: <FileCheck className="h-5 w-5" />,
      color: "text-emerald-700",
      bg: "bg-emerald-100",
      href: "/moderator/blogs/publish",
      visible: hasPerm('blogPublish')
    },
    {
      title: "Published Blogs",
      description: "Manage health articles that are live on the site",
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-emerald-800",
      bg: "bg-emerald-200",
      href: "/moderator/blogs/published",
      visible: hasPerm('blogPublish')
    },
    {
      title: "Blog Archive",
      description: "Restore or permanently delete archived health articles",
      icon: <History className="h-5 w-5" />,
      color: "text-slate-600",
      bg: "bg-slate-100",
      href: "/moderator/blogs/archive",
      visible: hasPerm('blogWrite') || hasPerm('blogPublish')
    },
    {
      title: "News Writer",
      description: "Draft and submit latest medical news",
      icon: <PenTool className="h-5 w-5" />,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/moderator/news/write",
      visible: hasPerm('newsWrite')
    },
    {
      title: "News Publisher",
      description: "Review and approve news submissions",
      icon: <FileCheck className="h-5 w-5" />,
      color: "text-orange-700",
      bg: "bg-orange-100",
      href: "/moderator/news/publish",
      visible: hasPerm('newsPublish')
    },
    {
      title: "Published News",
      description: "Manage medical news articles live on the site",
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-orange-800",
      bg: "bg-orange-200",
      href: "/moderator/news/published",
      visible: hasPerm('newsPublish')
    },
    {
      title: "News Archive",
      description: "Restore or permanently delete archived news articles",
      icon: <History className="h-5 w-5" />,
      color: "text-slate-600",
      bg: "bg-slate-100",
      href: "/moderator/news/archive",
      visible: hasPerm('newsWrite') || hasPerm('newsPublish')
    },
    {
      title: "Saved Reports",
      description: "Access and manage archived diagnostic summaries",
      icon: <FileText className="h-5 w-5" />,
      color: "text-blue-700",
      bg: "bg-blue-100",
      href: "/moderator/reports",
      visible: hasPerm('aiTestAccess')
    },
    {
      title: "Support Desk",
      description: "Handle user queries and ticket lifecycle",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "text-sky-600",
      bg: "bg-sky-50",
      href: "/moderator/tickets",
      visible: hasPerm('supportTicketHandle')
    },
    {
      title: "Site Content",
      description: "Manage global announcements and settings",
      icon: <Layout className="h-5 w-5" />,
      color: "text-rose-600",
      bg: "bg-rose-50",
      href: "/moderator/content",
      visible: hasPerm('contentManage')
    },
    {
      title: "Audit Logs",
      description: "Monitor module activity and history",
      icon: <Activity className="h-5 w-5" />,
      color: "text-slate-600",
      bg: "bg-slate-50",
      href: "/moderator/audit",
      visible: hasPerm('viewAuditLimited')
    }
  ];

  const visibleModules = modules.filter(m => m.visible);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="mb-10">
          <h2 className="text-3xl font-serif font-bold text-slate-900">Module Dashboard</h2>
          <p className="text-slate-500 mt-1 max-w-2xl">
            Welcome back, {user?.name}. You have access to {visibleModules.length} moderation {visibleModules.length === 1 ? 'module' : 'modules'} based on your current assignment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleModules.map((module, i) => (
            <Link key={i} href={module.href}>
              <Card className="hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border-0 shadow-sm overflow-hidden group h-full flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="p-6 flex-1">
                    <div className={`h-12 w-12 ${module.bg} ${module.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                      {module.icon}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">{module.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{module.description}</p>
                  </div>
                  <div className="px-6 py-4 bg-slate-50/50 border-t flex items-center justify-between mt-auto">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Module</span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {visibleModules.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="p-6 bg-slate-50 rounded-full mb-6">
                <Shield className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Access Restricted</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-3">
                Your account does not currently have any active module permissions. Please contact your system administrator to assign the necessary staff roles.
              </p>
              <Link href="/dashboard" className="mt-8 text-sm font-bold text-purple-600 hover:underline">
                Return to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
