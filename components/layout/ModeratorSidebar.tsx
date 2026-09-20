"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Brain, 
  Database, 
  HelpCircle, 
  PenTool, 
  FileCheck, 
  Newspaper, 
  Send,
  MessageSquare, 
  Layout, 
  Activity,
  LogOut,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthContext";
import { useModeratorPermissions } from "@/hooks/use-moderator-permissions";

export function ModeratorSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasPerm, loading } = useModeratorPermissions();

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/moderator", visible: true },
    { name: "AI Test Lab", icon: Brain, href: "/moderator/ai-test", visible: hasPerm('aiTestAccess') },
    { name: "AI Training", icon: Database, href: "/moderator/ai-training", visible: hasPerm('aiTrainingAccess') },
    { name: "AI Questions", icon: HelpCircle, href: "/moderator/ai-questions", visible: hasPerm('aiQuestionManage') },
    { name: "Blog Writer", icon: PenTool, href: "/moderator/blogs/write", visible: hasPerm('blogWrite') },
    { name: "Blog Publisher", icon: FileCheck, href: "/moderator/blogs/publish", visible: hasPerm('blogPublish') },
    { name: "Published Blogs", icon: CheckCircle2, href: "/moderator/blogs/published", visible: hasPerm('blogPublish') },
    { name: "Blog Archive", icon: Activity, href: "/moderator/blogs/archive", visible: hasPerm('blogWrite') || hasPerm('blogPublish') },
    { name: "News Writer", icon: PenTool, href: "/moderator/news/write", visible: hasPerm('newsWrite') },
    { name: "News Publisher", icon: FileCheck, href: "/moderator/news/publish", visible: hasPerm('newsPublish') },
    { name: "Published News", icon: CheckCircle2, href: "/moderator/news/published", visible: hasPerm('newsPublish') },
    { name: "News Archive", icon: Activity, href: "/moderator/news/archive", visible: hasPerm('newsWrite') || hasPerm('newsPublish') },
    { name: "Support Desk", icon: MessageSquare, href: "/moderator/tickets", visible: hasPerm('supportTicketHandle') },
    { name: "Saved Reports", icon: FileCheck, href: "/moderator/reports", visible: hasPerm('aiTestAccess') },
    { name: "Site Content", icon: Layout, href: "/moderator/content", visible: hasPerm('contentManage') },
    { name: "Audit Logs", icon: Activity, href: "/moderator/audit", visible: hasPerm('viewAuditLimited') },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-full border-r border-slate-800">
      <div className="h-20 flex items-center px-6 border-b border-white/10 bg-slate-950">
        <Link href="/moderator" className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/50">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-white uppercase">
            Staff Panel
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-4">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-3">
          Management Tools
        </div>
        {!loading && menuItems.filter(item => item.visible).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-4 w-4 transition-transform", isActive && "scale-110")} />
              {item.name}
            </Link>
          );
        })}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-slate-950/50">
        <div className="mb-4 px-3 py-3 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-300">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white truncate">{user?.name}</p>
              <p className="text-[8px] text-slate-500 uppercase tracking-tighter">{user?.role}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            document.cookie = "niramayah_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Logout System
        </button>
      </div>
    </aside>
  );
}
