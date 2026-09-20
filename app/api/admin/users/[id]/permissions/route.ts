import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError } from '@/lib/auth-helpers';
import { SessionPayload } from '@/lib/session';

// Return permissions as a flat object for the requested format
const formatPermissions = (permissions: any[]) => {
  const map: { [key: string]: boolean } = {};
  permissions.forEach(p => {
    map[p.permissionKey] = p.enabled;
  });
  return map;
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN']);
    
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!targetUser || targetUser.role !== 'MODERATOR') {
      return NextResponse.json({ 
        success: false, 
        message: 'Forbidden: Permissions can only be managed for Moderators.' 
      }, { status: 403 });
    }

    const permissions = await prisma.userPermission.findMany({
      where: { userId }
    });

    return NextResponse.json({ 
      success: true,
      permissions: formatPermissions(permissions) 
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;
  let session: SessionPayload | null = null;
  try {
    session = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const body = await req.json();
    const { permissions } = body; // Array of { key, enabled }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true }
    });

    if (!targetUser || targetUser.role !== 'MODERATOR') {
      return NextResponse.json({ 
        success: false, 
        message: 'Forbidden: Permissions can only be managed for Moderators.' 
      }, { status: 403 });
    }

    const updatedPermissions = await prisma.$transaction(async (tx) => {
      for (const p of permissions) {
        await tx.userPermission.upsert({
          where: {
            userId_permissionKey: {
              userId,
              permissionKey: p.key
            }
          },
          update: { enabled: p.enabled },
          create: {
            userId,
            permissionKey: p.key,
            enabled: p.enabled
          }
        });
      }

      if (session) {
        await tx.auditLog.create({
          data: {
            userId: session.userId,
            action: 'MODERATOR_PERMISSION_UPDATE',
            details: `Updated permissions for moderator ${targetUser.name} (${userId}).`
          }
        });
      }

      return tx.userPermission.findMany({ where: { userId } });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Permissions updated successfully',
      permissions: formatPermissions(updatedPermissions)
    });
  } catch (error: any) {
    console.error('Permission API Error:', error);
    return NextResponse.json({ 
      success: false,
      message: error.message || 'Failed to update permissions'
    }, { status: 500 });
  }
}
