'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Save, Loader2, ArrowLeft, Globe, Mail, ShieldAlert, Zap } from "lucide-react";
import Link from 'next/link';

export default function SiteSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = () => {
    setLoading(true);
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setSettings(data.settings);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    setSaving(key);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
      }
    } catch (err) {
      alert('Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const getSettingValue = (key: string) => settings.find(s => s.key === key)?.value || '';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-bold text-slate-900">Platform Settings</h1>
        <p className="text-slate-500 mt-2">Global configuration for branding, AI, and system behavior.</p>
      </div>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <Globe className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-xl font-serif">Branding & Core</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Site Name</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      defaultValue={getSettingValue('siteName')}
                      onBlur={(e) => handleUpdate('siteName', e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {saving === 'siteName' && <Loader2 className="h-4 w-4 animate-spin self-center" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Contact Email</label>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      defaultValue={getSettingValue('contactEmail')}
                      onBlur={(e) => handleUpdate('contactEmail', e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    {saving === 'contactEmail' && <Loader2 className="h-4 w-4 animate-spin self-center" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-xl font-serif">Security & Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div>
                  <h4 className="text-sm font-bold text-orange-900 uppercase">Maintenance Mode</h4>
                  <p className="text-xs text-orange-700 mt-0.5">While active, users cannot access the platform.</p>
                </div>
                <div className="flex items-center gap-3">
                  {saving === 'maintenanceMode' && <Loader2 className="h-4 w-4 animate-spin" />}
                  <button 
                    onClick={() => handleUpdate('maintenanceMode', getSettingValue('maintenanceMode') === 'true' ? 'false' : 'true')}
                    className={`w-12 h-6 rounded-full transition-colors relative ${getSettingValue('maintenanceMode') === 'true' ? 'bg-orange-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${getSettingValue('maintenanceMode') === 'true' ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <Zap className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-xl font-serif">AI Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">System Prompt Override (JSON)</label>
                  <textarea 
                    defaultValue={getSettingValue('aiSystemPrompt')}
                    onBlur={(e) => handleUpdate('aiSystemPrompt', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 h-32 font-mono"
                  />
                  {saving === 'aiSystemPrompt' && <div className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</div>}
                </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-center">
        <Link 
          href="/admin" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
