import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requirePermission('aiManage');
    const questions = await prisma.aiQuestion.findMany({
      orderBy: [{ step: 'asc' }, { weight: 'desc' }]
    });
    return NextResponse.json({ questions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission('aiManage');
    const data = await req.json();

    const question = await prisma.aiQuestion.create({ data });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_QUESTION_CREATE',
        details: `Created AI question: ${question.questionText}`
      }
    });

    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}
