import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError } from '@/lib/auth-helpers';

export async function GET(req: Request) {
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN']);
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true, role: true } } }
      }),
      prisma.auditLog.count()
    ]);

    return NextResponse.json({ logs, total });
  } catch (error) {
    return handleApiError(error);
  }
}
