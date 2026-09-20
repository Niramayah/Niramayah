import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requirePermission('contentManage');
    const content = await prisma.siteContent.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ content });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission('contentManage');
    const body = await req.json();

    const content = await prisma.siteContent.create({
      data: {
        title: body.title,
        description: body.description,
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType || 'IMAGE',
        caption: body.caption,
        location: body.location,
        link: body.link,
        isActive: body.isActive !== undefined ? body.isActive : true,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CONTENT_CREATE',
        details: `Created site content: ${body.title} for ${body.location}`
      }
    });

    return NextResponse.json({ content });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requirePermission('contentManage');
    const body = await req.json();
    const { id, ...updateData } = body;

    const content = await prisma.siteContent.update({
      where: { id },
      data: updateData
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

export async function DELETE(req: Request) {
  try {
    const session = await requirePermission('contentManage');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.siteContent.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CONTENT_DELETE',
        details: `Deleted site content ID: ${id}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
