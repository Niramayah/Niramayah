export interface RiskScoreResult {
  score: number;
  riskTier: string;
}

export interface AIResponse {
  risk_level: string;
  summary: string;
  key_risk_factors: string[];
  possible_conditions: string[];
  recommendation: string;
  urgency: string;
  confidence_score: number;
}

export class AIService {
  private provider: string;
  private ollamaUrl: string;
  private ollamaModel: string;

  constructor() {
    this.provider = process.env.AI_PROVIDER || 'ollama';
    this.ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
  }

  // 1. Rule-based scoring logic
  public calculateRuleBasedScore(formData: any): RiskScoreResult {
    let score = 0;

    // Age
    if (parseInt(formData.age) > 50) score += 2;
    
    // Lifestyle
    if (formData.smoking === 'yes') score += 2;
    if (formData.activity === 'low') score += 1;
    
    // History
    if (formData.hypertension === 'yes') score += 2;
    if (formData.diabetes === 'yes') score += 2;
    if (formData.family_history === 'yes') score += 2;

    // Symptoms
    if (formData.chestPain === 'yes') score += 4;
    if (formData.pain_radiate === 'yes') score += 4;
    if (formData.breathlessness === 'yes') score += 3;

    // Vitals (Basic checks)
    const bpSys = parseInt(formData.bp_sys);
    if (!isNaN(bpSys) && bpSys > 140) score += 2;

    let riskTier = "Low";
    if (score >= 16) riskTier = "Emergency";
    else if (score >= 10) riskTier = "High";
    else if (score >= 5) riskTier = "Moderate";

    return { score, riskTier };
  }

  // 2. Critical Emergency Rule
  public isCriticalEmergency(formData: any): boolean {
    return (
      formData.chestPain === 'yes' &&
      formData.breathlessness === 'yes' &&
      formData.sweating === 'yes'
    );
  }

  // 3. AI Processing
  public async analyzeRisk(formData: any, ruleScore: RiskScoreResult): Promise<AIResponse> {
    const prompt = `
You are a medical risk assessment assistant for NIRAMAYAH.
You DO NOT provide diagnosis. You ONLY provide risk assessment.

Analyze the structured patient data below and:
1. Determine risk level
2. Identify key contributing factors
3. Explain results in simple language
4. Suggest safe next steps
5. Warn clearly if emergency indicators are present

Patient Data:
${JSON.stringify(formData, null, 2)}

Rule-Based Preliminary Score: ${ruleScore.score} (Tier: ${ruleScore.riskTier})

Rules:
- Never say 'you have a disease'
- Always say 'possible risk' or 'indicators suggest'
- Be conservative and safe
- Prioritize user safety over accuracy

Return ONLY valid JSON with the following exact keys:
{
  "risk_level": "Low" | "Moderate" | "High" | "Emergency",
  "summary": "string",
  "key_risk_factors": ["string"],
  "possible_conditions": ["string"],
  "recommendation": "string",
  "urgency": "Normal" | "Attention Needed" | "Immediate Care",
  "confidence_score": number
}
`;

    if (this.provider === 'mock') {
      return this.analyzeWithMock();
    } else if (this.provider === 'ollama') {
      return this.analyzeWithOllama(prompt);
    } else {
      throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  private analyzeWithMock(): AIResponse {
    console.log(`[AI Mock] Returning successful demo result.`);
    return {
      "risk_level": "Moderate",
      "summary": "Based on the provided information, some possible risk indicators are present. This is not a diagnosis.",
      "key_risk_factors": ["Lifestyle factors", "Reported symptoms"],
      "possible_conditions": ["Possible cardiac risk indicators"],
      "recommendation": "Consult a qualified healthcare professional for proper evaluation.",
      "urgency": "Attention Needed",
      "confidence_score": 72
    };
  }

  private async analyzeWithOllama(prompt: string): Promise<AIResponse> {
    console.log(`[Ollama] Connecting to provider: ${this.provider} at ${this.ollamaUrl}/api/generate using model: ${this.ollamaModel}`);
    try {
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: prompt,
          stream: false,
          format: 'json', // Ollama supports JSON output forcing
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Ollama] Request successful.`);
      
      const parsedOutput = JSON.parse(data.response);
      
      // Basic validation
      if (!parsedOutput.risk_level || !parsedOutput.summary) {
        throw new Error("Invalid JSON structure from AI");
      }

      return parsedOutput as AIResponse;
    } catch (error: any) {
      console.error(`[Ollama Error] Request failed. Message: ${error.message}`);
      // Fallback response if AI fails (Return Unavailable, NOT High Risk)
      return {
        risk_level: "Unavailable",
        summary: "AI service is currently unavailable. Please try again later.",
        key_risk_factors: ["System Unavailable"],
        possible_conditions: ["Unknown"],
        recommendation: "Please try again later or consult a healthcare professional immediately if you have symptoms.",
        urgency: "Attention Needed",
        confidence_score: 0
      };
    }
  }
}

export const aiService = new AIService();
