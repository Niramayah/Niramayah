"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ShieldCheck, 
  Ghost, 
  Trash2, 
  UserMinus, 
  ArrowLeft, 
  Plus,
  Loader2,
  CheckCircle2,
  Save,
  Image as ImageIcon,
  Link2 as Linkedin,
  Link2 as Github,
  ExternalLink,
  ShieldAlert,
  Mail,
  Lock
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const FOUNDING_EMAILS = [
  'arnab@niramayah.in',
  'bikram@niramayah.in',
  'abhirup@niramayah.in',
  'riya@niramayah.in'
];

export default function AboutManagerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<{ leaders: any[], active: any[], ghosts: any[] }>({
    leaders: [],
    active: [],
    ghosts: []
  });
  const [activeTab, setActiveTab] = useState<'general' | 'active' | 'leaders'>('active');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.leaders) setTeam(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load team data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (userId: string, status: string) => {
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });
      if (res.ok) {
        toast({ title: "Success", description: `Member moved to ${status.toLowerCase()} status.` });
        fetchTeam();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (error: any) {
      toast({ title: "Action Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleLeaderUpdate = async (leaderId: string, data: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: leaderId, 
          name: data.name,
          email: data.email,
          password: data.password, // Sending password for hashing on server
          coreRoleTitle: data.role,
          bio: data.bio,
          linkedinUrl: data.linkedinUrl,
          githubUrl: data.githubUrl,
          profileImage: data.profileImage,
          role: data.systemRole
        })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Leader profile and security updated." });
        fetchTeam();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to update leader.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const permanentDelete = async (userId: string) => {
    if (!confirm("Are you sure? This will permanently erase this member from the database.")) return;
    try {
      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        toast({ title: "Deleted", description: "Member removed permanently." });
        fetchTeam();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete member.", variant: "destructive" });
    }
  };

  if (!isAdmin) return <div className="p-10 text-slate-900">Unauthorized Access</div>;

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 text-slate-900 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-black flex items-center gap-3 text-slate-900">
            <Users className="h-10 w-10 text-niramayah-green" />
            About Manager
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage the public-facing leadership and team sections of NIRAMAYAH.</p>
        </div>
        <Link href="/about">
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-niramayah-green rounded-xl h-12 shadow-sm">
            <ExternalLink className="h-4 w-4 mr-2" /> View Public Page
          </Button>
        </Link>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-50 border border-slate-200 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Active Members
        </button>
        {isSuperAdmin && (
          <button 
            onClick={() => setActiveTab('leaders')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'leaders' ? 'bg-niramayah-green text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            The Founding Four
          </button>
        )}
        <button 
          onClick={() => setActiveTab('general')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          General Info
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-niramayah-green" />
          <p className="font-serif italic tracking-widest text-slate-400 text-sm">Syncing Clinical Team...</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {activeTab === 'active' && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-slate-900">Active Members ({team.active.length})</h2>
                <Button className="bg-niramayah-green text-white font-bold rounded-xl h-10 px-4">
                  <Plus className="h-4 w-4 mr-2" /> Add New Member
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {team.active.map(member => (
                  <MemberCard 
                    key={member.id} 
                    member={member} 
                    onGhost={() => updateStatus(member.id, 'GHOST')}
                    onDelete={isSuperAdmin ? () => permanentDelete(member.id) : undefined}
                  />
                ))}
                {team.active.length === 0 && <EmptyState text="No active members found." />}
              </div>
            </section>
          )}

          {activeTab === 'leaders' && isSuperAdmin && (
            <section className="space-y-8">
              <div className="bg-niramayah-green/5 border border-niramayah-green/20 p-6 rounded-[2rem] flex items-center gap-6">
                <div className="h-16 w-16 bg-niramayah-green/10 rounded-full flex items-center justify-center text-niramayah-green shadow-inner">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-niramayah-green">Founding Four Administration</h3>
                  <p className="text-sm text-slate-600">Super Admin only: You can promote members to Administrative roles and update the clinical journey data.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-12">
                {team.leaders.length > 0 ? team.leaders.map(leader => (
                  <LeaderEditor 
                    key={leader.id} 
                    leader={leader} 
                    onSave={(data) => handleLeaderUpdate(leader.id, data)}
                    saving={saving}
                    currentUserRole={user?.role}
                  />
                )) : (
                  <div className="text-center py-10 text-slate-400 font-serif italic border-2 border-dashed border-slate-100 rounded-[2rem]">
                    Founding Four records not found in database. Please run seed script.
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'general' && (
            <Card className="bg-white border-slate-200 shadow-sm rounded-[2rem] overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-2xl font-serif font-bold text-slate-900">About Page Content</CardTitle>
                <CardDescription className="text-slate-500">Update the mission statement and branding text on the main about page.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Mission Statement</label>
                  <textarea 
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl p-4 text-slate-700 min-h-[150px] focus:ring-1 ring-niramayah-green outline-none transition-all"
                    placeholder="Enter the NIRAMAYAH mission statement..."
                    defaultValue="NIRAMAYAH was born from a simple yet powerful goal: to make cardiac screening accessible, non-invasive, and intelligent."
                  />
                </div>
                <div className="flex justify-end">
                  <Button className="bg-slate-900 text-white font-black rounded-xl h-12 px-8 uppercase tracking-widest text-xs hover:bg-slate-800 transition-colors">
                    Save General Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hall of Respect Section (GHOSTS) */}
          <section className="pt-12 border-t border-slate-100 space-y-6">
            <h2 className="text-2xl font-serif font-bold flex items-center gap-3 text-slate-400">
              <Ghost className="h-6 w-6" />
              The Hall of Respect (Past Contributors)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {team.ghosts.map(member => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  isGhost 
                  onRestore={() => updateStatus(member.id, 'ACTIVE')}
                />
              ))}
              {team.ghosts.length === 0 && <p className="text-sm text-slate-400 italic">No past contributors yet.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function LeaderEditor({ leader, onSave, saving: globalSaving, currentUserRole }: { leader: any, onSave: (data: any) => void, saving: boolean, currentUserRole: string | undefined }) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localSaving, setLocalSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: leader.name || "",
    email: leader.email || "",
    password: "", // New password reset field
    role: leader.coreRoleTitle || leader.role || "",
    bio: leader.bio || "",
    linkedinUrl: leader.linkedinUrl || "",
    githubUrl: leader.githubUrl || "",
    profileImage: leader.profileImage || "",
    systemRole: leader.role || "USER"
  });

  const isFoundingEmail = FOUNDING_EMAILS.includes(leader.email);
  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
  const canManageAccess = isSuperAdmin && isFoundingEmail;

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new (window as any).Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const { width, height } = img;
      const ratio = width / height;
      if (Math.abs(ratio - 1) > 0.1) {
        toast({ 
          title: "Ratio Warning", 
          description: "This image is not 1:1. It might look distorted in the clinical grid.",
          variant: "destructive"
        });
      }

      setLocalSaving(true);
      try {
        const upData = new FormData();
        upData.append('file', file);
        upData.append('userId', leader.id);

        const res = await fetch('/api/profile/upload', {
          method: 'POST',
          body: upData
        });
        const result = await res.json();
        if (result.path) {
          setFormData(prev => ({ ...prev, profileImage: result.path }));
          toast({ title: "Success", description: "Photo uploaded successfully." });
        } else {
          throw new Error(result.error);
        }
      } catch (err: any) {
        toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
      } finally {
        setLocalSaving(false);
      }
    };
  };

  return (
    <Card className="bg-white border-slate-200 shadow-md rounded-[2.5rem] overflow-hidden border-2 hover:border-niramayah-green/30 transition-colors">
      <CardContent className="p-0 flex flex-col md:flex-row">
        <div className="md:w-1/3 bg-slate-50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
          <div 
            onClick={handleBoxClick}
            className="aspect-square w-full max-w-[240px] relative rounded-[2rem] overflow-hidden shadow-2xl mb-6 border-4 border-white cursor-pointer group"
          >
            <Image src={formData.profileImage || "/placeholder-avatar.jpg"} alt={formData.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold">
              {localSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
              {localSaving ? "Processing..." : "Change Photo"}
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Required Ratio: 1:1 Square</p>
          
          <div className="mt-6 w-full space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address (Sync Key)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
              <input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={!isSuperAdmin}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 focus:ring-1 ring-niramayah-green outline-none disabled:bg-slate-50 disabled:text-slate-400 shadow-sm transition-all"
              />
            </div>
            
            {/* RESET PASSWORD FIELD (SUPER_ADMIN ONLY) */}
            {isSuperAdmin && (
              <div className="pt-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reset Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                  <input 
                    type="password"
                    placeholder="Enter new password..."
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 focus:ring-1 ring-orange-400 outline-none shadow-sm"
                  />
                </div>
              </div>
            )}

            {isFoundingEmail && (
              <div className="flex items-center gap-1.5 px-2 pt-1">
                <ShieldCheck className="h-3 w-3 text-niramayah-green" />
                <span className="text-[9px] font-black text-niramayah-green uppercase tracking-tighter">Verified Founding Account</span>
              </div>
            )}
          </div>
        </div>

        <div className="md:w-2/3 p-8 lg:p-12 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white border-b-2 border-slate-100 py-3 text-lg font-bold text-slate-900 focus:border-niramayah-green outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Designation / Core Role</label>
              <input 
                type="text" 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full bg-white border-b-2 border-slate-100 py-3 text-lg font-bold text-niramayah-green focus:border-niramayah-navy outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personal Contribution & Bio</label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-600 min-h-[120px] focus:bg-white focus:border-niramayah-green outline-none transition-all"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Linkedin className="h-3 w-3" /> LinkedIn URL
              </label>
              <input 
                type="text" 
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
                className="w-full bg-white border-b border-slate-100 py-2 text-sm text-slate-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Github className="h-3 w-3" /> GitHub URL
              </label>
              <input 
                type="text" 
                value={formData.githubUrl}
                onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                className="w-full bg-white border-b border-slate-100 py-2 text-sm text-slate-500 focus:border-slate-900 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Exclusive Role Promotion Power */}
          {canManageAccess && (
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-bold text-blue-900 uppercase tracking-widest">Administrative Role Management</h4>
              </div>
              <div className="flex gap-4">
                {['USER', 'ADMIN', 'SUPER_ADMIN'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFormData({...formData, systemRole: r})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${
                      formData.systemRole === r 
                      ? 'bg-blue-600 text-white shadow-lg scale-105' 
                      : 'bg-white text-blue-400 border border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-blue-400 italic">Caution: Updating this field instantly grants server-side administrative privileges.</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => onSave(formData)} 
              disabled={globalSaving || localSaving}
              className="bg-niramayah-green text-white font-black rounded-xl h-12 px-10 uppercase tracking-widest text-xs hover:shadow-xl transition-all flex items-center gap-2"
            >
              {(globalSaving || localSaving) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Update Leader Profile & Security
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MemberCard({ member, isLeader, isGhost, onGhost, onDelete, onRestore }: any) {
  return (
    <Card className="bg-white border-slate-200 rounded-3xl overflow-hidden group hover:border-niramayah-green/30 transition-all duration-300 shadow-sm hover:shadow-md">
      <CardContent className="p-0">
        <div className="aspect-square relative overflow-hidden">
          <Image src={member.profileImage || "/placeholder-avatar.jpg"} alt={member.name} fill className="object-cover" />
          {isLeader && (
            <div className="absolute top-4 left-4 bg-niramayah-green/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md flex items-center gap-1 shadow-lg">
              <ShieldCheck className="h-3 w-3" /> Founder
            </div>
          )}
        </div>
        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-bold text-slate-900 truncate capitalize">{member.name}</h3>
            <p className="text-[10px] font-black text-niramayah-green uppercase tracking-widest mt-1 truncate">{member.coreRoleTitle || member.role}</p>
          </div>
          
          <div className="flex gap-2 pt-2">
            {!isLeader && !isGhost && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onGhost}
                className="flex-1 h-9 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-[10px] font-bold uppercase tracking-widest border border-slate-100"
              >
                <UserMinus className="h-3 w-3 mr-2" /> Mark Left
              </Button>
            )}
            {isGhost && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRestore}
                className="flex-1 h-9 rounded-xl bg-niramayah-green/10 text-niramayah-green hover:bg-niramayah-green hover:text-white text-[10px] font-bold uppercase tracking-widest"
              >
                <CheckCircle2 className="h-3 w-3 mr-2" /> Restore
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDelete}
                className="h-9 w-9 p-0 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {isLeader && (
              <div className="flex-1 h-9 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100">
                <ShieldCheck className="h-3 w-3" /> Protected
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-400 italic text-sm">
      {text}
    </div>
  );
}
