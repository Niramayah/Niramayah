export interface PatientData {
  age: string | number;
  gender: string;
  systolicBP: string | number;
  diastolicBP: string | number;
  heartRate: string | number;
  spo2: string | number;
  hrv?: string | number;
  chestPain: boolean;
  painType?: string;
  painRadiate?: string;
  breathlessness: boolean;
  sweating: boolean;
  dizziness: boolean;
  nausea: boolean;
  palpitations: boolean;
  swelling: boolean;
  fatigue: boolean;
  diabetes: boolean;
  hypertension: boolean;
  smoking: boolean;
  alcohol: string;
  stress: string;
  familyHistory: boolean;
  previousHeartAttack: boolean;
  activityLevel: string;
  knownDiagnosis?: string;
}

export interface RiskOutput {
  score: number;
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY';
  urgency: string;
  confidence: number;
  factors: string[];
}

export function calculateRiskScore(data: PatientData): RiskOutput {
  let score = 0;
  const factors: string[] = [];

  // Age factor
  const age = Number(data.age);
  if (age > 65) score += 3;
  else if (age > 45) score += 1;

  // Blood Pressure
  const sys = Number(data.systolicBP);
  const dia = Number(data.diastolicBP);
  if (sys >= 180 || dia >= 120) {
    score += 10; // Crisis
    factors.push("Hypertensive Crisis Levels");
  } else if (sys >= 140 || dia >= 90) {
    score += 4;
    factors.push("High Blood Pressure (Stage 2)");
  } else if (sys >= 130 || dia >= 80) {
    score += 2;
    factors.push("Elevated Blood Pressure");
  }

  // Vitals
  const hr = Number(data.heartRate);
  if (hr > 120 || hr < 45) {
    score += 4;
    factors.push("Abnormal Heart Rate (Tachycardia/Bradycardia)");
  }

  const spo2 = Number(data.spo2);
  if (spo2 > 0) { // Only if provided
    if (spo2 < 90) {
      score += 6;
      factors.push("Critical Oxygen Saturation (Hypoxia)");
    } else if (spo2 < 94) {
      score += 2;
      factors.push("Low Oxygen Saturation");
    }
  }

  const hrv = Number(data.hrv);
  if (hrv > 0 && hrv < 40) {
    score += 2;
    factors.push("Low Heart Rate Variability (HRV)");
  }

  // Symptoms (Heavy Weight)
  if (data.chestPain) {
    score += 8;
    factors.push("Active Chest Pain");
    
    if (data.painType === 'crushing' || data.painType === 'pressure') {
      score += 2;
      factors.push(`Pain type: ${data.painType}`);
    }
    
    if (['left_arm', 'jaw', 'back', 'shoulder'].includes(data.painRadiate || '')) {
      score += 3;
      factors.push(`Pain radiating to ${data.painRadiate}`);
    }
  }
  
  if (data.breathlessness) {
    score += 6;
    factors.push("Shortness of Breath");
  }
  if (data.sweating) {
    score += 4;
    factors.push("Excessive Cold Sweating");
  }
  if (data.dizziness) {
    score += 3;
    factors.push("Severe Dizziness/Lightheadedness");
  }
  if (data.nausea) {
    score += 2;
    factors.push("Nausea or Vomiting");
  }
  if (data.palpitations) {
    score += 2;
    factors.push("Heart Palpitations");
  }
  if (data.swelling) {
    score += 2;
    factors.push("Leg or Ankle Swelling (Edema)");
  }
  if (data.fatigue) {
    score += 1;
    factors.push("Unusual Fatigue/Weakness");
  }

  // History
  if (data.previousHeartAttack) {
    score += 8;
    factors.push("History of Myocardial Infarction");
  }
  if (data.diabetes) {
    score += 3;
    factors.push("Diabetic Comorbidity");
  }
  if (data.hypertension) {
    score += 2;
    factors.push("Pre-existing Hypertension");
  }
  if (data.familyHistory) {
    score += 2;
    factors.push("Strong Cardiac Family History");
  }
  if (data.knownDiagnosis && data.knownDiagnosis.trim().length > 0) {
    score += 2;
    factors.push(`Known condition: ${data.knownDiagnosis}`);
  }

  // Lifestyle
  if (data.smoking) {
    score += 2;
    factors.push("Active Smoking Habit");
  }
  if (data.alcohol === 'heavy' || data.alcohol === 'regularly') {
    score += 1;
    factors.push(`Alcohol use: ${data.alcohol}`);
  }
  if (data.stress === 'High' || data.stress === 'high') {
    score += 2;
    factors.push("High Chronic Stress Levels");
  }
  if (data.activityLevel === 'low') {
    score += 2;
    factors.push("Sedentary Lifestyle");
  }

  // Final Level Determination
  let level: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY' = 'LOW';
  let urgency = "Routine";
  
  // Synergy check for Emergency (More robust check)
  const isEmergencyPain = data.painType === 'crushing' || 
                          ['left_arm', 'jaw'].includes(data.painRadiate || '');
  
  if (data.chestPain && (data.sweating || data.breathlessness) && isEmergencyPain) {
    score += 5;
  }

  if (score >= 20 || (data.chestPain && (data.previousHeartAttack || data.sweating || data.breathlessness) && score > 15)) {
    level = 'EMERGENCY';
    urgency = "IMMEDIATE CRITICAL CARE";
  } else if (score >= 12) {
    level = 'HIGH';
    urgency = "Urgent Medical Consult";
  } else if (score >= 5) {
    level = 'MODERATE';
    urgency = "Attention Recommended";
  }

  // Adjust confidence based on input count
  const fields = Object.keys(data);
  const filledFields = fields.filter(k => {
    const val = (data as any)[k];
    return val !== '' && val !== null && val !== undefined && val !== false;
  }).length;
  
  const confidence = Math.min(98, Math.max(70, (filledFields / fields.length) * 100));

  return { score, level, urgency, confidence, factors };
}

