import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('contentManage');
    const { id } = await params;
    const { title, content, published } = await req.json();

    const news = await prisma.news.update({
      where: { id },
      data: {
        title,
        content,
        published
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'NEWS_UPDATE',
        details: `Updated news: ${title} (${id})`
      }
    });

    return NextResponse.json({ news });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('contentManage');
    const { id } = await params;

    const news = await prisma.news.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'NEWS_DELETE',
        details: `Deleted news: ${news.title} (${id})`
      }
    });

    return NextResponse.json({ message: 'News deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
