import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError, canManageTargetUser } from '@/lib/auth-helpers';
import { SessionPayload } from '@/lib/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        permissions: true,
        planOverrides: { include: { plan: true } },
        auditLogs: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session: SessionPayload | null = null;
  try {
    session = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    await canManageTargetUser(session.userId, session.role as any, id);

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.memberStatus === 'LEADER' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can manage Leader accounts.' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });
      
      if (session) {
        await tx.auditLog.create({
          data: {
            userId: session.userId,
            action: 'USER_DELETE_SUCCESS',
            details: `Deleted user ID: ${id}`
          }
        });
      }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    if (session && error.message.includes('Forbidden')) {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'USER_DELETE_BLOCKED',
          details: `Attempted to delete protected user ID: ${id}. Error: ${error.message}`
        }
      });
    }
    return handleApiError(error);
  }
}
