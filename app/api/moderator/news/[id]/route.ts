import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission('newsWrite');
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    const body = await req.json();
    const { action, feedback, ...updateData } = body;

    const news = await prisma.news.findUnique({
      where: { id: params.id }
    });

    if (!news) return NextResponse.json({ error: 'News not found' }, { status: 404 });

    if (action === 'PUBLISH') {
      await requirePermission('newsPublish');
      const updated = await prisma.news.update({
        where: { id: params.id },
        data: { 
          status: 'PUBLISHED', 
          published: true, 
          publisherId: session.userId,
          feedback: null
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'NEWS_PUBLISHED',
          details: `Moderator ${user?.name || session.userId} published news: ${news.title}`
        }
      });

      return NextResponse.json({ news: updated });
    }

    if (action === 'RETURN') {
      await requirePermission('newsPublish');
      const updated = await prisma.news.update({
        where: { id: params.id },
        data: { 
          status: 'RETURNED', 
          feedback: feedback,
          publisherId: session.userId
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'NEWS_RETURNED',
          details: `Moderator ${user?.name || session.userId} returned news for edits: ${news.title}`
        }
      });

      return NextResponse.json({ news: updated });
    }

    if (action === 'SUBMIT') {
      if (news.authorId !== session.userId) throw new Error('Forbidden: Not the author');
      const updated = await prisma.news.update({
        where: { id: params.id },
        data: { status: 'SUBMITTED' }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'NEWS_SUBMIT_REVIEW',
          details: `Moderator ${user?.name || session.userId} submitted news for review: ${news.title}`
        }
      });

      return NextResponse.json({ success: true, news: updated });
    }

    if (news.authorId !== session.userId) throw new Error('Forbidden: Not the author');
    
    const { title, content, status } = updateData;
    const finalStatus = body.status === 'SUBMITTED' ? 'SUBMITTED' : news.status;

    const updated = await prisma.news.update({
      where: { id: params.id },
      data: {
        title: title || undefined,
        content: content || undefined,
        status: finalStatus
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: body.status === 'SUBMITTED' ? 'NEWS_SUBMIT_REVIEW' : 'NEWS_DRAFT_UPDATE',
        details: `Moderator ${user?.name || session.userId} ${body.status === 'SUBMITTED' ? 'submitted' : 'updated'} news draft: ${title || news.title}`
      }
    });

    return NextResponse.json({ success: true, news: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requirePermission('newsWrite');
    const news = await prisma.news.findUnique({ where: { id: params.id } });
    
    if (!news) return NextResponse.json({ error: 'News not found' }, { status: 404 });
    if (news.authorId !== session.userId && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      throw new Error('Forbidden');
    }

    await prisma.news.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
