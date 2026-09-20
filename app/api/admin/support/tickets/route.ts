import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN', 'MODERATOR']);
    
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        replies: { include: { user: { select: { name: true, role: true } } } }
      }
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    return handleApiError(error);
  }
}
