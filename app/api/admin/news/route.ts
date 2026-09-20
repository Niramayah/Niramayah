import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requirePermission('contentManage');
    const news = await prisma.news.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ news });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission('contentManage');
    const { title, content, published, image, excerpt } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ success: false, message: 'Missing title or content' }, { status: 400 });
    }

    // Generate unique slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);

    const news = await prisma.news.create({
      data: {
        title,
        content,
        slug,
        image: image || null,
        excerpt: excerpt || content.substring(0, 150) + '...',
        status: published ? 'PUBLISHED' : 'DRAFT',
        authorId: session.userId,
        publishedAt: published ? new Date() : null
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'NEWS_CREATE',
        details: `Created news: ${title} (Slug: ${slug})`
      }
    });

    return NextResponse.json({ success: true, news });
  } catch (error) {
    return handleApiError(error);
  }
}

