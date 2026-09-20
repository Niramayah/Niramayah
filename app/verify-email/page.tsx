"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, RefreshCw, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      router.push('/signup');
    }
  }, [searchParams, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      toast({ variant: "destructive", title: "Incomplete Code", description: "Please enter all 6 digits." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: fullOtp })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: "Account Verified",
        description: "Your account is now active. Redirecting to login...",
      });
      
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    setResending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP");

      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
      setTimer(60);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Resend Failed",
        description: err.message
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-md z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full group-hover:bg-emerald-500/20 transition-all duration-500"></div>
              <Image 
                src="/NIRAMAYAH_LOGO.png" 
                alt="NIRAMAYAH" 
                width={80} 
                height={80} 
                className="relative mx-auto rounded-full border-2 border-white shadow-2xl transition-transform group-hover:scale-110"
              />
            </div>
          </Link>
          <div className="space-y-2">
            <h2 className="text-4xl font-serif font-black text-slate-900 tracking-tight italic">Verify Identity</h2>
            <p className="text-slate-500 font-medium">
              Check your inbox at <span className="text-emerald-600 font-bold">{email}</span>
            </p>
          </div>
        </div>

        <Card className="border-0 bg-white shadow-xl shadow-slate-900/5 rounded-[3rem] overflow-hidden border border-slate-100">
          <CardHeader className="bg-gradient-to-br from-white to-slate-50 p-10 text-center border-b border-slate-100">
            <div className="h-20 w-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-100 relative">
              <div className="absolute inset-0 bg-emerald-500/10 blur-lg rounded-full animate-pulse"></div>
              <ShieldCheck className="h-10 w-10 text-emerald-600 relative" />
            </div>
            <CardTitle className="text-2xl font-serif text-slate-900 tracking-wide">Enter Secure Code</CardTitle>
            <CardDescription className="text-slate-500 mt-2">Enter the 6-digit OTP to activate your clinical profile.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="flex justify-between gap-3">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-full h-16 text-center text-2xl font-black bg-white border-2 border-slate-200 rounded-2xl text-slate-900 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/10 outline-none transition-all shadow-sm"
                    placeholder="•"
                  />
                ))}
              </div>

              <div className="space-y-6">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-16 bg-slate-950 hover:bg-slate-900 text-white rounded-[1.5rem] font-bold text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-6 w-6" />
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Activate Account</span>
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
                
                <div className="flex items-center justify-between px-2">
                  <button 
                    type="button"
                    onClick={handleResend}
                    disabled={resending || timer > 0}
                    className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${timer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'}`}
                  >
                    <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                    {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
                  </button>
                  <Link href="/signup" className="text-[10px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-[0.2em] flex items-center gap-1 transition-all">
                    <ArrowLeft className="h-3 w-3" />
                    Change Email
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] opacity-70">
          Precision Cardiac AI • Secure Verification
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
