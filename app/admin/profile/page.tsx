"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Shield, 
  Camera, 
  Save, 
  Lock, 
  CheckCircle2, 
  Plus, 
  X,
  UserCheck,
  TrendingUp,
  LayoutGrid,
  ShieldCheck,
  ChevronRight,
  UserPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface CoreMember {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  coreRoleTitle: string | null;
  role: string;
  isCoreMember?: boolean;
}

export default function AdminProfilePage() {
  const { user, refreshUser, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        router.push(user.role === 'MODERATOR' ? '/moderator' : '/dashboard');
      }
    }
  }, [user, isLoading, router]);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const roleTitle = user?.role === 'SUPER_ADMIN' ? 'Chief Administrator' : 
                    user?.role === 'ADMIN' ? 'Site Administrator' : 'Staff Moderator';
  
  const [coreMembers, setCoreMembers] = useState<CoreMember[]>([]);
  const [showCoreModal, setShowCoreModal] = useState(false);
  const [allAdmins, setAllAdmins] = useState<CoreMember[]>([]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
    fetchCoreMembers();
    if (user?.role === 'SUPER_ADMIN') {
      fetchAllAdmins();
    }
  }, [user]);

  const fetchCoreMembers = async () => {
    try {
      const res = await fetch('/api/admin/users/core');
      const data = await res.json();
      if (res.ok) setCoreMembers(data.coreMembers || []);
    } catch (err) {
      console.error("Failed to fetch core members");
    }
  };

  const fetchAllAdmins = async () => {
    try {
      const res = await fetch('/api/admin/users?role=ADMIN,SUPER_ADMIN,MODERATOR');
      const data = await res.json();
      if (res.ok) setAllAdmins(data.users || []);
    } catch (err) {
      console.error("Failed to fetch admins");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      refreshUser();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const isLengthValid = passData.newPassword.length >= 8 && passData.newPassword.length <= 16;
  const hasUppercase = /[A-Z]/.test(passData.newPassword);
  const hasLowercase = /[a-z]/.test(passData.newPassword);
  const hasNumber = /\d/.test(passData.newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(passData.newPassword);
  const isPasswordValid = isLengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
      return;
    }
    if (!isPasswordValid) {
      toast({ variant: "destructive", title: "Error", description: "Password does not meet the strength criteria." });
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch('/api/admin/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast({ title: "Success", description: "Password updated successfully" });
      setShowPassModal(false);
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setPassLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast({
        title: "Success",
        description: "Profile image updated",
      });
      refreshUser();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleCoreMember = async (userId: string, isCore: boolean, title?: string) => {
    try {
      const res = await fetch('/api/admin/users/core', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isCoreMember: isCore,
          coreRoleTitle: title
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast({
        title: "Success",
        description: isCore ? "Member added to 4 Pillars" : "Member removed from 4 Pillars",
      });
      fetchCoreMembers();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-32">
      {/* NEW IMPROVED Profile Header */}
      <section className="relative bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Banner */}
        <div className="h-56 w-full bg-gradient-to-br from-slate-900 via-slate-800 to-niramayah-navy relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>

        {/* Header Content Wrapper */}
        <div className="px-8 pb-10 relative">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar - Shifted Up but handled with margin to avoid messy overlap */}
            <div className="relative -mt-20 shrink-0">
              <div className="h-40 w-40 rounded-full border-[6px] border-white bg-white shadow-2xl overflow-hidden group relative">
                {user.profileImage ? (
                  <Image 
                    src={user.profileImage} 
                    alt={user.name} 
                    fill 
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-50 text-slate-300 text-5xl font-serif font-bold italic">
                    {user.name.charAt(0)}
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-3 border-white border-t-transparent rounded-full"></div>
                  </div>
                )}
                <div 
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all cursor-pointer flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
                </div>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 p-2.5 bg-niramayah-green text-white rounded-full shadow-lg hover:bg-niramayah-green/90 transition-all hover:scale-110 z-10"
              >
                <Plus className="h-4 w-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload}
              />
            </div>

            {/* User Info - Shifted down naturally by layout flow */}
            <div className="pt-4 flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-serif font-black text-slate-900 tracking-tight">{user.name}</h1>
                    <span className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-full border whitespace-nowrap shadow-sm ${
                      user.role === 'SUPER_ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      user.role === 'ADMIN' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 font-medium">
                    <p className="flex items-center gap-2 text-lg text-niramayah-green font-semibold">
                      <ShieldCheck className="h-5 w-5" /> {roleTitle}
                    </p>
                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setShowPassModal(true)}
                    variant="outline" 
                    className="rounded-2xl h-12 px-6 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-sm"
                  >
                    <Lock className="h-4 w-4 mr-2" /> Security
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Account Settings - Spans 8 cols if super admin, else full */}
        <div className={`${user.role === 'SUPER_ADMIN' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-8`}>
          <Card className="border-0 shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50/50 px-8 py-8 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <User className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-serif font-bold text-slate-900">Account Settings</CardTitle>
                  <CardDescription className="text-slate-500 font-medium">Manage your professional identity and core credentials.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleUpdateProfile} className="space-y-10">
                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Legal Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-niramayah-green transition-colors" />
                      <input 
                        type="text" 
                        required
                        className="w-full pl-12 pr-5 h-14 bg-slate-50/50 border border-slate-200 rounded-2xl text-base font-medium focus:ring-4 focus:ring-niramayah-green/10 focus:border-niramayah-green outline-none transition-all placeholder:text-slate-300"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-niramayah-green transition-colors" />
                      <input 
                        type="email" 
                        required
                        className="w-full pl-12 pr-5 h-14 bg-slate-50/50 border border-slate-200 rounded-2xl text-base font-medium focus:ring-4 focus:ring-niramayah-green/10 focus:border-niramayah-green outline-none transition-all placeholder:text-slate-300"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-400">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs font-mono tracking-tighter">UID: {user.id}</span>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full sm:w-auto bg-slate-900 hover:bg-niramayah-navy text-white rounded-2xl h-14 px-12 font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {loading ? "Processing..." : "Save Profile Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Pillars Section - Spans 4 cols for super admin */}
        {user.role === 'SUPER_ADMIN' && (
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-0 shadow-sm rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <LayoutGrid className="h-6 w-6 text-niramayah-green shrink-0" />
                    <CardTitle className="text-2xl font-serif font-bold leading-none">The Founding Four</CardTitle>
                  </div>
                  <button 
                    onClick={() => setShowCoreModal(true)}
                    className="h-10 w-10 flex items-center justify-center bg-white/10 rounded-xl hover:bg-white/20 transition-all border border-white/10"
                    title="Add Pillar Member"
                  >
                    <UserPlus className="h-5 w-5" />
                  </button>
                </div>
                <CardDescription className="text-slate-400 font-medium">The elite core team defining NIRAMAYAH strategy.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid gap-4">
                  {[0, 1, 2, 3].map((idx) => {
                    const member = coreMembers[idx];
                    return (
                      <div 
                        key={idx} 
                        className={`group relative p-5 rounded-3xl border-2 transition-all duration-300 ${
                          member 
                            ? 'bg-white border-slate-50 shadow-sm hover:shadow-lg hover:border-niramayah-green/20' 
                            : 'bg-slate-50/50 border-dashed border-slate-200 hover:border-niramayah-green/30 cursor-pointer'
                        }`}
                        onClick={() => !member && setShowCoreModal(true)}
                      >
                        {member ? (
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 overflow-hidden relative border border-slate-100 shadow-sm">
                              {member.profileImage ? (
                                <Image src={member.profileImage} alt={member.name} fill className="object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-300 font-black text-sm italic">{member.name.charAt(0)}</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate">{member.name}</p>
                              <p className="text-[10px] font-black text-niramayah-green uppercase tracking-[0.15em] mt-0.5">{member.coreRoleTitle || member.role}</p>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleCoreMember(member.id, false); }}
                              className="h-8 w-8 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-12 flex items-center justify-center relative">
                            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase tracking-widest italic opacity-60 group-hover:opacity-0 transition-opacity">
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Slot Available</span>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="h-5 w-5 text-niramayah-green animate-in zoom-in-50" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>


                <div className="pt-4">
                  <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-4">
                    <TrendingUp className="h-8 w-8 text-indigo-500" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-serif font-bold text-slate-900">Pillar Vision</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                        "Exclusivity drives precision. Our 4 pillars are the architects of clinical integrity and technological evolution."
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Password Update Modal - REDESIGNED */}
      {showPassModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4 flex flex-row items-center justify-between bg-white">
              <div>
                <CardTitle className="text-2xl font-serif font-black text-slate-900">Security Update</CardTitle>
                <CardDescription className="text-slate-500 font-medium">Refresh your access credentials.</CardDescription>
              </div>
              <button 
                onClick={() => setShowPassModal(false)} 
                className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleUpdatePassword} className="bg-white px-8 pb-8 space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-niramayah-green/10 outline-none transition-all"
                    value={passData.currentPassword}
                    onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-niramayah-green/10 outline-none transition-all"
                    value={passData.newPassword}
                    onChange={e => setPassData({...passData, newPassword: e.target.value})}
                  />
                  
                  {passData.newPassword.length > 0 && (
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
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-niramayah-green/10 outline-none transition-all"
                    value={passData.confirmPassword}
                    onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
                  />
                  {passData.confirmPassword.length > 0 && (
                    <p className={`text-[10px] font-bold mt-1 ${passData.newPassword === passData.confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                      {passData.newPassword === passData.confirmPassword ? "Passwords match perfectly" : "Passwords do not match"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={passLoading || !isPasswordValid || passData.newPassword !== passData.confirmPassword}
                  className="flex-1 bg-niramayah-navy hover:bg-slate-900 text-white rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl shadow-slate-200"
                >
                  {passLoading ? "Verifying..." : "Update Password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Core Member Modal - REDESIGNED */}
      {showCoreModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4 flex flex-row items-center justify-between bg-white border-b border-slate-50">
              <div>
                <CardTitle className="text-2xl font-serif font-black text-slate-900">Assign Pillar</CardTitle>
                <CardDescription className="text-slate-500 font-medium">Select a leader to join the core team.</CardDescription>
              </div>
              <button onClick={() => setShowCoreModal(false)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="p-4 bg-white max-h-[500px] overflow-y-auto space-y-3 custom-scrollbar">
              {allAdmins.filter(a => !a.isCoreMember).map((admin) => (
                <div 
                  key={admin.id} 
                  className="p-5 bg-slate-50/50 hover:bg-slate-50 rounded-[1.5rem] border border-slate-100 transition-all cursor-pointer flex items-center gap-5 group hover:shadow-md hover:border-niramayah-green/10"
                  onClick={() => {
                    const title = prompt("Enter Core Role Title (e.g. CEO, Lead AI, Founder):");
                    if (title) {
                      toggleCoreMember(admin.id, true, title);
                      setShowCoreModal(false);
                    }
                  }}
                >
                  <div className="h-14 w-14 rounded-2xl bg-white overflow-hidden relative shadow-sm border border-slate-100">
                    {admin.profileImage ? (
                      <Image src={admin.profileImage} alt={admin.name} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300 font-black text-lg italic">{admin.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black text-slate-900">{admin.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mt-0.5">{admin.role}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-300 group-hover:text-niramayah-green transition-all">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              ))}
              {allAdmins.filter(a => !a.isCoreMember).length === 0 && (
                <div className="text-center py-16 px-8 space-y-4">
                  <UserCheck className="h-12 w-12 text-slate-100 mx-auto" />
                  <p className="text-sm font-medium text-slate-400 leading-relaxed">No eligible administrators found. Ensure members have the appropriate role to be promoted.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
