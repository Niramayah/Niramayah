import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';
import { getSession } from '@/lib/session';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) await requirePermission('newsPublish');

    const news = await prisma.news.findUnique({ where: { id: id } });
    if (!news) return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });

    await prisma.news.delete({ where: { id: id } });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'NEWS_PERMANENT_DELETE',
        details: `Permanently deleted news: ${news.title}`
      }
    });

    return NextResponse.json({ success: true, message: 'News deleted permanently' });
  } catch (error) {
    return handleApiError(error);
  }
}
