import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        credits: true,
        isUnlimitedCredits: true,
        profileImage: true,
        permissions: {
          where: { enabled: true },
          select: { permissionKey: true }
        }
      }
    });

    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { profileImage: true }
    });

    const hasAiTestAccess = user?.permissions.some(p => p.permissionKey === 'AI_TEST_ACCESS');
    const isInfinite = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || hasAiTestAccess || user?.isUnlimitedCredits;

    const userData = {
      ...user,
      credits: isInfinite ? 'Infinity' : user?.credits
    };

    return NextResponse.json({ 
      success: true, 
      user: userData,
      masterLogoUrl: superAdmin?.profileImage || '/NIRAMAYAH_LOGO.png'
    });



  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
