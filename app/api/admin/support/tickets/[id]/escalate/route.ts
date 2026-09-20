import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { Role } from '@prisma/client';
import crypto from 'crypto';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role === Role.USER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    // Generate unique support token
    const tokenStr = crypto.randomBytes(4).toString('hex').toUpperCase();

    const [updatedTicket, supportToken] = await prisma.$transaction([
      prisma.supportTicket.update({
        where: { id },
        data: {
          status: 'ESCALATED',
          escalationToken: tokenStr
        }
      }),
      prisma.supportToken.create({
        data: {
          token: tokenStr,
          ticketId: id,
          generatedById: session.userId,
          status: 'PENDING'
        }
      })
    ]);

    // Notify user
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        title: 'Ticket Escalated',
        message: `Your ticket "${ticket.subject}" has been escalated to an administrator for further review.`,
        type: 'INFO'
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'TICKET_ESCALATE',
        details: `Escalated ticket ${id}. Token: ${tokenStr}`
      }
    });

    return NextResponse.json({ ticket: updatedTicket, token: supportToken });
  } catch (error) {
    console.error('Escalate ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
