import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';
import { getSession } from '@/lib/session';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } });
    const body = await req.json();
    const { action, feedback, ...updateData } = body;

    const blog = await prisma.blog.findUnique({
      where: { id: id }
    });

    if (!blog) return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

    // Workflow Logic
    if (action === 'publish') {
      if (!isAdmin) await requirePermission('blogPublish');
      const updated = await prisma.blog.update({
        where: { id: id },
        data: { 
          status: 'PUBLISHED', 
          published: true, 
          publisherId: session.userId,
          publishedAt: new Date(),
          feedback: null
        }
      });
      
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'BLOG_PUBLISHED',
          details: `Moderator ${user?.name || session.userId} published blog: ${blog.title}`
        }
      });
      
      return NextResponse.json({ success: true, blog: updated });
    }

    if (action === 'return_for_edit') {
      if (!isAdmin) await requirePermission('blogPublish');
      if (!feedback?.trim()) {
        return NextResponse.json({ success: false, message: "Please provide feedback for the author." }, { status: 400 });
      }

      const updated = await prisma.blog.update({
        where: { id: id },
        data: { 
          status: 'RETURNED', 
          feedback: feedback,
          publisherId: session.userId
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'BLOG_RETURNED',
          details: `Returned blog for edits: ${blog.title}. Feedback: ${feedback}`
        }
      });

      return NextResponse.json({ success: true, blog: updated });
    }

    if (action === 'reject') {
      if (!isAdmin) await requirePermission('blogPublish');
      if (!feedback?.trim()) {
        return NextResponse.json({ success: false, message: "Please provide a reason for rejection." }, { status: 400 });
      }

      const updated = await prisma.blog.update({
        where: { id: id },
        data: { 
          status: 'REJECTED', 
          feedback: feedback,
          publisherId: session.userId
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'BLOG_REJECTED',
          details: `Rejected blog: ${blog.title}. Reason: ${feedback}`
        }
      });

      return NextResponse.json({ success: true, blog: updated });
    }

    if (action === 'unpublish') {
      if (!isAdmin) await requirePermission('blogPublish');
      const updated = await prisma.blog.update({
        where: { id: id },
        data: { 
          status: 'DRAFT', 
          published: false,
          publishedAt: null
        }
      });
      return NextResponse.json({ success: true, blog: updated });
    }

    if (action === 'archive' || action === 'delete_soft') {
      // Authors can archive their own blogs, or Publishers/Admins can archive any
      const isAuthor = blog.authorId === session.userId;
      if (!isAdmin && !isAuthor) await requirePermission('blogPublish');
      
      const updated = await prisma.blog.update({
        where: { id: id },
        data: { 
          status: 'ARCHIVED',
          published: false,
          deletedAt: new Date()
        }
      });
      return NextResponse.json({ success: true, blog: updated });
    }

    if (action === 'restore') {
      const isAuthor = blog.authorId === session.userId;
      if (!isAdmin && !isAuthor) await requirePermission('blogPublish');
      
      // If author restores, it goes back to DRAFT or SUBMITTED (default to SUBMITTED if it was previously submitted)
      // For simplicity, we'll restore to SUBMITTED if publisher/admin restores, or DRAFT if author restores
      const restoredStatus = isAuthor ? 'DRAFT' : 'SUBMITTED';

      const updated = await prisma.blog.update({
        where: { id: id },
        data: { 
          status: restoredStatus,
          deletedAt: null
        }
      });
      return NextResponse.json({ success: true, blog: updated });
    }

    if (action === 'UPDATE_PUBLISHED') {
      if (!isAdmin) await requirePermission('blogPublish');
      const updated = await prisma.blog.update({
        where: { id: id },
        data: { 
          title: updateData.title,
          content: updateData.content,
          status: 'PUBLISHED' // Ensure it stays published
        }
      });
      return NextResponse.json({ success: true, blog: updated });
    }

    if (action === 'SUBMIT') {
      if (!isAdmin) await requirePermission('blogWrite');
      if (blog.authorId !== session.userId && !isAdmin) throw new Error('Forbidden: Not the author');
      const updated = await prisma.blog.update({
        where: { id: id },
        data: { status: 'SUBMITTED' }
      });

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'BLOG_SUBMIT_REVIEW',
          details: `Submitted blog for review: ${blog.title}`
        }
      });

      return NextResponse.json({ success: true, blog: updated });
    }

    // Default: Edit Draft / update_draft
    if (!isAdmin) await requirePermission('blogWrite');
    if (blog.authorId !== session.userId && !isAdmin) throw new Error('Forbidden: Not the author');
    
    // Writers cannot edit published or submitted blogs through the default edit path
    if (blog.status === 'PUBLISHED' || blog.status === 'SUBMITTED' || blog.status === 'REVIEW') {
      if (!isAdmin) throw new Error('Forbidden: Cannot edit article in its current status');
    }
    
    const { title, content, categoryId } = updateData;
    const finalStatus = body.status === 'SUBMITTED' ? 'SUBMITTED' : blog.status;

    const updated = await prisma.blog.update({
      where: { id: id },
      data: {
        title: title || undefined,
        content: content || undefined,
        categoryId: categoryId || undefined,
        status: finalStatus
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: body.status === 'SUBMITTED' ? 'BLOG_SUBMIT_REVIEW' : 'BLOG_DRAFT_UPDATE',
        details: `${body.status === 'SUBMITTED' ? 'Submitted' : 'Updated'} blog draft: ${title || blog.title}`
      }
    });

    return NextResponse.json({ success: true, blog: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const blog = await prisma.blog.findUnique({ where: { id: id } });
    if (!blog) return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
    
    // Permanent delete for Admin, Super Admin, Blog Publisher, or the Blog Author
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';
    const isAuthor = blog.authorId === session.userId;
    const canPublish = isAdmin || (await prisma.userPermission.findUnique({
      where: { userId_permissionKey: { userId: session.userId, permissionKey: 'blogPublish' } }
    }))?.enabled;

    if (!isAdmin && !canPublish && !isAuthor) {
      return NextResponse.json({ 
        success: false, 
        message: 'Forbidden: You do not have permission to permanently delete this blog.' 
      }, { status: 403 });
    }

    await prisma.blog.delete({ where: { id: id } });
    
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'BLOG_PERMANENT_DELETE',
        details: `Permanently deleted blog: ${blog.title}`
      }
    });

    return NextResponse.json({ success: true, message: 'Blog permanently deleted' });
  } catch (error) {
    return handleApiError(error);
  }
}
