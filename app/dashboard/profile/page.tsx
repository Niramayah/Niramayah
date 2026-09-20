"use client";

import { useEffect, useState } from "react";
import { User, Mail, Calendar, Ruler, Weight, Droplets, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    bloodType: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (res.ok && data.user) {
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          age: data.user.profile?.age?.toString() || "",
          gender: data.user.profile?.gender || "",
          height: data.user.profile?.height?.toString() || "",
          weight: data.user.profile?.weight?.toString() || "",
          bloodType: data.user.profile?.bloodType || ""
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      toast({
        title: "Error",
        description: "Could not load profile data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Profile Updated",
          description: "Your changes have been saved successfully.",
        });
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-niramayah-green mb-4" />
        <p className="text-niramayah-gray font-medium">Synchronizing your health profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-niramayah-green/10 flex items-center justify-center">
          <User className="w-8 h-8 text-niramayah-green" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-niramayah-navy">Health Profile</h1>
          <p className="text-niramayah-gray">Manage your personal and clinical measurements for accurate AI analysis.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-lg font-serif">Account Information</CardTitle>
              <CardDescription>Basic identification and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-niramayah-navy/70 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name" 
                      className="pl-10 h-12 bg-gray-50/50 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-niramayah-navy/70 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      value={formData.email}
                      readOnly 
                      className="pl-10 h-12 bg-gray-100/80 text-gray-500 border-dashed cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-lg font-serif">Medical Metrics</CardTitle>
              <CardDescription>Vital measurements used for cardiac risk calculation.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-niramayah-navy/70 ml-1">Age</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="Years" 
                      className="pl-10 h-12 bg-gray-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-niramayah-navy/70 ml-1 text-center block">Gender</label>
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-niramayah-green/20 focus:bg-white transition-all"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-niramayah-navy/70 ml-1">Blood Type</label>
                  <div className="relative">
                    <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleInputChange}
                      placeholder="e.g. A+" 
                      className="pl-10 h-12 bg-gray-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-niramayah-navy/70 ml-1">Height (cm)</label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="cm" 
                      className="pl-10 h-12 bg-gray-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-niramayah-navy/70 ml-1">Weight (kg)</label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="kg" 
                      className="pl-10 h-12 bg-gray-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-niramayah-navy text-white overflow-hidden border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Action Center</CardTitle>
              <CardDescription className="text-blue-200/60">Keep your information synced for better results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-niramayah-green">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Ready</span>
                </div>
                <p className="text-[11px] text-blue-100/60">
                  A complete profile improves AI diagnosis accuracy by up to 25%.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit"
                className="w-full bg-niramayah-green hover:bg-niramayah-green/90 text-white py-6 text-lg font-bold shadow-lg shadow-niramayah-green/20 transition-all active:scale-95"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          <div className="p-6 bg-orange-50 border border-orange-100 rounded-[2rem] space-y-3">
            <div className="flex items-center gap-2 text-niramayah-orange">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold text-sm">Security Note</h4>
            </div>
            <p className="text-xs text-orange-800/70 leading-relaxed">
              Your health data is encrypted and only accessible by you. We use this strictly for AI assessment calculations.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
