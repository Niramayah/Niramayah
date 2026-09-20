"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Lock, Mail, User, AlertCircle, Loader2, Eye, EyeOff, Check, X, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Validation States
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpStatus, setOtpStatus] = useState<"idle" | "error" | "success">("idle");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  // Password Validation Checks
  const isLengthValid = password.length >= 8 && password.length <= 16;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = isLengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const doPasswordsMatch = password === confirmPassword && password.length > 0;

  // Auto-verify if email is a Super Admin bypass
  const isSuperAdmin = email.toLowerCase().endsWith("@niramayah.in");

  useEffect(() => {
    if (isSuperAdmin && email.length > 0) {
      setIsEmailVerified(true);
      setOtpStatus("success");
    } else if (isEmailVerified && !isSuperAdmin) {
      // If email changes after verification (and it's not super admin), reset verification
      setIsEmailVerified(false);
      setOtpStatus("idle");
      setShowOtpInput(false);
      setOtp(["", "", "", "", "", ""]);
    }
  }, [email]);

  const handleSendOtp = async () => {
    if (!email) return;
    setIsSendingOtp(true);
    setError(null);
    setOtpStatus("idle");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      toast({
        title: "OTP Sent",
        description: "A 6-digit verification code has been sent to your email.",
      });
      setShowOtpInput(true);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message);
      setOtpStatus("error");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Auto-submit OTP once 6 digits are typed
  useEffect(() => {
    const fullOtp = otp.join("");
    if (fullOtp.length === 6) {
      handleVerifyOtp(fullOtp);
    }
  }, [otp]);

  const handleVerifyOtp = async (code: string) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP code");

      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully.",
      });
      setIsEmailVerified(true);
      setOtpStatus("success");
    } catch (err: any) {
      setOtpStatus("error");
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.message || "Invalid OTP code",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailVerified && !isSuperAdmin) {
      setError("Please validate and verify your email address first.");
      return;
    }
    if (!isPasswordValid) {
      setError("Please meet all password strength criteria.");
      return;
    }
    if (!doPasswordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      // Auto login on success
      toast({
        title: "Registration Successful",
        description: "Welcome to NIRAMAYAH! Setting up your dashboard...",
      });

      // Retrieve user session or log in
      if (data.user) {
        login(data.user);
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-niramayah-gray hover:text-niramayah-navy mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <Card className="border-0 shadow-xl shadow-niramayah-navy/5">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-niramayah-green rounded-full flex items-center justify-center">
                <span className="font-serif font-bold text-white text-xl">N</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-serif text-niramayah-navy">Create an account</CardTitle>
            <CardDescription className="text-niramayah-gray">
              Join NIRAMAYAH to start your health journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-navy" htmlFor="name">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    id="name"
                    type="text" 
                    placeholder="John Doe" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green/20 focus:border-niramayah-green transition-all"
                  />
                </div>
              </div>

              {/* Email Address & Inline validation */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-navy" htmlFor="email">Email</label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      id="email"
                      type="email" 
                      placeholder="name@example.com" 
                      required
                      value={email}
                      disabled={isEmailVerified}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green/20 focus:border-niramayah-green transition-all disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  
                  {!isEmailVerified ? (
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || !email}
                      className={`h-11 px-4 font-bold rounded-lg transition-all ${
                        otpStatus === "error" 
                          ? "bg-red-600 text-white hover:bg-red-700" 
                          : "bg-slate-950 text-white hover:bg-slate-900"
                      }`}
                    >
                      {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled
                      className="h-11 px-4 font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      Verified
                    </Button>
                  )}
                  
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    {isEmailVerified ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-in zoom-in" />
                    ) : otpStatus === "error" ? (
                      <XCircle className="h-6 w-6 text-red-500 animate-in zoom-in" />
                    ) : (
                      <div className="w-6 h-6 border-2 border-dashed border-gray-300 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Slide-down OTP Entry Box */}
              {showOtpInput && !isEmailVerified && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/60 rounded-xl animate-in slide-in-from-top duration-300">
                  <p className="text-xs font-semibold text-slate-700">Enter Secure OTP Code</p>
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-10 h-10 text-center text-lg font-bold bg-white border border-gray-300 rounded-lg text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                        placeholder="•"
                      />
                    ))}
                  </div>
                  {otpStatus === "error" && (
                    <p className="text-[11px] text-red-600 font-medium">Incorrect code. Please try again.</p>
                  )}
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-navy" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    value={password}
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

                {/* Password Criteria Checklist UI */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1 text-[11px] p-3 bg-slate-50 border rounded-lg border-slate-100 animate-in fade-in duration-300">
                    <p className="font-semibold text-slate-500 mb-1.5">Password Strength Checklist:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-medium">
                      <span className={`flex items-center gap-1.5 ${isLengthValid ? "text-emerald-600" : "text-slate-400"}`}>
                        {isLengthValid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        8-16 characters
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasUppercase ? "text-emerald-600" : "text-slate-400"}`}>
                        {hasUppercase ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        1 Uppercase
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasLowercase ? "text-emerald-600" : "text-slate-400"}`}>
                        {hasLowercase ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        1 Lowercase
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-600" : "text-slate-400"}`}>
                        {hasNumber ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        1 Number
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasSpecial ? "text-emerald-600" : "text-slate-400"}`}>
                        {hasSpecial ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        1 Special character
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-navy" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green/20 focus:border-niramayah-green transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`text-[10px] font-bold mt-1 ${doPasswordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                    {doPasswordsMatch ? "Passwords match perfectly" : "Passwords do not match"}
                  </p>
                )}
              </div>

              <div className="text-xs text-niramayah-gray mt-4 text-center">
                By clicking sign up, you agree to our{" "}
                <Link href="/terms" className="text-niramayah-navy underline hover:text-niramayah-green">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-niramayah-navy underline hover:text-niramayah-green">Privacy Policy</Link>.
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-niramayah-green hover:bg-niramayah-green/90 text-white mt-6 rounded-xl font-bold transition-all active:scale-95" 
                disabled={isLoading || (!isEmailVerified && !isSuperAdmin) || !isPasswordValid || !doPasswordsMatch}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t py-6">
            <p className="text-sm text-niramayah-gray">
              Already have an account?{" "}
              <Link href="/login" className="text-niramayah-green font-medium hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
