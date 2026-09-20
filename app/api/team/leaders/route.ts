import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const leaders = await prisma.user.findMany({
      where: {
        memberStatus: 'LEADER'
      },
      select: {
        id: true,
        name: true,
        role: true,
        coreRoleTitle: true,
        profileImage: true,
        bio: true,
        githubUrl: true,
        email: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // If no leaders in DB yet, return the default "Founding Four" as fallback structure
    // This handles the transition period before the user updates the DB
    return NextResponse.json({ leaders });
  } catch (error) {
    console.error('Fetch leaders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
