import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';
import { getSession } from '@/lib/session';

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const news = await prisma.news.findUnique({
      where: { id: id },
      include: {
        author: { select: { name: true, email: true } },
        publisher: { select: { name: true, email: true } }
      }
    });

    if (!news) return NextResponse.json({ success: false, message: 'News report not found' }, { status: 404 });

    return NextResponse.json({ success: true, news });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const body = await req.json();
    const { action, feedback, ...updateData } = body;

    const news = await prisma.news.findUnique({ where: { id: id } });
    if (!news) return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });

    // --------------------------------------------------
    // ACTIONS
    // --------------------------------------------------

    if (action === 'PUBLISH' || action === 'publish') {
      if (!isAdmin) await requirePermission('newsPublish');
      const updated = await prisma.news.update({
        where: { id: id },
        data: { 
          status: 'PUBLISHED', 
          publishedAt: new Date(),
          publisherId: session.userId,
          deletedAt: null,
          feedback: null
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'NEWS_PUBLISHED',
          details: `Published news: ${news.title}`
        }
      });

      return NextResponse.json({ success: true, news: updated });
    }

    if (action === 'RETURN' || action === 'return_for_edit') {
      if (!isAdmin) await requirePermission('newsPublish');
      if (!feedback) return NextResponse.json({ success: false, message: 'Feedback is required' }, { status: 400 });
      
      const updated = await prisma.news.update({
        where: { id: id },
        data: { 
          status: 'RETURNED', 
          feedback,
          publisherId: session.userId
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'NEWS_RETURNED',
          details: `Returned news: ${news.title}`
        }
      });

      return NextResponse.json({ success: true, news: updated });
    }

    if (action === 'archive') {
      const isAuthor = news.authorId === session.userId;
      if (!isAdmin && !isAuthor) await requirePermission('newsPublish');
      
      const updated = await prisma.news.update({
        where: { id: id },
        data: { 
          status: 'ARCHIVED',
          deletedAt: new Date()
        }
      });
      return NextResponse.json({ success: true, news: updated });
    }

    if (action === 'restore') {
      const isAuthor = news.authorId === session.userId;
      if (!isAdmin && !isAuthor) await requirePermission('newsPublish');
      
      const updated = await prisma.news.update({
        where: { id: id },
        data: { 
          status: isAuthor ? 'DRAFT' : 'SUBMITTED',
          deletedAt: null
        }
      });
      return NextResponse.json({ success: true, news: updated });
    }

    if (action === 'UPDATE_PUBLISHED') {
      if (!isAdmin) await requirePermission('newsPublish');
      const updated = await prisma.news.update({
        where: { id: id },
        data: { 
          title: updateData.title,
          content: updateData.content,
          excerpt: updateData.excerpt,
          image: updateData.image
        }
      });
      return NextResponse.json({ success: true, news: updated });
    }

    // Default Edit
    if (!isAdmin) await requirePermission('newsWrite');
    if (news.authorId !== session.userId && !isAdmin) throw new Error('Forbidden');

    const updated = await prisma.news.update({
      where: { id: id },
      data: {
        title: updateData.title || undefined,
        content: updateData.content || undefined,
        excerpt: updateData.excerpt || undefined,
        image: updateData.image || undefined,
      }
    });

    return NextResponse.json({ success: true, news: updated });
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
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const news = await prisma.news.findUnique({ where: { id: id } });
    if (!news) return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const isAuthor = news.authorId === session.userId;
    
    if (!isAdmin && !isAuthor) {
      await requirePermission('newsPublish');
    }

    // SOFT DELETE (ARCHIVE)
    const updated = await prisma.news.update({
      where: { id: id },
      data: { 
        status: 'ARCHIVED',
        deletedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'NEWS_ARCHIVED',
        details: `Archived news: ${news.title}`
      }
    });

    return NextResponse.json({ success: true, message: 'News moved to archive' });
  } catch (error) {
    return handleApiError(error);
  }
}
