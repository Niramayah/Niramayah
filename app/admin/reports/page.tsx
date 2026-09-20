"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Eye, Trash2, Loader2, Calendar, User, Search, X, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { generateReportPdf } from "@/lib/report-utils";

interface Report {
  id: string;
  patientName: string;
  patientRef: string;
  type: string;
  riskLevel: string;
  inputData: any;
  result: any;
  createdAt: string;
  user: { name: string; email: string };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(reports.filter(r => r.id !== id));
      }
    } catch (err) {
      alert("Failed to delete report");
    }
  };

  const getRiskColor = (risk: string) => {
    const r = risk?.toLowerCase();
    if (r === 'low') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (r === 'moderate') return 'text-amber-600 bg-amber-50 border-amber-100';
    if (r === 'high') return 'text-orange-600 bg-orange-50 border-orange-100';
    if (r === 'emergency') return 'text-red-600 bg-red-50 border-red-100';
    return 'text-slate-400 bg-slate-50 border-slate-100';
  };

  const filteredReports = reports.filter(report => {
    const query = searchQuery.toLowerCase();
    return (
      report.patientRef?.toLowerCase().includes(query) ||
      report.patientName?.toLowerCase().includes(query) ||
      report.riskLevel?.toLowerCase().includes(query) ||
      report.user?.name?.toLowerCase().includes(query) ||
      report.user?.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Saved Reports</h1>
            <p className="text-slate-500 mt-2">Manage all system-generated diagnostic reports.</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by ID, patient, or author..."
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-sm"
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

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
              <p className="text-slate-500 font-medium">Loading all reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl m-6">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900">No Reports Found</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 italic">The diagnostic database is currently empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Report / Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Patient</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Generated By</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Risk Level</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{report.patientRef}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700">{report.patientName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-900">{report.user?.name}</span>
                          <span className="text-[10px] text-slate-400">{report.user?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getRiskColor(report.riskLevel)}`}>
                          {report.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-slate-400 hover:text-blue-600">
                            <Link href={`/admin/reports/view?id=${report.id}`}>
                              <Eye className="h-4 w-4" />
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
                                inputData: report.inputData
                              });
                            }}
                            className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(report.id)} 
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
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

      <div className="flex justify-center">
        <Link href="/admin" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
