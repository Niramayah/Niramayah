"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  credits: number;
  isUnlimitedCredits: boolean;
  profileImage?: string | null;
  permissions?: { permissionKey: string }[];
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  masterLogoUrl: string;
  login: (user: User) => void;
  logout: () => void;
  updateCredits: (newCredits: number) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  masterLogoUrl: '/NIRAMAYAH_LOGO.png',
  login: () => {},
  logout: () => {},
  updateCredits: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [masterLogoUrl, setMasterLogoUrl] = useState('/NIRAMAYAH_LOGO.png');
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('niramayah_logged_in', 'true');
        }
        if (data.masterLogoUrl) setMasterLogoUrl(data.masterLogoUrl);
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('niramayah_logged_in');
        }
      }
    } catch (error) {

      console.error('Failed to check auth:', error);
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('niramayah_logged_in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const refreshUser = async () => {
    await checkAuth();
  };

  const login = (newUser: User) => {
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('niramayah_logged_in', 'true');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('niramayah_logged_in');
    }
    router.push('/login');
  };

  const updateCredits = (newCredits: number) => {
    if (user) {
      setUser({ ...user, credits: newCredits });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, masterLogoUrl, login, logout, updateCredits, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
