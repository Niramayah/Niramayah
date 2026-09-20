"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, CheckCircle2, AlertTriangle, Download, Loader2 } from "lucide-react";
import { generateReportPdf } from "@/lib/report-utils";
import { useAuth } from "@/components/auth/AuthContext";
import Link from "next/link";

interface AssessmentResult {
  risk_level: string;
  summary: string;
  key_risk_factors: string[];
  possible_conditions: string[];
  recommendation: string;
  urgency: string;
  confidence_score: number;
  assessmentId?: string;
  newCredits?: number;
  patientName?: string;
  patientRef?: string;
}

interface AssessmentFormProps {
  isTest?: boolean;
  testSource?: string;
}

export function AssessmentForm({ isTest = false, testSource }: AssessmentFormProps) {
  const { user, updateCredits } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({
    patientName: '',
    age: '', gender: '', height: '', weight: '',
    bp_sys: '', bp_dia: '', heart_rate: '', blood_sugar: '',
    smoking: '', alcohol: '', activity: '', stress: '',
    family_history: 'no', diabetes: 'no', hypertension: 'no', previous_attack: 'no',
    chestPain: 'no', breathlessness: 'no', palpitations: 'no', sweating: 'no', dizziness: 'no', nausea: 'no',
    swelling: 'no', fatigue: 'no',
    pain_type: '', pain_radiate: '', 
    ecg_available: 'no', hrv: '', spo2: '', known_diagnosis: '',
    consent: false,
    bmi: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const totalSteps = 6;

  // Test Case Injection Logic
  useEffect(() => {
    const handleLoadTest = (e: any) => {
      const level = e.detail;
      let testData = {};

      if (level === 'LOW') {
        testData = {
          age: '28', gender: 'male', height: '175', weight: '70',
          bp_sys: '118', bp_dia: '78', heart_rate: '68', blood_sugar: '90',
          smoking: 'no', alcohol: 'never', activity: 'high', stress: 'low',
          family_history: 'no', diabetes: 'no', hypertension: 'no', previous_attack: 'no',
          chestPain: 'no', breathlessness: 'no', palpitations: 'no', sweating: 'no', dizziness: 'no',
          swelling: 'no', fatigue: 'no',
          ecg_available: 'no', hrv: '', spo2: '98', known_diagnosis: '',
          consent: true
        };
      } else if (level === 'MODERATE') {
        testData = {
          age: '48', gender: 'female', height: '162', weight: '78',
          bp_sys: '142', bp_dia: '92', heart_rate: '82', blood_sugar: '110',
          smoking: 'past', alcohol: 'occasionally', activity: 'moderate', stress: 'medium',
          family_history: 'yes', diabetes: 'no', hypertension: 'yes', previous_attack: 'no',
          chestPain: 'no', breathlessness: 'no', palpitations: 'yes', sweating: 'no', dizziness: 'no',
          swelling: 'no', fatigue: 'yes',
          ecg_available: 'no', hrv: '55', spo2: '96', known_diagnosis: '',
          consent: true
        };
      } else if (level === 'HIGH') {
        testData = {
          age: '62', gender: 'male', height: '180', weight: '95',
          bp_sys: '165', bp_dia: '105', heart_rate: '94', blood_sugar: '180',
          smoking: 'yes', alcohol: 'regularly', activity: 'low', stress: 'high',
          family_history: 'yes', diabetes: 'yes', hypertension: 'yes', previous_attack: 'no',
          chestPain: 'yes', breathlessness: 'yes', palpitations: 'yes', sweating: 'no', dizziness: 'no',
          swelling: 'yes', fatigue: 'yes',
          pain_type: 'pressure', pain_radiate: 'shoulder',
          ecg_available: 'yes', hrv: '35', spo2: '93', known_diagnosis: 'Mild Angina',
          consent: true
        };
      } else if (level === 'EMERGENCY') {
        testData = {
          age: '68', gender: 'male', height: '170', weight: '85',
          bp_sys: '190', bp_dia: '115', heart_rate: '110', blood_sugar: '210',
          smoking: 'yes', alcohol: 'heavy', activity: 'low', stress: 'high',
          family_history: 'yes', diabetes: 'yes', hypertension: 'yes', previous_attack: 'yes',
          chestPain: 'yes', breathlessness: 'yes', palpitations: 'yes', sweating: 'yes', dizziness: 'yes',
          swelling: 'yes', fatigue: 'yes',
          pain_type: 'crushing', pain_radiate: 'left_arm',
          ecg_available: 'yes', hrv: '22', spo2: '88', known_diagnosis: 'Coronary Artery Disease',
          consent: true
        };
      }

      setFormData(prev => ({ ...prev, ...testData }));
      setStep(1);
    };

    window.addEventListener('loadTestCase', handleLoadTest);
    return () => window.removeEventListener('loadTestCase', handleLoadTest);
  }, []);

  const handleNext = () => {
    if (step === 1 && !formData.patientName?.trim()) {
      alert("Please enter patient name.");
      return;
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const captureInteractionLog = () => {
    const log: { question: string; answer: string }[] = [];
    
    // Mapping of field IDs to Question Texts
    const mapping: Record<string, string> = {
      patientName: "Patient Name",
      age: "Age",
      gender: "Gender",
      height: "Height (cm)",
      weight: "Weight (kg)",
      bp_sys: "Systolic Blood Pressure",
      bp_dia: "Diastolic Blood Pressure",
      heart_rate: "Resting Heart Rate (bpm)",
      blood_sugar: "Blood Sugar (mg/dL)",
      smoking: "Smoking Status",
      alcohol: "Alcohol Consumption",
      activity: "Physical Activity Level",
      stress: "Stress Level",
      family_history: "Family history of heart disease?",
      diabetes: "Diagnosed with Diabetes?",
      hypertension: "Diagnosed with Hypertension?",
      previous_attack: "Previous heart attack or stroke?",
      chestPain: "Are you experiencing Chest Pain?",
      breathlessness: "Are you experiencing Shortness of Breath?",
      palpitations: "Are you feeling Palpitations?",
      sweating: "Are you experiencing Excessive Sweating?",
      dizziness: "Are you experiencing Dizziness or Fainting?",
      swelling: "Are you experiencing Leg or Ankle Swelling?",
      fatigue: "Are you experiencing Unusual Fatigue?",
      pain_type: "Chest Pain Type",
      pain_radiate: "Chest Pain Radiation",
      ecg_available: "Recent ECG Available?",
      hrv: "Heart Rate Variability (HRV)",
      spo2: "Blood Oxygen (SpO2)",
      known_diagnosis: "Known Medical Diagnosis"
    };

    Object.entries(formData).forEach(([key, value]) => {
      if (mapping[key] && value !== undefined && value !== '') {
        let displayValue = value;
        if (value === 'yes') displayValue = 'Yes';
        if (value === 'no') displayValue = 'No';
        log.push({ question: mapping[key], answer: String(displayValue) });
      }
    });

    return log;
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const refreshNotifications = () => {
    window.dispatchEvent(new Event('refreshNotifications'));
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("You must be logged in to perform an AI assessment.");
      return;
    }

    setIsSubmitting(true);
    
    const interactionLog = captureInteractionLog();
    
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formData,
          patientName: formData.patientName,
          isTest,
          testSource: testSource || (user.role === 'MODERATOR' ? 'MODERATOR_TEST' : 'ADMIN_TEST'),
          ai_interaction_log: interactionLog
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
           alert("Insufficient credits. Please refill your credits to continue diagnosis.");
           return;
        }
        throw new Error(data.error || `Failed to process AI assessment.`);
      }

      setResult(data);
      setIsSaved(false);
      
      // Update credits immediately after successful analysis
      if (data.newCredits !== undefined) {
        updateCredits(data.newCredits);
      }

      // Trigger notification refresh
      refreshNotifications();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'AI service is currently unavailable';
      console.error("Frontend AI Connection Error:", error);
      setResult({
        risk_level: "Unavailable",
        summary: errorMessage + ". Credits were not deducted.",
        key_risk_factors: ["Service Unavailable"],
        possible_conditions: ["Service Unavailable"],
        recommendation: "Please try again later or consult a doctor if symptoms are severe.",
        urgency: "Attention Needed",
        confidence_score: 0
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveHistory = async () => {
    if (isSaved || !result?.assessmentId) return;
    
    try {
      const res = await fetch('/api/ai/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: result.assessmentId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save assessment');
      }

      setIsSaved(true);
      alert("Assessment saved to history successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save to history';
      console.error(err);
      alert(errorMessage);
    }
  };

  const handleSaveReport = async () => {
    if (isSaved) return;
    setIsSaving(true);
    
    const payload = {
      type: testSource || 'MODERATOR_TEST',
      patientName: formData.patientName,
      patientRef: result.patientRef || `NRM-${Date.now().toString().slice(-6)}`,
      riskLevel: result.risk_level,
      summary: result.summary,
      keyFactors: result.key_risk_factors,
      possibleConditions: result.possible_conditions,
      recommendations: result.recommendation,
      inputData: formData,
      result: result,
      ai_interaction_log: result.ai_interaction_log || captureInteractionLog()
    };

    console.log("[AssessmentForm] Saving report payload:", payload);

    try {
      const res = await fetch('/api/moderator/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("[AssessmentForm] Save response:", data);

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to save report');
      }

      setIsSaved(true);
      alert("Report saved successfully to archive!");
    } catch (err: any) {
      console.error("[AssessmentForm] Save error:", err);
      alert(err.message || "Failed to save report. Please check server logs.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    
    generateReportPdf({
      patientName: result.patientName || formData.patientName || 'Patient',
      patientRef: result.patientRef || `NRM-${Date.now().toString().slice(-6)}`,
      date: new Date(),
      riskLevel: result.risk_level,
      summary: result.summary,
      urgency: result.urgency,
      confidenceScore: result.confidence_score,
      keyRiskFactors: result.key_risk_factors,
      possibleConditions: result.possible_conditions,
      recommendation: result.recommendation,
      inputData: formData,
      ai_interaction_log: result.ai_interaction_log || captureInteractionLog()
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Render Form Steps
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-niramayah-navy border-b pb-2">Step 1: Basic Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-niramayah-gray">Patient Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="Enter full name"
                  className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" 
                  onChange={(e) => handleChange('patientName', e.target.value)} 
                  value={formData.patientName || ''} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Age</label>
                <input type="number" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('age', e.target.value)} value={formData.age || ''} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Gender</label>
                <select className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('gender', e.target.value)} value={formData.gender || ''}>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Height (cm)</label>
                <input type="number" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('height', e.target.value)} value={formData.height || ''} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Weight (kg)</label>
                <input type="number" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('weight', e.target.value)} value={formData.weight || ''} />
              </div>
              {formData.height && formData.weight && (
                <div className="md:col-span-2 p-3 bg-niramayah-navy/5 rounded-md border border-niramayah-navy/10 flex justify-between items-center">
                  <span className="text-sm font-medium text-niramayah-navy">Calculated BMI:</span>
                  <span className="text-lg font-bold text-niramayah-green">
                    {(Number(formData.weight) / ((Number(formData.height) / 100) ** 2)).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-niramayah-navy border-b pb-2">Step 2: Vital Signs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Systolic Blood Pressure</label>
                <input type="number" placeholder="e.g. 120" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('bp_sys', e.target.value)} value={formData.bp_sys || ''} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Diastolic Blood Pressure</label>
                <input type="number" placeholder="e.g. 80" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('bp_dia', e.target.value)} value={formData.bp_dia || ''} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Resting Heart Rate (bpm)</label>
                <input type="number" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('heart_rate', e.target.value)} value={formData.heart_rate || ''} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Blood Sugar (optional mg/dL)</label>
                <input type="number" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('blood_sugar', e.target.value)} value={formData.blood_sugar || ''} />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-niramayah-navy border-b pb-2">Step 3: Lifestyle Factors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Smoking Status</label>
                <select className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('smoking', e.target.value)} value={formData.smoking || ''}>
                  <option value="">Select...</option>
                  <option value="no">Never smoked</option>
                  <option value="past">Past smoker</option>
                  <option value="yes">Current smoker</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Alcohol Consumption</label>
                <select className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('alcohol', e.target.value)} value={formData.alcohol || ''}>
                  <option value="">Select...</option>
                  <option value="never">Never</option>
                  <option value="occasionally">Occasionally</option>
                  <option value="regularly">Regularly</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Physical Activity Level</label>
                <select className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('activity', e.target.value)} value={formData.activity || ''}>
                  <option value="">Select...</option>
                  <option value="low">Low (Sedentary)</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High (Active)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-niramayah-gray">Stress Level</label>
                <select className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('stress', e.target.value)} value={formData.stress || ''}>
                  <option value="">Select...</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-niramayah-navy border-b pb-2">Step 4: Medical History</h3>
            <div className="space-y-4">
              {[
                { id: 'family_history', label: 'Family history of heart disease?' },
                { id: 'diabetes', label: 'Diagnosed with Diabetes?' },
                { id: 'hypertension', label: 'Diagnosed with Hypertension?' },
                { id: 'previous_attack', label: 'Previous heart attack or stroke?' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="text-sm font-medium text-niramayah-navy">{item.label}</span>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name={item.id} value="yes" checked={formData[item.id] === 'yes'} onChange={(e) => handleChange(item.id, e.target.value)} className="accent-niramayah-green" />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name={item.id} value="no" checked={formData[item.id] === 'no'} onChange={(e) => handleChange(item.id, e.target.value)} className="accent-niramayah-green" />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-niramayah-navy border-b pb-2">Step 5: Current Symptoms <span className="text-red-500">*</span></h3>
            <div className="space-y-4">
              {[
                { id: 'chestPain', label: 'Are you experiencing Chest Pain?' },
                { id: 'breathlessness', label: 'Are you experiencing Shortness of Breath?' },
                { id: 'palpitations', label: 'Are you feeling Palpitations (irregular heartbeat)?' },
                { id: 'sweating', label: 'Are you experiencing Excessive Sweating?' },
                { id: 'dizziness', label: 'Are you experiencing Dizziness or Fainting?' },
                { id: 'nausea', label: 'Are you experiencing Nausea or Vomiting?' },
                { id: 'swelling', label: 'Are you experiencing Leg or Ankle Swelling?' },
                { id: 'fatigue', label: 'Are you experiencing Unusual Fatigue or Weakness?' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="text-sm font-medium text-niramayah-navy">{item.label}</span>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name={item.id} value="yes" checked={formData[item.id] === 'yes'} onChange={(e) => handleChange(item.id, e.target.value)} className="accent-red-500" />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name={item.id} value="no" checked={formData[item.id] === 'no'} onChange={(e) => handleChange(item.id, e.target.value)} className="accent-niramayah-green" />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>
              ))}
              
              {formData.chestPain === 'yes' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-md space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-semibold text-niramayah-navy text-sm">Chest Pain Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-niramayah-gray">Pain Type</label>
                      <select className="w-full h-8 px-2 text-sm rounded-md border border-gray-300" onChange={(e) => handleChange('pain_type', e.target.value)} value={formData.pain_type || ''}>
                        <option value="">Select...</option>
                        <option value="sharp">Sharp / Stabbing</option>
                        <option value="dull">Dull / Aching</option>
                        <option value="pressure">Pressure / Squeezing</option>
                        <option value="burning">Burning</option>
                        <option value="crushing">Crushing / Heavy</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-niramayah-gray">Pain Radiates to?</label>
                      <select className="w-full h-8 px-2 text-sm rounded-md border border-gray-300" onChange={(e) => handleChange('pain_radiate', e.target.value)} value={formData.pain_radiate || ''}>
                        <option value="">Select...</option>
                        <option value="no">No radiation</option>
                        <option value="left_arm">Left Arm</option>
                        <option value="right_arm">Right Arm</option>
                        <option value="jaw">Jaw / Teeth</option>
                        <option value="back">Back</option>
                        <option value="shoulder">Shoulder</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-niramayah-navy border-b pb-2">Step 6: Advanced & Optional</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-niramayah-gray">Recent ECG Available?</label>
                  <select className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('ecg_available', e.target.value)} value={formData.ecg_available || 'no'}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-niramayah-gray">Heart Rate Variability (HRV) - if known</label>
                  <input type="number" placeholder="ms" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('hrv', e.target.value)} value={formData.hrv || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-niramayah-gray">Blood Oxygen (SpO2) - if known</label>
                  <input type="number" placeholder="%" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('spo2', e.target.value)} value={formData.spo2 || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-niramayah-gray">Known Medical Diagnosis (if any)</label>
                  <input type="text" placeholder="e.g. Heart Murmur, Arrhythmia" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-niramayah-green" onChange={(e) => handleChange('known_diagnosis', e.target.value)} value={formData.known_diagnosis || ''} />
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gray-50 border rounded-xl shadow-sm">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="mt-1 accent-niramayah-green w-4 h-4 rounded border-gray-300 focus:ring-niramayah-green" 
                    required 
                    checked={Boolean(formData.consent)} 
                    onChange={(e) => handleChange('consent', e.target.checked)} 
                  />
                  <span className="text-sm text-niramayah-gray leading-relaxed group-hover:text-niramayah-navy transition-colors">
                    <strong>I consent</strong> to the processing of my health data for the purpose of this risk assessment. I understand that this tool provides AI-assisted screening only and does NOT constitute a medical diagnosis.
                  </span>
                </label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Render Result view
  if (result) {
    const isEmergency = result.risk_level.toUpperCase() === "EMERGENCY";
    const isHigh = result.risk_level.toUpperCase() === "HIGH";
    const isModerate = result.risk_level.toUpperCase() === "MODERATE";
    
    let headerColor = "bg-niramayah-green";
    let textColor = "text-niramayah-green";
    
    if (isEmergency) {
      headerColor = "bg-red-600";
      textColor = "text-red-600";
    } else if (isHigh) {
      headerColor = "bg-orange-500";
      textColor = "text-orange-500";
    } else if (isModerate) {
      headerColor = "bg-yellow-500";
      textColor = "text-yellow-600";
    }

    return (
      <Card className="w-full shadow-lg border-0 overflow-hidden">
        <div className={`h-3 w-full ${headerColor}`}></div>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {isEmergency || isHigh ? (
              <AlertTriangle className={`h-16 w-16 ${textColor}`} />
            ) : (
              <CheckCircle2 className={`h-16 w-16 ${textColor}`} />
            )}
          </div>
          <CardTitle className="text-2xl font-serif text-niramayah-navy">Risk Assessment Report</CardTitle>
          <div className="mt-4 inline-block px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider" style={{ borderColor: isEmergency ? 'red' : isHigh ? 'orange' : isModerate ? '#eab308' : '#008060', color: isEmergency ? 'red' : isHigh ? 'orange' : isModerate ? '#ca8a04' : '#008060', backgroundColor: isEmergency ? '#fef2f2' : isHigh ? '#fff7ed' : isModerate ? '#fefce8' : '#f0fdf4' }}>
            {result.risk_level} RISK
          </div>
          {result.patientName && (
            <div className="mt-2 text-sm text-slate-500">
              Patient: <span className="font-bold text-slate-700">{result.patientName}</span> | Ref: <span className="font-mono">{result.patientRef}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="p-4 rounded-lg bg-gray-50 border text-niramayah-gray text-sm leading-relaxed">
            {result.summary}
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-niramayah-navy border-b pb-2 mb-3">Key Risk Factors</h4>
              <ul className="space-y-2">
                {result.key_risk_factors.map((factor: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-niramayah-gray">
                    <span className="mr-2 text-niramayah-orange">•</span> {factor}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-niramayah-navy border-b pb-2 mb-3">Possible Conditions</h4>
              <ul className="space-y-2">
                {result.possible_conditions.map((cond: string, i: number) => (
                  <li key={i} className="flex items-start text-sm text-niramayah-gray">
                    <span className="mr-2 text-niramayah-orange">•</span> {cond}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border border-niramayah-navy/10 bg-niramayah-navy/5">
            <h4 className="font-semibold text-niramayah-navy mb-2">Recommendation & Next Steps</h4>
            <p className="text-sm text-niramayah-navy/80">{result.recommendation}</p>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t">
            <span>Urgency: <strong className={textColor}>{result.urgency}</strong></span>
            <span>AI Confidence Score: {result.confidence_score}%</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between bg-gray-50 p-6 gap-4">
          <Button variant="outline" onClick={() => { setResult(null); setStep(1); setFormData({ patientName: '' }); setIsSaved(false); }} className="rounded-xl">
            Start Over
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            {isTest ? (
              <>
                <Button 
                  variant="outline" 
                  className="border-purple-600 text-purple-600 hover:bg-purple-50 rounded-xl" 
                  onClick={handleSaveReport}
                  disabled={isSaved || isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isSaved ? "Saved to Archive" : "Save Report"}
                </Button>
                <Button variant="ghost" asChild className="text-slate-500 hover:text-slate-900 text-xs">
                  <Link href="/moderator/reports">View Saved Reports</Link>
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                className="border-niramayah-green text-niramayah-green rounded-xl" 
                onClick={handleSaveHistory}
                disabled={isSaved}
              >
                <Save className="h-4 w-4 mr-2" /> {isSaved ? "Saved" : "Save to History"}
              </Button>
            )}
            <Button className="bg-niramayah-green hover:bg-niramayah-green/90 text-white rounded-xl shadow-lg" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-0">
      {isTest && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <AlertTriangle className="h-3 w-3" />
          AI Test Mode - Credits will not be deducted
        </div>
      )}
      <CardHeader className="bg-gray-50 border-b">
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-xl font-serif text-niramayah-navy">Screening Progress</CardTitle>
          <span className="text-sm font-medium text-niramayah-green">Step {step} of {totalSteps}</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-niramayah-green h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-8 pb-8 min-h-[400px]">
        {renderStepContent()}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-6 bg-gray-50">
        <Button 
          variant="outline" 
          onClick={handlePrev} 
          disabled={step === 1 || isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        
        {step < totalSteps ? (
          <Button 
            className="bg-niramayah-green hover:bg-niramayah-green/90 text-white" 
            onClick={handleNext}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            className="bg-niramayah-orange hover:bg-niramayah-orange/90 text-white" 
            onClick={handleSubmit}
            disabled={!formData.consent || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Submit for AI Assessment"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
