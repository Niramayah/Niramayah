"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Menu, Search, User as UserIcon, LogOut, CreditCard, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { usePathname } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

import Image from "next/image";

export function DashboardTopBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide search on multi-step forms and focused pages
  const hideSearchRoutes = [
    '/dashboard/ai-test',
    '/dashboard/onboarding',
    '/admin/ai-test-view'
  ];
  const showSearch = !hideSearchRoutes.some(route => pathname?.startsWith(route));

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isModerator = user?.role === 'MODERATOR';
  const profileHref = isAdmin ? "/admin/profile" : (isModerator ? "/moderator" : "/dashboard/profile");

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Listen for custom events to refresh notifications (e.g. after AI diagnosis)
      window.addEventListener('refreshNotifications', fetchNotifications);
      return () => window.removeEventListener('refreshNotifications', fetchNotifications);
    }
  }, [user]);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CREDIT_DEBIT': return <CreditCard className="h-4 w-4 text-orange-500" />;
      case 'SUCCESS': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <header className="h-20 border-b border-border/40 bg-white flex items-center justify-between px-4 md:px-8 shrink-0 relative z-50">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden text-niramayah-navy">
          <Menu className="h-6 w-6" />
        </Button>
        {showSearch && (
          <div className="hidden md:flex relative w-64 lg:w-96 animate-in fade-in duration-300">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-niramayah-green/20 focus:border-niramayah-green transition-all text-sm"
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3 relative">
        <div className="hidden sm:flex items-center gap-3 mr-2 px-3 py-1.5 rounded-full bg-niramayah-orange/5 border border-niramayah-orange/10 text-niramayah-navy text-sm font-bold shadow-sm">
          <CoinIcon />
          <span>
            {user?.isUnlimitedCredits || 
             user?.role === 'ADMIN' || 
             user?.role === 'SUPER_ADMIN' || 
             (user?.role === 'MODERATOR' && user?.permissions?.some(p => p.permissionKey === 'aiTestAccess'))
              ? '∞' 
              : user?.credits || 0
            } Credits
          </span>
        </div>
        
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-500 hover:text-niramayah-navy relative"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <span className="font-semibold text-sm text-niramayah-navy">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-niramayah-green hover:underline font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm italic">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((note) => (
                    <div 
                      key={note.id} 
                      className={`p-4 border-b transition-colors cursor-pointer flex gap-3 ${note.isRead ? 'opacity-70 bg-white' : 'bg-blue-50/30 hover:bg-blue-50/50'}`}
                      onClick={() => !note.isRead && markAsRead(note.id)}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getNotificationIcon(note.type)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm leading-tight mb-1 ${note.isRead ? 'text-gray-600' : 'text-niramayah-navy font-semibold'}`}>
                          {note.title}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-1">{note.message}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                          {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!note.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t bg-gray-50 text-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Latest activity</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>
        
        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <Button 
            variant="ghost" 
            className="pl-2 pr-4 py-1.5 h-auto flex items-center gap-3 rounded-full hover:bg-gray-100"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
          >
            <div className="h-8 w-8 rounded-full bg-niramayah-navy text-white flex items-center justify-center uppercase overflow-hidden relative">
              {user?.profileImage ? (
                <Image src={user.profileImage} alt={user.name} fill className="object-cover" />
              ) : (
                user?.name?.[0] || <UserIcon className="h-4 w-4" />
              )}
            </div>
            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-sm font-semibold text-niramayah-navy leading-none mb-1 capitalize">{user?.name || 'User'}</span>
              <span className="text-xs text-gray-500 leading-none">
                {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                 user?.role === 'ADMIN' ? 'Admin' : 
                 user?.role === 'MODERATOR' ? 'Moderator' : 'Free Plan'}
              </span>
            </div>
          </Button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-niramayah-navy">My Account</p>
                <p className="text-xs text-niramayah-gray truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <Link href={profileHref} className="flex items-center px-3 py-2 text-sm text-niramayah-gray hover:bg-gray-50 hover:text-niramayah-navy rounded-md">
                    <UserIcon className="h-4 w-4 mr-2" /> Profile
                  </Link>
                )}
                <button 
                  onClick={logout}
                  className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
