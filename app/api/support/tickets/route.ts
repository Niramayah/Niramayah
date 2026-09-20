import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Role } from '@prisma/client';

// GET all tickets for user or all if admin/mod
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let tickets;
    if (session.role === Role.SUPER_ADMIN || session.role === Role.ADMIN) {
      tickets = await prisma.supportTicket.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else if (session.role === Role.MODERATOR) {
      tickets = await prisma.supportTicket.findMany({
        where: {
          OR: [
            { assignedModeratorId: session.userId },
            { status: 'OPEN' }
          ]
        },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      tickets = await prisma.supportTicket.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new ticket
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subject, message, category } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.userId,
        subject,
        message,
        category: category || 'OTHER',
        status: 'OPEN'
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.userId,
        title: 'Ticket Created',
        message: `Your support ticket "${subject}" has been created.`,
        type: 'INFO'
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'TICKET_CREATE',
        details: `Created ticket: ${ticket.id} (${subject})`
      }
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
