"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Loader2, AlertTriangle, CheckCircle2, ClipboardList, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateReportPdf } from "@/lib/report-utils";

function ReportViewer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/moderator/reports/${id}`);
        const data = await res.json();
        if (data.report) setReport(data.report);
      } catch (err) {
        console.error("Failed to fetch report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading report data...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-900">Report Not Found</h2>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const { result, inputData } = report;
  const isEmergency = result.risk_level === "Emergency";
  const isHigh = result.risk_level === "High";
  const isModerate = result.risk_level === "Moderate";
  
  const textColor = isEmergency ? 'text-red-600' : isHigh ? 'text-orange-600' : isModerate ? 'text-amber-600' : 'text-emerald-600';
  const borderColor = isEmergency ? 'border-red-200' : isHigh ? 'border-orange-200' : isModerate ? 'border-amber-200' : 'border-emerald-200';
  const bgColor = isEmergency ? 'bg-red-50' : isHigh ? 'bg-orange-50' : isModerate ? 'bg-amber-50' : 'bg-emerald-50';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Reports
        </Button>
        <Button 
          className="bg-niramayah-green hover:bg-niramayah-green/90 text-white rounded-xl shadow-md"
          onClick={() => {
            generateReportPdf({
              patientName: inputData.patientName || 'Patient',
              patientRef: report.patientRef || `NRM-${report.id.slice(-6)}`,
              date: report.createdAt,
              riskLevel: result.risk_level,
              summary: result.summary,
              urgency: result.urgency,
              confidenceScore: result.confidence_score,
              keyRiskFactors: result.key_risk_factors,
              possibleConditions: result.possible_conditions,
              recommendation: result.recommendation,
              inputData: inputData,
              ai_interaction_log: report.ai_interaction_log || []
            });
          }}
        >
          <Download className="h-4 w-4 mr-2" /> Download PDF
        </Button>
      </div>

      <Card className="shadow-2xl border-0 overflow-hidden bg-white rounded-3xl">
        <div className={`h-2 w-full ${isEmergency ? 'bg-red-600' : isHigh ? 'bg-orange-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            {isEmergency || isHigh ? (
              <AlertTriangle className={`h-16 w-16 ${textColor}`} />
            ) : (
              <CheckCircle2 className={`h-16 w-16 ${textColor}`} />
            )}
          </div>
          <CardTitle className="text-3xl font-serif text-slate-900">Diagnostic Summary</CardTitle>
          <div className={`mt-4 inline-block px-6 py-2 rounded-full border-2 text-sm font-black uppercase tracking-[0.2em] ${textColor} ${borderColor} ${bgColor}`}>
            {result.risk_level} RISK
          </div>
          <div className="mt-4 text-slate-500 font-medium">
            Patient: <span className="text-slate-900 font-bold">{inputData.patientName}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-10 px-8">
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-slate-600 text-sm leading-relaxed shadow-inner">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Summary</h4>
            {result.summary}
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                Key Risk Factors
              </h4>
              <ul className="space-y-2">
                {result.key_risk_factors.map((factor: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                Possible Conditions
              </h4>
              <ul className="space-y-2">
                {result.possible_conditions.map((cond: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {cond}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className={`p-8 rounded-3xl border-2 ${borderColor} ${bgColor} relative overflow-hidden group`}>
            <div className="relative z-10">
              <h4 className={`font-black text-xs uppercase tracking-widest mb-4 ${textColor}`}>Clinical Recommendation</h4>
              <p className="text-base font-bold text-slate-900 leading-relaxed">{result.recommendation}</p>
            </div>
          
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-100">
            <h3 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              Detailed Patient Health Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <InfoSection title="A. Basic Profile" items={[
                { label: "Age", value: inputData.age ? `${inputData.age} yrs` : null },
                { label: "Gender", value: inputData.gender },
                { label: "Height", value: inputData.height ? `${inputData.height} cm` : null },
                { label: "Weight", value: inputData.weight ? `${inputData.weight} kg` : null }
              ]} />

              <InfoSection title="B. Vital Signs" items={[
                { label: "Systolic BP", value: inputData.bp_sys ? `${inputData.bp_sys} mmHg` : null },
                { label: "Diastolic BP", value: inputData.bp_dia ? `${inputData.bp_dia} mmHg` : null },
                { label: "Heart Rate", value: inputData.heart_rate ? `${inputData.heart_rate} bpm` : null },
                { label: "Blood Sugar", value: inputData.blood_sugar ? `${inputData.blood_sugar} mg/dL` : null }
              ]} />

              <InfoSection title="C. Lifestyle Factors" items={[
                { label: "Smoking", value: inputData.smoking },
                { label: "Activity", value: inputData.activity },
                { label: "Stress", value: inputData.stress },
                { label: "Alcohol", value: inputData.alcohol }
              ]} />

              <InfoSection title="D. Medical History" items={[
                { label: "Family History", value: inputData.family_history },
                { label: "Diabetes", value: inputData.diabetes },
                { label: "Hypertension", value: inputData.hypertension },
                { label: "Prev. Attack", value: inputData.previous_attack }
              ]} />

              <div className="col-span-2">
                <InfoSection title="E. Current Symptoms" items={[
                  { label: "Chest Pain", value: inputData.chestPain },
                  { label: "Pain Type", value: inputData.pain_type },
                  { label: "Pain Radiates", value: inputData.pain_radiate },
                  { label: "Breathlessness", value: inputData.breathlessness },
                  { label: "Palpitations", value: inputData.palpitations },
                  { label: "Dizziness", value: inputData.dizziness },
                  { label: "Swelling", value: inputData.swelling },
                  { label: "Fatigue", value: inputData.fatigue },
                  { label: "Sweating", value: inputData.sweating }
                ]} gridCols={3} />
              </div>

              <div className="col-span-2">
                <InfoSection title="F. Advanced & Optional" items={[
                  { label: "ECG Available", value: inputData.ecg_available },
                  { label: "HRV", value: inputData.hrv },
                  { label: "SpO2", value: inputData.spo2 ? `${inputData.spo2}%` : null },
                  { label: "Known Diagnosis", value: inputData.known_diagnosis }
                ]} gridCols={3} />
              </div>
            </div>

            {inputData.known_diagnosis && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Known Diagnosis / Clinical Notes</h4>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{inputData.known_diagnosis}</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-8 border-t border-slate-100">
            <span>Urgency: <strong className={textColor}>{result.urgency}</strong></span>
            <span>AI Confidence: {result.confidence_score}%</span>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-8 flex justify-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center max-w-md">
            This report was generated for testing purposes and should not be used as a final medical diagnosis.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

function InfoSection({ title, items, gridCols = 2 }: { title: string, items: { label: string, value: any }[], gridCols?: number }) {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h4>
      <div className={`grid grid-cols-1 sm:grid-cols-${gridCols} gap-4`}>
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
            <span className="text-sm font-bold text-slate-900">{item.value || "Not Provided"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ViewReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <ReportViewer />
    </Suspense>
  );
}
