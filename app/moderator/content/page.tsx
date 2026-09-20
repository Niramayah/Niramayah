"use client";

import { useState, useEffect } from "react";
import { Layout, Save, Info, Loader2, Globe, Bell, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ContentManagementPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/moderator/content');
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      const res = await fetch('/api/moderator/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        // Success feedback if needed
      }
    } catch (err) {
      alert("Failed to update setting");
    } finally {
      setSavingKey(null);
    }
  };

  const getSettingValue = (key: string) => {
    return settings.find(s => s.key === key)?.value || "";
  };

  const updateLocalValue = (key: string, value: string) => {
    setSettings(prev => {
      const existing = prev.find(s => s.key === key);
      if (existing) {
        return prev.map(s => s.key === key ? { ...s, value } : s);
      }
      return [...prev, { key, value }];
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
          <Layout className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Site Content</h1>
          <p className="text-slate-500">Manage global application content and announcements</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-400" /> General Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Support Email Address</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none"
                  value={getSettingValue('SUPPORT_EMAIL')}
                  onChange={e => updateLocalValue('SUPPORT_EMAIL', e.target.value)}
                  placeholder="support@niramayah.com"
                />
                <Button 
                  onClick={() => handleUpdate('SUPPORT_EMAIL', getSettingValue('SUPPORT_EMAIL'))}
                  disabled={savingKey === 'SUPPORT_EMAIL'}
                  className="bg-slate-900 text-white rounded-xl px-4"
                >
                  {savingKey === 'SUPPORT_EMAIL' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Emergency Helpline Number</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none"
                  value={getSettingValue('EMERGENCY_HELPLINE')}
                  onChange={e => updateLocalValue('EMERGENCY_HELPLINE', e.target.value)}
                  placeholder="+91-1234567890"
                />
                <Button 
                  onClick={() => handleUpdate('EMERGENCY_HELPLINE', getSettingValue('EMERGENCY_HELPLINE'))}
                  disabled={savingKey === 'EMERGENCY_HELPLINE'}
                  className="bg-slate-900 text-white rounded-xl px-4"
                >
                  {savingKey === 'EMERGENCY_HELPLINE' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-400" /> System Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Top Banner Text (HTML Supported)</label>
              <div className="space-y-3">
                <textarea 
                  className="w-full h-32 px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none"
                  value={getSettingValue('SYSTEM_BANNER')}
                  onChange={e => updateLocalValue('SYSTEM_BANNER', e.target.value)}
                  placeholder="Welcome to NIRAMAYAH! New cardiac screening features are live."
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleUpdate('SYSTEM_BANNER', getSettingValue('SYSTEM_BANNER'))}
                    disabled={savingKey === 'SYSTEM_BANNER'}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-indigo-600/20"
                  >
                    {savingKey === 'SYSTEM_BANNER' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Update System Banner
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4">
          <ShieldCheck className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-bold text-blue-900">Content Moderation Policy</h4>
            <p className="text-xs text-blue-700 leading-relaxed mt-1">
              Any changes made to site content are logged in the audit trail. Please ensure that emergency contact information is accurate and verified before updating.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
