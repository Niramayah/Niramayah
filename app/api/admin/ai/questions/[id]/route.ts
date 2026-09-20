import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('aiManage');
    const { id } = await params;
    const data = await req.json();

    const question = await prisma.aiQuestion.update({
      where: { id },
      data
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_QUESTION_UPDATE',
        details: `Updated AI question: ${question.questionText} (${id})`
      }
    });

    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('aiManage');
    const { id } = await params;

    const question = await prisma.aiQuestion.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_QUESTION_DELETE',
        details: `Deleted AI question: ${question.questionText} (${id})`
      }
    });

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
