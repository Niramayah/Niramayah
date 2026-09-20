import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';
import { getSession } from '@/lib/session';
import slugify from 'slugify';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'writer';

    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

    // --------------------------------------------------
    // SCOPE: PUBLISHER
    // --------------------------------------------------
    if (scope === 'publisher') {
      if (!isAdmin) await requirePermission('newsPublish');
      
      const news = await prisma.news.findMany({
        where: { 
          status: { in: ['SUBMITTED', 'REVIEW'] },
          deletedAt: null
        },
        include: { 
          author: { select: { name: true, email: true } } 
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return NextResponse.json({ success: true, news: news || [] });
    }

    // --------------------------------------------------
    // SCOPE: PUBLISHED
    // --------------------------------------------------
    if (scope === 'published') {
      if (!isAdmin) await requirePermission('newsPublish');
      
      const news = await prisma.news.findMany({
        where: { 
          status: 'PUBLISHED',
          deletedAt: null
        },
        include: { 
          author: { select: { name: true, email: true } } 
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return NextResponse.json({ success: true, news: news || [] });
    }

    // --------------------------------------------------
    // SCOPE: ARCHIVE
    // --------------------------------------------------
    if (scope === 'archive') {
      if (!isAdmin) await requirePermission('newsPublish');
      
      const news = await prisma.news.findMany({
        where: { 
          OR: [
            { status: 'ARCHIVED' },
            { deletedAt: { not: null } }
          ]
        },
        include: { 
          author: { select: { name: true, email: true } } 
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return NextResponse.json({ success: true, news: news || [] });
    }

    // --------------------------------------------------
    // SCOPE: WRITER (Default)
    // --------------------------------------------------
    if (!isAdmin) await requirePermission('newsWrite');

    const news = await prisma.news.findMany({
      where: {
        authorId: isAdmin ? undefined : session.userId,
        status: { in: ['DRAFT', 'RETURNED', 'REJECTED'] },
        deletedAt: null
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ success: true, news: news || [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    if (!isAdmin) await requirePermission('newsWrite');

    const body = await req.json();
    const { title, content, excerpt, image, action } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, message: 'Title and content are required' }, { status: 400 });
    }

    const slug = slugify(title, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 7);

    // Initial status based on action
    const status = action === 'submit' ? 'SUBMITTED' : 'DRAFT';

    const news = await prisma.news.create({
      data: {
        title,
        content,
        excerpt,
        image,
        slug,
        authorId: session.userId,
        status: status
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: action === 'submit' ? 'NEWS_SUBMIT_REVIEW' : 'NEWS_DRAFT_CREATE',
        details: `${action === 'submit' ? 'Submitted' : 'Created'} news: ${title}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: action === 'submit' ? 'News submitted for review' : 'News draft saved',
      news 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
