import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';
import { getSession } from '@/lib/session';
import slugify from 'slugify';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') || 'writer';

    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

    // DEBUG LOG
    const userPerms = await prisma.userPermission.findMany({ where: { userId: session.userId, enabled: true } });
    console.log("BLOG API USER:", session.email, session.role, userPerms.map(p => p.permissionKey));

    // --------------------------------------------------
    // SCOPE: PUBLISHER
    // --------------------------------------------------
    if (scope === 'publisher') {
      if (!isAdmin) await requirePermission('blogPublish');
      
      const blogs = await prisma.blog.findMany({
        where: { 
          // Publisher sees ONLY blogs waiting for review
          status: { in: ['SUBMITTED', 'REVIEW'] },
          deletedAt: null // Non-archived only
        },
        include: { 
          category: true, 
          author: { select: { name: true, email: true } } 
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return NextResponse.json({ success: true, blogs: blogs || [] });
    }

    // --------------------------------------------------
    // SCOPE: PUBLISHED
    // --------------------------------------------------
    if (scope === 'published') {
      if (!isAdmin) await requirePermission('blogPublish');
      
      const blogs = await prisma.blog.findMany({
        where: { 
          status: 'PUBLISHED',
          deletedAt: null
        },
        include: { 
          category: true, 
          author: { select: { name: true, email: true } } 
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      return NextResponse.json({ success: true, blogs: blogs || [] });
    }

    // --------------------------------------------------
    // SCOPE: ARCHIVE
    // --------------------------------------------------
    if (scope === 'archive') {
      const canPublish = isAdmin || (await prisma.userPermission.findUnique({
        where: { userId_permissionKey: { userId: session.userId, permissionKey: 'blogPublish' } }
      }))?.enabled;

      const canWrite = isAdmin || (await prisma.userPermission.findUnique({
        where: { userId_permissionKey: { userId: session.userId, permissionKey: 'blogWrite' } }
      }))?.enabled;

      if (!canPublish && !canWrite) {
        return NextResponse.json({ success: false, message: 'Insufficient permissions' }, { status: 403 });
      }

      const where: any = {
        AND: [
          {
            OR: [
              { status: 'ARCHIVED' },
              { deletedAt: { not: null } }
            ]
          }
        ]
      };
      
      if (!canPublish) {
        where.AND.push({ authorId: session.userId });
      }

      const blogs = await prisma.blog.findMany({
        where,
        include: { 
          category: true, 
          author: { select: { name: true, email: true } } 
        },
        orderBy: { deletedAt: 'desc' }
      });

      return NextResponse.json({ success: true, blogs: blogs || [] });
    }

    // --------------------------------------------------
    // SCOPE: WRITER (DEFAULT)
    // --------------------------------------------------
    if (!isAdmin) await requirePermission('blogWrite');
    
    const blogs = await prisma.blog.findMany({
      where: { 
        authorId: session.userId,
        // Writer sees their own manageable blogs
        status: { in: ['DRAFT', 'RETURNED', 'REJECTED'] },
        deletedAt: null // Non-archived only
      },
      include: { category: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    return NextResponse.json({ success: true, blogs: blogs || [] });

  } catch (error: any) {
    console.error("[BLOGS_GET_ERROR]:", error);
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission('blogWrite');
    const body = await req.json();
    const { title, content, categoryId } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ success: false, message: 'Title and content are required' }, { status: 400 });
    }

    // Slug generation
    const makeSlug = (text: string) =>
      text.toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    let slugBase = '';
    try {
      slugBase = slugify(title, { lower: true, strict: true });
    } catch (e) {
      slugBase = makeSlug(title);
    }
    
    const status = body.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT';

    const blog = await prisma.blog.create({
      data: {
        title: title.trim(),
        slug: `${slugBase}-${Date.now().toString().slice(-4)}`,
        content: content.trim(),
        categoryId,
        authorId: session.userId,
        status: status,
        published: false
      }
    });

    return NextResponse.json({ success: true, blog });
  } catch (error) {
    console.error("[BLOGS_POST_ERROR]:", error);
    return handleApiError(error);
  }
}
