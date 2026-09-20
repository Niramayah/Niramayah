import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission('contentManage');
    const body = await req.json();

    const content = await prisma.siteContent.update({
      where: { id: params.id },
      data: body
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CONTENT_UPDATE',
        details: `Updated site content: ${content.title}`
      }
    });

    return NextResponse.json({ content });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission('contentManage');
    
    const content = await prisma.siteContent.delete({
      where: { id: params.id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CONTENT_DELETE',
        details: `Deleted site content: ${content.title}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
