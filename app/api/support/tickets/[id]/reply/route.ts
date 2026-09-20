import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Role } from '@prisma/client';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { message, isInternal } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.status === 'CLOSED') {
      return NextResponse.json({ error: 'Ticket is closed' }, { status: 400 });
    }

    // Security check
    if (session.role === Role.USER && ticket.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // User cannot post internal messages
    const internal = session.role === Role.USER ? false : !!isInternal;

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: id,
        userId: session.userId,
        message,
        isInternal: internal
      }
    });

    // Update ticket status to IN_PROGRESS if moderator replies
    if (session.role === Role.MODERATOR || session.role === Role.ADMIN || session.role === Role.SUPER_ADMIN) {
      if (ticket.status === 'OPEN') {
        await prisma.supportTicket.update({
          where: { id },
          data: { status: 'IN_PROGRESS' }
        });
      }

      // Notify user of reply
      if (!internal) {
        await prisma.notification.create({
          data: {
            userId: ticket.userId,
            title: 'New Support Reply',
            message: `You have a new reply on your ticket: "${ticket.subject}"`,
            type: 'INFO'
          }
        });
      }
    }

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error('Reply to ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
