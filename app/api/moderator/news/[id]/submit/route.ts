import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';
import { getSession } from '@/lib/session';

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    
    if (!isAdmin) {
      await requirePermission('newsWrite');
    }

    const news = await prisma.news.findUnique({ where: { id: id } });
    
    if (!news) {
      return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });
    }

    if (news.authorId !== session.userId && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden: Not the author' }, { status: 403 });
    }

    const updated = await prisma.news.update({
      where: { id: id },
      data: { 
        status: 'SUBMITTED',
        updatedAt: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'NEWS_SUBMIT_REVIEW',
        details: `Submitted news for review: ${news.title}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'News submitted for publisher review',
      news: updated 
    });
  } catch (error) {
    console.error("[NEWS_SUBMIT_API_ERROR]:", error);
    return handleApiError(error);
  }
}
