import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN']);
    
    // @ts-ignore
    const reports = await prisma.savedReport.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("[ADMIN_GET_REPORTS_ERROR]", error);
    return handleApiError(error);
  }
}
