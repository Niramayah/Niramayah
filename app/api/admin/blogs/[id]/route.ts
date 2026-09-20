import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('contentManage');
    const { id } = await params;
    const { title, slug, content, categoryId, published } = await req.json();

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        categoryId,
        published
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'BLOG_UPDATE',
        details: `Updated blog: ${title} (${id})`
      }
    });

    return NextResponse.json({ blog });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission('contentManage');
    const { id } = await params;

    const blog = await prisma.blog.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'BLOG_DELETE',
        details: `Deleted blog: ${blog.title} (${id})`
      }
    });

    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
