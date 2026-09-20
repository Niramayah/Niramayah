"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Activity, CreditCard, BookOpen, Info, Bell, Coins, CheckCircle, AlertTriangle, Info as InfoIcon, Download, Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthContext';

export function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { user, logout, masterLogoUrl } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasCookie = typeof document !== 'undefined' && document.cookie.split(';').some((item) => item.trim().startsWith('niramayah_logged_in='));
    const hasLS = typeof window !== 'undefined' && localStorage.getItem('niramayah_logged_in') === 'true';
    setHasToken(hasCookie || hasLS);
  }, [user]);

  const isLoggedIn = mounted && hasToken && !!user;
  const credits = user?.credits || 0;

  const pathname = usePathname();
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial data loading for notifications
    if (typeof window !== 'undefined') {
      const storedNotifications = localStorage.getItem('niramayah_notifications');
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        // Initial welcome notifications
        const initialNotifications = [
          {
            id: '1',
            message: 'Welcome to NIRAMAYAH! Let’s get started.',
            type: 'info',
            createdAt: new Date().toISOString(),
            read: false
          },
          {
            id: '2',
            message: 'Reminder: AI reports are for screening only.',
            type: 'warning',
            createdAt: new Date().toISOString(),
            read: false
          }
        ];
        setNotifications(initialNotifications);
        localStorage.setItem('niramayah_notifications', JSON.stringify(initialNotifications));
      }
    }

    // Listen for custom events to update notifications
    const handleUpdate = () => {
      const storedNotifications = localStorage.getItem('niramayah_notifications');
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
    };

    window.addEventListener('notificationsUpdated', handleUpdate);
    
    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('notificationsUpdated', handleUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle Navbar visibility on scroll
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsVisible(false);
          setShowNotifications(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  const scrollToSection = (sectionId: string) => {
    if (pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(`/#${sectionId}`);
    }
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('niramayah_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('notificationsUpdated'));
  };

  const toggleNotifications = () => {
    if (!showNotifications) {
      markAllAsRead();
    }
    setShowNotifications(!showNotifications);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navLinks = [
    { name: 'Home', id: 'home', icon: Home },
    { name: 'Technology', id: 'technology', icon: Activity },
    { name: 'Pricing', id: 'pricing', icon: CreditCard },
    { name: 'Blogs', href: '/blogs', icon: BookOpen },
    { name: 'About', id: 'about', icon: Info },
  ];


  return (
    <nav 
      className={`fixed top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto flex flex-col md:flex-row md:h-20 items-center justify-between px-4 md:px-6 py-4 md:py-0">
        {/* LOGO */}
        <div className="flex items-center justify-between w-full md:w-auto mb-4 md:mb-0">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src={masterLogoUrl} 
              alt="NIRAMAYAH Logo" 
              width={40} 
              height={40} 
              className="rounded-full shadow-sm aspect-square object-cover"
            />
            <span className="font-serif text-lg md:text-2xl font-bold tracking-tight text-niramayah-navy">
              NIRAMAYAH
            </span>
          </Link>
        </div>

        {/* MAIN NAV */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:gap-8 items-center font-medium text-xs md:text-sm text-niramayah-navy mb-4 md:mb-0">
          {navLinks.map((link) => (
            link.id ? (
              <button 
                key={link.name}
                onClick={() => scrollToSection(link.id!)}
                className="hover:text-niramayah-green transition-colors"
              >
                {link.name}
              </button>
            ) : (
              <Link 
                key={link.name}
                href={link.href!} 
                className="hover:text-niramayah-green transition-colors"
              >
                {link.name}
              </Link>
            )
          ))}
          <Link 
            href={isLoggedIn ? "/dashboard/ai-test" : "/signup"} 
            className="text-niramayah-green font-bold hover:scale-105 transition-transform"
          >
            AI Diagnosis
          </Link>
        </div>

        {/* ACTIONS & NOTIFICATIONS */}
        <div className="flex items-center space-x-3">
          {/* Credit Badge */}
          {isLoggedIn && (
            <div className="flex items-center bg-niramayah-navy/5 px-3 py-1.5 rounded-full border border-niramayah-navy/10 text-niramayah-navy font-bold text-xs mr-2">
              <Coins className="h-3.5 w-3.5 mr-1.5 text-niramayah-orange" />
              {user?.isUnlimitedCredits || 
               user?.role === 'ADMIN' || 
               user?.role === 'SUPER_ADMIN' || 
               (user?.role === 'MODERATOR' && user?.permissions?.some(p => p.permissionKey === 'aiTestAccess'))
                ? '∞' 
                : user?.credits || 0
              } Credits
            </div>
          )}

          {/* Notification Bell */}
          {isLoggedIn && (
            <div className="relative" ref={notificationRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-niramayah-navy hover:bg-niramayah-navy/5"
                onClick={toggleNotifications}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </Button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="bg-niramayah-navy p-4 text-white flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">NIRAMAYAH AI</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-4 border-b hover:bg-gray-50 transition-colors ${!n.read ? 'bg-niramayah-navy/5' : ''}`}>
                          <div className="flex gap-3">
                            <div className="mt-0.5">
                              {n.type === 'success' && <CheckCircle className="h-4 w-4 text-niramayah-green" />}
                              {n.type === 'warning' && <AlertTriangle className="h-4 w-4 text-niramayah-orange" />}
                              {n.type === 'info' && <InfoIcon className="h-4 w-4 text-blue-500" />}
                              {n.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-niramayah-navy leading-relaxed">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 text-center border-t">
                    <Link href="/dashboard" className="text-[11px] font-bold text-niramayah-navy hover:text-niramayah-green uppercase tracking-widest">
                      View All Activity
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoggedIn ? (
            <>
              <Button variant="ghost" size="sm" className="text-niramayah-navy hover:text-niramayah-green h-9" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" className="bg-niramayah-green hover:bg-niramayah-green/90 text-white h-9 px-4" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-niramayah-green text-niramayah-green h-9" asChild>
                <Link href={user?.role === 'ADMIN' ? '/admin' : '/dashboard'}>Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-red-600">
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
