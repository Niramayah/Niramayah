"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Activity, FileText, Download, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateReportPdf } from "@/lib/report-utils";

interface HistoryItem {
  id: string;
  date: string;
  credits_used: number;
  patientName: string | null;
  patientRef: string | null;
  input_data: any;
  result: {
    risk_level: string;
    summary: string;
    key_risk_factors: string[];
    possible_conditions: string[];
    recommendation: string;
    urgency: string;
    confidence_score: number;
  };
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<HistoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/ai/history');
        if (res.ok) {
          const data = await res.json();
          // Map DB model to frontend expected format
          const mappedHistory = data.history.map((item: any) => ({
            id: item.id,
            date: item.createdAt,
            credits_used: item.riskLevel === 'Unavailable' ? 0 : 50,
            patientName: item.patientName,
            patientRef: item.patientRef,
            input_data: item.inputData,
            result: {
              risk_level: item.riskLevel,
              summary: item.summary,
              key_risk_factors: item.keyRiskFactors,
              possible_conditions: item.possibleConditions,
              recommendation: item.recommendation,
              urgency: item.urgency,
              confidence_score: item.confidenceScore
            }
          }));
          setHistory(mappedHistory);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();
  }, []);

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'emergency': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatVal = (value: any) => {
    if (value === undefined || value === null || value === '' || value === false) {
      return 'Not provided';
    }
    if (value === true || value === 'yes') return 'Yes';
    if (value === 'no') return 'No';
    return value;
  };

  const handleDownloadPdf = (record: HistoryItem) => {
    generateReportPdf({
      patientName: record.patientName || 'Patient',
      patientRef: record.patientRef || `NRM-${record.id.slice(-6)}`,
      date: record.date,
      riskLevel: record.result.risk_level,
      summary: record.result.summary,
      urgency: record.result.urgency,
      confidenceScore: record.result.confidence_score,
      keyRiskFactors: record.result.key_risk_factors,
      possibleConditions: record.result.possible_conditions,
      recommendation: record.result.recommendation,
      inputData: record.input_data
    });
  };

  const filteredHistory = history.filter(record => {
    const query = searchQuery.toLowerCase();
    return (
      record.patientName?.toLowerCase().includes(query) ||
      record.patientRef?.toLowerCase().includes(query) ||
      record.result.risk_level.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-niramayah-navy">Assessment History</h1>
          <p className="text-niramayah-gray mt-1">Review and manage your past cardiac risk screenings.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <input 
              type="text"
              placeholder="Search by name or ref..."
              className="w-full h-10 pl-3 pr-10 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-niramayah-green text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button className="bg-niramayah-green hover:bg-niramayah-green/90 text-white whitespace-nowrap" asChild>
            <Link href="/dashboard/ai-test">New Assessment</Link>
          </Button>
        </div>
      </div>

      {history.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-niramayah-navy">No history found</h3>
            <p className="text-niramayah-gray mt-2 mb-6">You haven't taken any AI assessments yet.</p>
            <Button className="bg-niramayah-navy hover:bg-niramayah-navy/90 text-white" asChild>
              <Link href="/dashboard/ai-test">Start First Assessment</Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-niramayah-gray">No assessments match your search query.</p>
          <Button variant="link" onClick={() => setSearchQuery("")} className="text-niramayah-green">Clear Search</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredHistory.map((record, index) => (
            <Card key={record.id || index} className="overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
              <CardHeader className="bg-gray-50/50 py-3 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-niramayah-gray">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {new Date(record.date).toLocaleDateString()}
                  </div>
                  {record.patientRef && (
                    <div className="hidden sm:block px-2 py-0.5 bg-slate-200 rounded text-[10px] font-mono text-slate-600">
                      {record.patientRef}
                    </div>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getRiskColor(record.result?.risk_level)}`}>
                  {record.result?.risk_level || 'UNKNOWN'} RISK
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-4 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/4">
                   <h4 className="font-semibold text-niramayah-navy text-sm uppercase tracking-tight opacity-70">Patient</h4>
                   <p className="font-bold text-lg text-niramayah-navy truncate">{record.patientName || "Anonymous"}</p>
                   <p className="text-xs font-mono text-niramayah-gray">{record.patientRef || "NO REF"}</p>
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold text-niramayah-navy text-sm uppercase tracking-tight opacity-70">Clinical Summary</h4>
                  <p className="text-sm text-niramayah-gray leading-relaxed line-clamp-2">
                    {record.result?.summary}
                  </p>
                </div>
                <div className="flex flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                  <span className="text-xs text-gray-500 block">Credits used: {record.credits_used || 50}</span>
                  <Button 
                    variant="outline" 
                    className="w-full text-niramayah-navy border-niramayah-navy/20 hover:bg-gray-50"
                    onClick={() => setSelectedReport(record)}
                  >
                    <FileText className="w-4 h-4 mr-2" /> View Full Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div className="flex flex-col">
                <h2 className="text-xl font-serif font-bold text-niramayah-navy">Cardiac Risk Report</h2>
                <p className="text-xs font-mono text-gray-400">{selectedReport.patientRef || selectedReport.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="text-niramayah-green border-niramayah-green" onClick={() => handleDownloadPdf(selectedReport)}>
                  <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedReport(null)}>
                  <X className="w-5 h-5 text-gray-500" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b pb-4">
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="font-bold text-lg text-niramayah-navy">{selectedReport.patientName || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold text-sm">{new Date(selectedReport.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Risk Level</p>
                  <p className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRiskColor(selectedReport.result?.risk_level)}`}>
                    {selectedReport.result?.risk_level} RISK
                  </p>
                </div>
              </div>

              <div className="flex wrap items-center justify-between gap-4 py-2 bg-slate-50 px-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="font-bold text-niramayah-green">{selectedReport.result?.confidence_score}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Urgency</p>
                  <p className="font-bold text-niramayah-orange">{selectedReport.result?.urgency}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Credits Used</p>
                  <p className="font-semibold text-slate-600">{selectedReport.credits_used}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-niramayah-navy mb-2 border-b pb-1">Clinical Summary</h3>
                <p className="text-gray-700 leading-relaxed text-sm">{selectedReport.result?.summary}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-niramayah-navy mb-2 border-b pb-1">Key Risk Factors</h3>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    {selectedReport.result?.key_risk_factors?.map((f: string, i: number) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-niramayah-navy mb-2 border-b pb-1">Possible Conditions</h3>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                    {selectedReport.result?.possible_conditions?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-niramayah-navy mb-2 border-b pb-1">Recommendation & Next Steps</h3>
                <div className="border-l-4 border-niramayah-green pl-4 py-2 bg-green-50/30 rounded-r-lg">
                  <p className="text-gray-700 text-sm">{selectedReport.result?.recommendation}</p>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t text-xs text-gray-500 text-center">
                <strong>MEDICAL DISCLAIMER:</strong> This report is generated by an AI pre-screening tool and does NOT constitute a final medical diagnosis. Always consult a qualified healthcare professional.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
