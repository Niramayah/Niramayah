"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Lock, Mail, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Rate Limiting / Lockout State
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  const router = useRouter();
  const { login } = useAuth();

  // Lockout Countdown Timer
  useEffect(() => {
    if (!lockoutTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        setLockoutTime(null);
        setError(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime && secondsLeft > 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 429) {
        const until = data.lockoutUntil || (Date.now() + 30 * 1000);
        setLockoutTime(until);
        setSecondsLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
        throw new Error(data.error || "Too many failed attempts. Temporarily locked.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to login");
      }

      login(data.user);

      if (['ADMIN', 'SUPER_ADMIN'].includes(data.user.role)) {
        router.push("/admin");
      } else if (data.user.role === 'MODERATOR') {
        router.push("/moderator");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-niramayah-gray hover:text-niramayah-navy mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <Card className="border-0 shadow-xl shadow-niramayah-navy/5">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-niramayah-navy rounded-full flex items-center justify-center">
                <span className="font-serif font-bold text-white text-xl">N</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-serif text-niramayah-navy">Welcome back</CardTitle>
            <CardDescription className="text-niramayah-gray">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-navy" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    id="email"
                    type="email" 
                    placeholder="name@example.com" 
                    required
                    value={email}
                    disabled={isLoading || (lockoutTime !== null && secondsLeft > 0)}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green/20 focus:border-niramayah-green transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-niramayah-navy" htmlFor="password">Password</label>
                  <Link href="/forgot-password" className="text-xs text-niramayah-green hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    disabled={isLoading || (lockoutTime !== null && secondsLeft > 0)}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green/20 focus:border-niramayah-green transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 bg-niramayah-navy hover:bg-niramayah-navy/90 text-white mt-6 transition-all" 
                disabled={isLoading || (lockoutTime !== null && secondsLeft > 0)}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Logging in...</span>
                  </div>
                ) : lockoutTime !== null && secondsLeft > 0 ? (
                  `Locked out (${secondsLeft}s)`
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-6">
            <p className="text-sm text-niramayah-gray">
              Don't have an account?{" "}
              <Link href="/signup" className="text-niramayah-green font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
