import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError } from '@/lib/auth-helpers';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireRole(['SUPER_ADMIN', 'ADMIN']);

    // @ts-ignore
    const report = await prisma.savedReport.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole(['SUPER_ADMIN', 'ADMIN']);

    // @ts-ignore
    await prisma.savedReport.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'ADMIN_REPORT_DELETE',
        details: `Admin deleted report ID: ${id}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
