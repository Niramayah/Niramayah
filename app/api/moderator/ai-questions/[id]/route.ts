import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requirePermission('aiQuestionManage');
    const body = await req.json();

    const question = await prisma.aiQuestion.update({
      where: { id },
      data: {
        step: body.step !== undefined ? parseInt(body.step) : undefined,
        section: body.section,
        questionText: body.questionText,
        type: body.type,
        options: body.options,
        dependsOn: body.dependsOn,
        dependencyValue: body.dependencyValue,
        weight: body.weight !== undefined ? parseInt(body.weight) : undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_QUESTION_UPDATE',
        details: `Updated question ${id}: ${body.questionText}`
      }
    });

    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requirePermission('aiQuestionManage');

    await prisma.aiQuestion.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_QUESTION_DELETE',
        details: `Deleted question ${id}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
