"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Eye, Trash2, Loader2, Calendar, Search, X, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { generateReportPdf } from "@/lib/report-utils";
import { useModeratorPermissions } from "@/hooks/use-moderator-permissions";

interface Report {
  id: string;
  patientName: string;
  patientRef: string;
  type: string;
  riskLevel: string;
  inputData: any;
  result: any;
  createdAt: string;
}

export default function ModeratorReportsPage() {
  const { hasPerm, loading: permLoading } = useModeratorPermissions();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/moderator/reports');
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPerm('aiTestAccess')) {
      fetchReports();
    }
  }, [hasPerm]);

  if (permLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!hasPerm('aiTestAccess')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 mt-2">You do not have the AI_TEST_ACCESS permission required to view these reports.</p>
        <Link href="/moderator" className="mt-6 text-purple-600 font-bold hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      const res = await fetch(`/api/moderator/reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReports(reports.filter(r => r.id !== id));
      } else {
        alert(data.error || "Failed to delete report");
      }
    } catch (err) {
      alert("Failed to delete report");
    }
  };

  const filteredReports = reports.filter(report => {
    const query = searchQuery.toLowerCase();
    return (
      report.patientRef?.toLowerCase().includes(query) ||
      report.patientName?.toLowerCase().includes(query) ||
      report.riskLevel?.toLowerCase().includes(query)
    );
  });

  const getRiskColor = (risk: string) => {
    const r = risk?.toLowerCase();
    if (r === 'low') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (r === 'moderate') return 'text-amber-600 bg-amber-50 border-amber-100';
    if (r === 'high') return 'text-orange-600 bg-orange-50 border-orange-100';
    if (r === 'emergency') return 'text-red-600 bg-red-50 border-red-100';
    return 'text-slate-400 bg-slate-50 border-slate-100';
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Saved Reports</h1>
            <p className="text-slate-500">Access and manage archived diagnostic summaries</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search reports..."
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm shadow-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-3xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
              <p className="text-slate-500 font-medium">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-24 px-6">
              <div className="h-20 w-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Reports Found</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">
                Generate and save reports from the AI Test Lab to see them here in your staff archives.
              </p>
              <Button asChild className="mt-8 bg-purple-600 hover:bg-purple-700 rounded-xl px-8">
                <Link href="/moderator/ai-test">Go to AI Test Lab</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient / Ref</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Risk Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Created Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 mb-0.5">{report.patientName || "Anonymous"}</span>
                          <span className="text-[11px] font-black text-purple-600 tracking-wider">
                            {report.patientRef || `NRM-${report.id.slice(-6)}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${getRiskColor(report.riskLevel)}`}>
                          {report.riskLevel}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                            <Calendar className="h-3.5 w-3.5 opacity-50" />
                            {new Date(report.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-purple-600 bg-white shadow-sm border border-slate-100 rounded-xl" asChild title="View Report">
                             <Link href={`/moderator/reports/view?id=${report.id}`}>
                               <Eye className="h-4.5 w-4.5" />
                             </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              generateReportPdf({
                                patientName: report.patientName,
                                patientRef: report.patientRef,
                                date: report.createdAt,
                                riskLevel: report.riskLevel,
                                summary: report.result.summary,
                                urgency: report.result.urgency,
                                confidenceScore: report.result.confidence_score,
                                keyRiskFactors: report.result.key_risk_factors,
                                possibleConditions: report.result.possible_conditions,
                                recommendation: report.result.recommendation,
                                inputData: report.inputData,
                                ai_interaction_log: report.ai_interaction_log || []
                              });
                            }}
                            className="h-9 w-9 text-slate-400 hover:text-emerald-600 bg-white shadow-sm border border-slate-100 rounded-xl"
                            title="Download PDF"
                          >
                             <Download className="h-4.5 w-4.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(report.id)} className="h-9 w-9 text-slate-400 hover:text-red-500 bg-white shadow-sm border border-slate-100 rounded-xl" title="Delete Report">
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-8 flex justify-center">
        <Link href="/moderator" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
           <ArrowLeft className="h-4 w-4" />
           Back to Panel
        </Link>
      </div>
    </div>
  );
}
