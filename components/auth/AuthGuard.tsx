"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      router.push('/admin');
    } else if (!isLoading && user && user.role === 'MODERATOR') {
      router.push('/moderator');
    }
  }, [user, isLoading, router]);

  // Show nothing while checking to avoid hydration mismatch and flash of protected content
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-niramayah-navy rounded-full mb-4"></div>
          <p className="text-sm font-medium text-niramayah-gray">Loading NIRAMAYAH...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
