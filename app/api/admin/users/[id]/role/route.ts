import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError, canManageTargetUser } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';
import { SessionPayload } from '@/lib/session';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session: SessionPayload | null = null;
  try {
    session = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const { role: newRole } = await req.json();

    if (!Object.values(Role).includes(newRole)) {
      throw new Error('Invalid role');
    }

    // Role Escalation Rules
    if (session.role === 'ADMIN') {
      if (newRole === 'ADMIN' || newRole === 'SUPER_ADMIN') {
        throw new Error('Forbidden: Only Super Admin can promote users to Admin role.');
      }
    }

    await canManageTargetUser(session.userId, session.role as any, id);

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { name: true, role: true }
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    if (targetUser.role === newRole) {
      throw new Error('User already has this role');
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { role: newRole }
      });

      if (session) {
        await tx.auditLog.create({
          data: {
            userId: session.userId,
            action: 'ROLE_CHANGE',
            details: `ROLE_CHANGE: Admin changed ${targetUser.name} from ${targetUser.role} → ${newRole}`
          }
        });
      }

      return user;
    });

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Role updated successfully'
    });
  } catch (error: any) {
    if (session && error.message.includes('Forbidden')) {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'ROLE_CHANGE_BLOCKED',
          details: `Attempted to change role of protected user ID: ${id}. Error: ${error.message}`
        }
      });
    }
    return handleApiError(error);
  }
}
