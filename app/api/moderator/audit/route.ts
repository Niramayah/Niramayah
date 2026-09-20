import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET(req: Request) {
  try {
    const session = await requirePermission('viewAuditLimited');
    
    // Moderators can see their own logs and logs related to modules they have access to
    // For simplicity, we'll show logs matching certain keywords or their own userId
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: session.userId },
          { action: { contains: 'AI_' } },
          { action: { contains: 'BLOG_' } },
          { action: { contains: 'NEWS_' } },
          { action: { contains: 'TICKET_' } },
          { action: { contains: 'CONTENT_' } }
        ]
      },
      include: {
        user: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    const { searchParams } = new URL(req.url);
    const exportCsv = searchParams.get('export') === 'csv';

    if (exportCsv) {
      const allLogs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { userId: session.userId },
            { action: { contains: 'AI_' } },
            { action: { contains: 'BLOG_' } },
            { action: { contains: 'NEWS_' } },
            { action: { contains: 'TICKET_' } },
            { action: { contains: 'CONTENT_' } }
          ]
        },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      });

      const csvRows = [
        ['ID', 'Date', 'User', 'Action', 'Details'].join(','),
        ...allLogs.map(log => [
          log.id,
          log.createdAt.toISOString(),
          log.user?.name || 'System',
          log.action,
          `"${(log.details || '').replace(/"/g, '""')}"`
        ].join(','))
      ];

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=audit_logs.csv'
        }
      });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    return handleApiError(error);
  }
}
