import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleApiError } from '@/lib/auth-helpers';
import { getSession } from '@/lib/session';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const blog = await prisma.blog.findUnique({ 
      where: { id: id },
      select: { id: true, title: true, authorId: true } 
    });
    
    if (!blog) return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
    
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const isAuthor = blog.authorId === session.userId;
    
    // Check for blogPublish permission
    const canPublish = isAdmin || (await prisma.userPermission.findUnique({
      where: { userId_permissionKey: { userId: session.userId, permissionKey: 'blogPublish' } }
    }))?.enabled;

    // Permission Logic:
    // 1. Admin/Super Admin -> Full Access
    // 2. Blog Publisher -> Full Access to all
    // 3. Blog Writer -> ONLY their own blogs
    if (!isAdmin && !canPublish && !isAuthor) {
      return NextResponse.json({ 
        success: false, 
        message: 'Forbidden: You do not have permission to permanently delete this blog.' 
      }, { status: 403 });
    }

    // Perform permanent deletion
    await prisma.blog.delete({ where: { id: id } });
    
    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'BLOG_PERMANENT_DELETE',
        details: `Permanently deleted blog: ${blog.title} (ID: ${id})`
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Blog permanently deleted' 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
