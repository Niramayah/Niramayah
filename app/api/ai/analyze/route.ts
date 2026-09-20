import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { calculateRiskScore, PatientData } from '@/lib/medical-scoring';

type AiDiagnosisResult = {
  risk_level: string;
  summary: string;
  key_risk_factors: string[];
  possible_conditions: string[];
  recommendation: string;
  urgency: string;
  confidence_score: number;
};

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formData, isTest, testSource, patientName, ai_interaction_log } = await req.json();

    // 1. Generate unique Patient Ref
    const patientRef = `NRM-${Math.floor(100000 + Math.random() * 900000)}`;

    // Debug Logs (Dev Only)
    if (process.env.NODE_ENV === 'development') {
      console.log('--- AI DIAGNOSIS ENGINE DEBUG ---');
      console.log('Input Payload:', JSON.stringify(formData, null, 2));
      console.log('Is Test:', isTest, 'Source:', testSource);
      console.log('Patient Identity:', patientName, patientRef);
      if (ai_interaction_log) console.log('Interaction Log:', ai_interaction_log.length, 'entries');
    }

    // 1. Initial Credit Check & Permission Check
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { permissions: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Permission check for test mode
    if (isTest) {
      const hasPermission = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || 
                           user.permissions.some(p => (p.permissionKey === 'aiManage' || p.permissionKey === 'aiTestAccess') && p.enabled);
      if (!hasPermission) {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions for test mode' }, { status: 403 });
      }
    }

    const baseCreditCost = 50;
    const skipDeduction = 
      isTest || 
      user.role === 'SUPER_ADMIN' || 
      user.role === 'ADMIN' || 
      (isTest && user.role === 'MODERATOR' && user.permissions.some(p => p.permissionKey === 'aiTestAccess' && p.enabled)) ||
      user.isUnlimitedCredits;

    if (!skipDeduction && user.credits < baseCreditCost) {
      return NextResponse.json({ 
        error: 'Insufficient credits. Please refill your credits to continue diagnosis.' 
      }, { status: 402 });
    }

    // 2. Deterministic Scoring Fallback/Base
    // Normalize formData to PatientData
    const normalizedData: PatientData = {
      age: formData.age || 0,
      gender: formData.gender || 'unknown',
      systolicBP: formData.bp_sys || 120,
      diastolicBP: formData.bp_dia || 80,
      heartRate: formData.heart_rate || 72,
      spo2: formData.spo2 || 0,
      hrv: formData.hrv || 0,
      chestPain: formData.chestPain === 'yes',
      painType: formData.pain_type || '',
      painRadiate: formData.pain_radiate || '',
      breathlessness: formData.breathlessness === 'yes',
      sweating: formData.sweating === 'yes',
      dizziness: formData.dizziness === 'yes',
      nausea: formData.nausea === 'yes',
      palpitations: formData.palpitations === 'yes',
      swelling: formData.swelling === 'yes',
      fatigue: formData.fatigue === 'yes',
      diabetes: formData.diabetes === 'yes',
      hypertension: formData.hypertension === 'yes',
      smoking: formData.smoking === 'yes' || formData.smoking === 'past',
      alcohol: formData.alcohol || 'never',
      stress: formData.stress ? (formData.stress.charAt(0).toUpperCase() + formData.stress.slice(1)) : 'Low',
      familyHistory: formData.family_history === 'yes',
      previousHeartAttack: formData.previous_attack === 'yes',
      activityLevel: formData.activity || 'moderate',
      knownDiagnosis: formData.known_diagnosis || ''
    };

    const medicalResult = calculateRiskScore(normalizedData);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('--- SCORING LOGIC DEBUG ---');
      console.log('Calculated Risk Score:', medicalResult.score);
      console.log('Determined Risk Level:', medicalResult.level);
      console.log('Risk Factors:', medicalResult.factors);
    }

    // 3. AI Provider Selection
    const provider = process.env.AI_PROVIDER || 'mock';
    let result: AiDiagnosisResult = {
      risk_level: medicalResult.level,
      summary: `[NIRAMAYAH AI] Based on precision clinical logic, the patient is at ${medicalResult.level} risk. Primary factors: ${medicalResult.factors.join(', ')}.`,
      key_risk_factors: medicalResult.factors.length > 0 ? medicalResult.factors : ["No critical factors identified"],
      possible_conditions: medicalResult.level === 'EMERGENCY' ? ["Acute Myocardial Infarction Suspected"] : ["Requires clinical investigation"],
      recommendation: medicalResult.level === 'EMERGENCY' ? "SEEK IMMEDIATE MEDICAL ATTENTION. CALL 102/108." : "Consult a healthcare provider for follow-up.",
      urgency: medicalResult.urgency,
      confidence_score: Math.round(medicalResult.confidence)
    };


    if (process.env.NODE_ENV === 'development') {
      console.log('Selected AI Provider:', provider);
    }

    if (provider === 'ollama') {
      try {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "llama3",
            prompt: `
              PATIENT CLINICAL DATA: ${JSON.stringify(normalizedData)}
              DETERMINISTIC RISK LEVEL: ${medicalResult.level}
              IDENTIFIED FACTORS: ${medicalResult.factors.join(', ')}

              TASK: Act as an expert cardiologist. Analyze this comprehensive health profile.
              The deterministic risk is ${medicalResult.level}. Use this as the baseline.
              Generate a high-accuracy clinical summary, evaluate specific risks (like radiating pain or vitals), and provide life-saving recommendations if needed.
              
              RETURN JSON ONLY: {
                "risk_level": "${medicalResult.level}",
                "summary": "...",
                "key_risk_factors": ["...", "..."],
                "possible_conditions": ["...", "..."],
                "recommendation": "...",
                "urgency": "${medicalResult.urgency}",
                "confidence_score": ${Math.round(medicalResult.confidence)}
              }
            `,
            stream: false,
            format: "json"
          }),
        });

        if (ollamaResponse.ok) {
          const data = await ollamaResponse.json();
          const aiData = JSON.parse(data.response) as AiDiagnosisResult;
          result = { ...aiData, risk_level: medicalResult.level }; // Ensure level doesn't drift
        }
      } catch (ollamaErr) {
        console.error("Ollama connection failed, using deterministic scoring:", ollamaErr);
      }
    } else if (provider === 'mock') {
      // Mock provider adds a bit more "AI-like" text but stays deterministic in values
      result.summary = `[MOCK AI] ${result.summary} This is a simulated assessment using high-fidelity medical rules.`;
    }

    // 3. Deduction & Record Creation (Only if not unavailable/error)
    if (result.risk_level === 'Unavailable') {
      return NextResponse.json(result);
    }

    const finalResult = await prisma.$transaction(async (tx) => {
      // Deduct credits
      let updatedCredits = user.credits;
      if (!skipDeduction) {
        const updated = await tx.user.update({
          where: { id: user.id },
          data: { credits: { decrement: baseCreditCost } }
        });
        updatedCredits = updated.credits;
      }

      // Create AiTest record
      const test = await tx.aiTest.create({
        data: {
          userId: user.id,
          patientName: patientName || null,
          patientRef: patientRef,
          inputData: formData,
          riskLevel: result.risk_level,
          summary: result.summary,
          keyRiskFactors: result.key_risk_factors,
          possibleConditions: result.possible_conditions,
          recommendation: result.recommendation,
          urgency: result.urgency,
          confidenceScore: result.confidence_score,
          isSaved: false,
          testSource: isTest ? (testSource || (user.role === 'MODERATOR' ? 'MODERATOR_TEST' : 'ADMIN_TEST')) : null,
          ai_interaction_log: ai_interaction_log || null
        }
      });

      // Notifications (Only for real users, maybe skip for tests if preferred, 
      // but the prompt says "it should behave like user interface" for preview)
      if (!isTest) {
        await tx.notification.create({
          data: {
            userId: user.id,
            title: "Assessment completed",
            message: "Your cardiac risk assessment report is ready.",
            type: "INFO"
          }
        });
      }

      // Record transaction and create Credit Deduction Notification
      if (!skipDeduction) {
        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            amount: baseCreditCost,
            type: 'DEBIT',
            description: `AI Diagnosis Assessment ${test.id}`
          }
        });

        await tx.notification.create({
          data: {
            userId: user.id,
            title: "Credits used",
            message: `${baseCreditCost} credits were deducted for your cardiac risk assessment.`,
            type: "CREDIT_DEBIT"
          }
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'DIAGNOSIS_SUCCESS',
            details: `Credits deducted: ${baseCreditCost}. Remaining: ${updatedCredits}.`
          }
        });
      } else {
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: isTest ? 'ADMIN_AI_TEST_COMPLETE' : 'DIAGNOSIS_SUCCESS',
            details: isTest 
              ? `Admin test completed successfully. Source: ${testSource || 'ADMIN_TEST'}`
              : `Unlimited/Admin access. No credits deducted.`
          }
        });
      }

      return { test, updatedCredits };
    });

    return NextResponse.json({
      ...result,
      assessmentId: finalResult.test.id,
      patientName: finalResult.test.patientName,
      patientRef: finalResult.test.patientRef,
      newCredits: finalResult.updatedCredits
    });

  } catch (error) {
    console.error("AI Analyze Error:", error);
    return NextResponse.json({
      risk_level: "Unavailable",
      summary: "AI service encountered an internal error. Credits will not be deducted.",
      key_risk_factors: ["Internal Error"],
      possible_conditions: ["Service Unavailable"],
      recommendation: "Please try again later.",
      urgency: "System Error",
      confidence_score: 0
    }, { status: 500 });
  }
}
