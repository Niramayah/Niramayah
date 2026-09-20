import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const session = await requirePermission('aiTestAccess');
    
    console.log(`[GET /api/moderator/reports] Fetching for user: ${session.userId}`);

    // @ts-ignore - Handle cases where Prisma client is not yet regenerated
    const reports = await prisma.savedReport.findMany({
      where: {
        userId: session.userId,
        type: 'MODERATOR_TEST'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    console.log(`[GET /api/moderator/reports] Found ${reports.length} reports`);
    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("[GET_REPORTS_ERROR]", error);
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission('aiTestAccess');
    const body = await req.json();
    
    console.log("[POST /api/moderator/reports] Payload:", JSON.stringify(body, null, 2));

    const { 
      type, 
      inputData, 
      result,
      patientName,
      patientRef,
      riskLevel,
      summary,
      keyFactors,
      possibleConditions,
      recommendations,
      ai_interaction_log
    } = body;

    if (!inputData || !result) {
      console.error("[POST /api/moderator/reports] Missing required fields");
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // @ts-ignore - Handle cases where Prisma client is not yet regenerated
    const report = await prisma.savedReport.create({
      data: {
        userId: session.userId,
        type: type || 'MODERATOR_TEST',
        patientName: patientName || inputData.patientName,
        patientRef: patientRef || result.patientRef || `NRM-${Date.now().toString().slice(-6)}`,
        riskLevel: riskLevel || result.risk_level,
        summary: summary || result.summary,
        keyFactors: keyFactors || result.key_risk_factors,
        possibleConditions: possibleConditions || result.possible_conditions,
        recommendations: recommendations || result.recommendation,
        inputData,
        result,
        ai_interaction_log: ai_interaction_log || result.ai_interaction_log || null
      }
    });

    console.log("[POST /api/moderator/reports] Success:", report.id);

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_REPORT_CREATED',
        details: `Saved ${type} report ID: ${report.id} for patient: ${report.patientName}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      reportId: report.id,
      patientRef: report.patientRef 
    });
  } catch (error: any) {
    console.error("[SAVE_REPORT_ERROR]", error);
    return handleApiError(error);
  }
}
