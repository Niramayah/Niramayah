"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ActivitySquare, 
  History, 
  CreditCard, 
  LifeBuoy, 
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Start AI Test", icon: ActivitySquare, href: "/dashboard/ai-test" },
  { name: "Test History", icon: History, href: "/dashboard/history" },
  { name: "Subscription", icon: CreditCard, href: "/dashboard/subscription" },
  { name: "Support Tickets", icon: LifeBuoy, href: "/dashboard/support" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-niramayah-navy text-white h-full border-r border-niramayah-navy/20">
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <Image 
            src="/NIRAMAYAH_LOGO.png" 
            alt="NIRAMAYAH Logo" 
            width={32} 
            height={32} 
            className="rounded-full bg-white"
          />
          <span className="font-serif text-lg font-bold tracking-tight">
            NIRAMAYAH
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
          Menu
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
                  ? "bg-niramayah-green text-white" 
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
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
          Log out
        </button>
      </div>
    </aside>
  );
}
