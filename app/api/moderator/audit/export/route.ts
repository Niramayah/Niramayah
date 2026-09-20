import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    // Only ADMIN or SUPER_ADMIN can export audit logs, or specific permission
    const session = await requirePermission('viewAuditLimited');
    
    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV
    const headers = ['ID', 'Date', 'User Name', 'User Email', 'Action', 'Details'];
    const rows = logs.map(log => [
      log.id,
      log.createdAt.toISOString(),
      log.user?.name || 'System',
      log.user?.email || 'N/A',
      log.action,
      `"${(log.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=audit_logs_export.csv'
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
