import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError, canManageTargetUser } from '@/lib/auth-helpers';
import { SessionPayload } from '@/lib/session';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session: SessionPayload | null = null;
  try {
    session = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const { credits, isUnlimitedCredits } = await req.json();

    await canManageTargetUser(session.userId, session.role as any, id);

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { 
          credits: credits !== undefined ? credits : undefined,
          isUnlimitedCredits: isUnlimitedCredits !== undefined ? isUnlimitedCredits : undefined
        }
      });

      if (session) {
        if (credits !== undefined) {
          await tx.auditLog.create({
            data: {
              userId: session.userId,
              action: 'CREDIT_ADJUSTMENT',
              details: `Set credits for ${id} to ${credits}`
            }
          });
        }

        if (isUnlimitedCredits !== undefined) {
          await tx.auditLog.create({
            data: {
              userId: session.userId,
              action: 'UNLIMITED_CREDITS_CHANGE',
              details: `Set isUnlimitedCredits for ${id} to ${isUnlimitedCredits}`
            }
          });
        }
      }

      return user;
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    if (session && error.message.includes('Forbidden')) {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'CREDIT_ADJUSTMENT_BLOCKED',
          details: `Attempted to adjust credits for protected user ID: ${id}. Error: ${error.message}`
        }
      });
    }
    return handleApiError(error);
  }
}
