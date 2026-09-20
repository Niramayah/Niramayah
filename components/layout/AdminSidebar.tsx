"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  User,
  BrainCircuit, 
  FileText, 
  LifeBuoy, 
  Settings,
  LogOut,
  CreditCard,
  ShieldAlert,
  PlayCircle,
  FileCheck,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthContext";

const menuItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/admin" },
  { name: "Users & Roles", icon: Users, href: "/admin/users" },
  { name: "AI Management", icon: BrainCircuit, href: "/admin/ai" },
  { name: "AI Test View", icon: PlayCircle, href: "/admin/ai-test-view" },
  { name: "Saved Reports", icon: FileCheck, href: "/admin/reports" },
  { name: "Content (Blogs/News)", icon: FileText, href: "/admin/blogs" },
  { name: "Support Tokens", icon: LifeBuoy, href: "/admin/support" },
  { name: "Billing & Plans", icon: CreditCard, href: "/admin/billing" },
  { name: "Audit Logs", icon: ShieldAlert, href: "/admin/audit" },
  { name: "Site Settings", icon: Settings, href: "/admin/settings" },
  { name: "About Manager", icon: Info, href: "/admin/about" },
  { name: "My Profile", icon: User, href: "/admin/profile" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-full border-r border-slate-800">
      <div className="h-20 flex items-center px-6 border-b border-white/10 bg-slate-950">
        <Link href="/admin" className="flex items-center space-x-3">
          <Image 
            src="/NIRAMAYAH_LOGO.png" 
            alt="NIRAMAYAH Logo" 
            width={32} 
            height={32} 
            className="rounded-full bg-white"
          />
          <span className="font-serif text-lg font-bold tracking-tight text-red-400">
            ADMIN PANEL
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
          Management
        </div>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-red-500 text-white" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={() => {
            document.cookie = "niramayah_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Exit Admin
        </button>
      </div>
    </aside>
  );
}
