"use client";

import { useState } from "react";
import { AssessmentForm } from "@/components/ai/AssessmentForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, User, ShieldCheck } from "lucide-react";

export default function AiTestViewPage() {
  const [viewMode, setViewMode] = useState<"self" | "preview">("self");

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-niramayah-navy">AI Diagnostic Playground</h1>
          <p className="text-niramayah-gray mt-1">Test the diagnosis engine and preview the user experience.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div 
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${viewMode === 'self' ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                  onClick={() => setViewMode('self')}
                >
                  <div className={`p-2 rounded-lg ${viewMode === 'self' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">Test as Admin</p>
                    <p className="text-[10px] text-slate-400">Mark as ADMIN_TEST</p>
                  </div>
                </div>

                <div 
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${viewMode === 'preview' ? 'border-niramayah-green bg-niramayah-green/5 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                  onClick={() => setViewMode('preview')}
                >
                  <div className={`p-2 rounded-lg ${viewMode === 'preview' ? 'bg-niramayah-green text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">User Preview</p>
                    <p className="text-[10px] text-slate-400">Simulate USER view</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
                <p className="text-[10px] font-bold text-niramayah-orange uppercase">Policy</p>
                <p className="text-[11px] text-orange-800/80 leading-relaxed">
                  No credits will be deducted during this test. Reports generated here will be marked as test records.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white border-b border-white/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Brain className="h-4 w-4 text-emerald-400" /> Engine Test Cases
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                { label: 'Low Risk Case', level: 'LOW', color: 'bg-emerald-500' },
                { label: 'Moderate Risk Case', level: 'MODERATE', color: 'bg-blue-500' },
                { label: 'High Risk Case', level: 'HIGH', color: 'bg-orange-500' },
                { label: 'Emergency Case', level: 'EMERGENCY', color: 'bg-red-500' }
              ].map((test) => (
                <button
                  key={test.level}
                  onClick={() => {
                    const event = new CustomEvent('loadTestCase', { detail: test.level });
                    window.dispatchEvent(event);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-left"
                >
                  <span className="text-xs font-bold text-slate-700">{test.label}</span>
                  <div className={`h-2 w-2 rounded-full ${test.color}`}></div>
                </button>
              ))}
              <p className="text-[10px] text-slate-400 italic text-center pt-2">
                Click a case to pre-fill the form
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Live Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-600 font-medium">AI Engine Connected</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-xs text-slate-600 font-medium">Session Tracking Active</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {viewMode === 'preview' ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
               <div className="bg-niramayah-green text-white px-6 py-3 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Brain className="h-5 w-5" />
                   <span className="font-bold text-sm">USER PREVIEW MODE</span>
                 </div>
                 <span className="text-[10px] bg-white/20 px-2 py-1 rounded uppercase font-bold">Read-Only Simulation</span>
               </div>
               <div className="p-8 bg-slate-50/50">
                 <AssessmentForm isTest={true} testSource="USER_PREVIEW" />
               </div>
            </div>
          ) : (
            <AssessmentForm isTest={true} testSource="ADMIN_TEST" />
          )}
        </div>
      </div>
    </div>
  );
}
