import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'MODERATOR') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await prisma.userPermission.findMany({
      where: { 
        userId: session.userId,
        enabled: true
      }
    });

    const permsMap: { [key: string]: boolean } = {};
    permissions.forEach(p => {
      permsMap[p.permissionKey] = p.enabled;
    });

    return NextResponse.json({ 
      success: true,
      permissions: permsMap 
    });
  } catch (error) {
    console.error('Moderator permissions error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
