"use client";

import { AssessmentForm } from "@/components/ai/AssessmentForm";
import { Shield, Info } from "lucide-react";

export default function ModeratorAiTestPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">AI Test Lab</h1>
            <p className="text-slate-500">Moderator-only diagnostic testing environment</p>
          </div>
        </div>
        
        <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Test Mode Active:</strong> You have unlimited credits for this lab. Tests performed here are marked as 
            <em> "MODERATOR_TEST"</em> and do not affect clinical statistics. You can generate and download reports for testing records.
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 bg-slate-50 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Diagnosis Simulator</h2>
          <p className="text-sm text-slate-500">Run cardiac risk assessments to verify AI logic and report accuracy.</p>
        </div>
        <div className="p-8">
          <AssessmentForm isTest={true} testSource="MODERATOR_TEST" />
        </div>
      </div>
    </div>
  );
}
