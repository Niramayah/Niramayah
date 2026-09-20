import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError } from '@/lib/auth-helpers';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.MODERATOR]);
    
    const coreMembers = await prisma.user.findMany({
      where: { isCoreMember: true },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        coreRoleTitle: true,
        role: true
      }
    });

    return NextResponse.json({ coreMembers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireRole([Role.SUPER_ADMIN]);
    const { userId, isCoreMember, coreRoleTitle } = await req.json();

    if (isCoreMember) {
      // Check current count
      const count = await prisma.user.count({
        where: { isCoreMember: true }
      });

      if (count >= 4) {
        // If updating an existing core member, it's fine, but if adding new one, block
        const target = await prisma.user.findUnique({
          where: { id: userId },
          select: { isCoreMember: true }
        });
        if (!target?.isCoreMember) {
          return NextResponse.json({ error: 'Maximum of 4 core members (Pillars) allowed.' }, { status: 400 });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isCoreMember: isCoreMember ?? undefined,
        coreRoleTitle: coreRoleTitle ?? undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CORE_MEMBER_UPDATE',
        details: `${isCoreMember ? 'Added' : 'Removed'} core member status for ${updatedUser.name}. Role: ${coreRoleTitle}`
      }
    });

    return NextResponse.json({ 
      message: 'Core member updated successfully',
      user: updatedUser
    });

  } catch (error) {
    return handleApiError(error);
  }
}
