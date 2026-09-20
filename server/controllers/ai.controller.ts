import { Request, Response } from 'express';
import { prisma } from '../index';
import { aiService, AIResponse } from '../services/ai.service';

export const processTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId; // Assuming auth middleware is used
    const { formData } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let aiResult: AIResponse;

    // 1. Critical Emergency Override
    if (aiService.isCriticalEmergency(formData)) {
      aiResult = {
        risk_level: "Emergency",
        summary: "⚠️ HIGH RISK: Possible cardiac emergency. Seek immediate medical help.",
        key_risk_factors: ["Chest Pain", "Breathlessness", "Excessive Sweating"],
        possible_conditions: ["Possible Myocardial Infarction (Heart Attack)"],
        recommendation: "CALL EMERGENCY SERVICES IMMEDIATELY (e.g., 911 / 112). DO NOT DRIVE YOURSELF TO THE HOSPITAL.",
        urgency: "Immediate Care",
        confidence_score: 98
      };
    } else {
      // 2. Rule-based Preliminary Scoring
      const ruleScore = aiService.calculateRuleBasedScore(formData);
      
      // 3. AI Processing
      aiResult = await aiService.analyzeRisk(formData, ruleScore);
    }

    // Deduct credits ONLY if AI result is NOT Unavailable
    if (aiResult.risk_level !== "Unavailable") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.credits < 50) {
        res.status(402).json({ error: 'Insufficient credits' });
        return;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { credits: user.credits - 50 },
      });

      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: 50,
          type: 'DEBIT',
          description: 'AI Cardiac Risk Assessment',
        }
      });
    }

    // Save test history
    const aiTest = await prisma.aiTest.create({
      data: {
        userId,
        inputData: formData,
        riskLevel: aiResult.risk_level,
        summary: aiResult.summary,
        keyRiskFactors: aiResult.key_risk_factors,
        possibleConditions: aiResult.possible_conditions,
        recommendation: aiResult.recommendation,
        urgency: aiResult.urgency,
        confidenceScore: aiResult.confidence_score
      }
    });

    res.json({
      testId: aiTest.id,
      ...aiResult
    });
  } catch (error) {
    console.error("AI processing error:", error);
    res.status(500).json({ error: 'Internal server error processing AI request' });
  }
};
