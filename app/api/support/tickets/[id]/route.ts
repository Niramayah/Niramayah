import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Role } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        replies: {
          where: session.role === Role.USER ? { isInternal: false } : {},
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        },
        assignedModerator: { select: { name: true } },
        escalatedToAdmin: { select: { name: true } }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Security check
    if (session.role === Role.USER && ticket.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Fetch ticket details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH for updating status or assigning
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { status, assignedModeratorId, escalatedToAdminId } = await req.json();

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    // Only Mods and Admins can update status/assign
    if (session.role === Role.USER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: status || ticket.status,
        assignedModeratorId: assignedModeratorId || ticket.assignedModeratorId,
        escalatedToAdminId: escalatedToAdminId || ticket.escalatedToAdminId
      }
    });

    // Notify user of status change
    if (status && status !== ticket.status) {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          title: 'Ticket Status Updated',
          message: `Your ticket "${ticket.subject}" status is now ${status}.`,
          type: 'INFO'
        }
      });
    }

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Update ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
