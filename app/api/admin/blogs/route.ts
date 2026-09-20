import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requirePermission('contentManage'); // Assuming permission key
    const blogs = await prisma.blog.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ blogs });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission('contentManage');
    const { title, slug, content, categoryId, published } = await req.json();

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        categoryId,
        published: published || false
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'BLOG_CREATE',
        details: `Created blog: ${title}`
      }
    });

    return NextResponse.json({ blog });
  } catch (error) {
    return handleApiError(error);
  }
}
