import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError, requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requirePermission('supportTicketHandle');
    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: { select: { name: true, email: true } },
        assignedModerator: { select: { name: true } },
        escalatedToAdmin: { select: { name: true } },
        replies: { include: { user: { select: { name: true, role: true } } } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json({ tickets });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const { ticketId, message, status, escalate } = await req.json();

    if (escalate) {
      await requirePermission('supportEscalateToAdmin');
      
      // Update ticket to escalated
      const ticket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          status: 'ESCALATED',
          escalatedTo: 'ADMIN',
          updatedAt: new Date()
        }
      });

      await prisma.ticketReply.create({
        data: {
          ticketId,
          userId: session.userId,
          message: `Ticket escalated to Admin: ${message}`,
          isInternal: true
        }
      });

      return NextResponse.json({ ticket, message: "Ticket escalated successfully" });
    }

    // Normal reply
    await requirePermission('supportTicketHandle');
    const reply = await prisma.ticketReply.create({
      data: {
        ticketId,
        userId: session.userId,
        message,
        isInternal: false
      }
    });

    if (status) {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status, updatedAt: new Date() }
      });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    return handleApiError(error);
  }
}
