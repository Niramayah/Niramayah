import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requirePermission('aiTestAccess');
    
    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // @ts-ignore
    const report = await prisma.savedReport.findUnique({
      where: {
        id: id
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Ensure the moderator only sees their own reports or is an admin
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin && report.userId !== session.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("[GET_REPORT_BY_ID_ERROR]", error);
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requirePermission('aiTestAccess');
    
    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // @ts-ignore
    const report = await prisma.savedReport.findUnique({
      where: { id: id }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin && report.userId !== session.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // @ts-ignore
    await prisma.savedReport.delete({
      where: { id: id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_REPORT_DELETED',
        details: `Deleted report ID: ${id} for patient: ${report.patientName}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE_REPORT_ERROR]", error);
    return handleApiError(error);
  }
}
