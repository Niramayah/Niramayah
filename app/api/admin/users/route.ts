import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError } from '@/lib/auth-helpers';

export async function GET(req: Request) {
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN']);
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        credits: true,
        isUnlimitedCredits: true,
        createdAt: true,
        permissions: {
          select: {
            permissionKey: true,
            enabled: true
          }
        },
        subscriptions: {
          where: { isActive: true },
          select: {
            plan: {
              select: { name: true }
            }
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
