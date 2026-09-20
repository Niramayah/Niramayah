import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN']);

    const [
      totalUsers,
      totalAiTests,
      totalRevenue,
      openTickets,
      recentActivity,
      recentAuditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.aiTest.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      }),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.aiTest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      })
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalAiTests,
        totalRevenue: totalRevenue._sum.amount || 0,
        openTickets,
      },
      recentActivity,
      recentAuditLogs
    });

  } catch (error) {
    return handleApiError(error);
  }
}
