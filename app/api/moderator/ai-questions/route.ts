import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requirePermission('aiQuestionManage');
    const questions = await prisma.aiQuestion.findMany({
      orderBy: [
        { step: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    return NextResponse.json({ questions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission('aiQuestionManage');
    const body = await req.json();

    const question = await prisma.aiQuestion.create({
      data: {
        step: parseInt(body.step),
        section: body.section,
        questionText: body.questionText,
        type: body.type,
        options: body.options || null,
        dependsOn: body.dependsOn || null,
        dependencyValue: body.dependencyValue || null,
        weight: parseInt(body.weight || 0)
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_QUESTION_CREATE',
        details: `Created question in section ${body.section}: ${body.questionText}`
      }
    });

    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}
