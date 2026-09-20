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
    if (!session || (session.role !== Role.SUPER_ADMIN && session.role !== Role.ADMIN)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { solution } = await req.json();

    if (!solution) return NextResponse.json({ error: 'Solution is required' }, { status: 400 });

    const token = await prisma.supportToken.findFirst({
      where: { ticketId: id, status: 'PENDING' }
    });

    if (!token) return NextResponse.json({ error: 'Active escalation token not found' }, { status: 404 });

    const updatedToken = await prisma.supportToken.update({
      where: { id: token.id },
      data: {
        solution,
        status: 'RESOLVED',
        assignedAdminId: session.userId
      }
    });

    // Create an internal reply with the solution so the moderator can see it
    await prisma.ticketReply.create({
      data: {
        ticketId: id,
        userId: session.userId,
        message: `ADMIN SOLUTION: ${solution}`,
        isInternal: true
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'TICKET_RESOLVE_ADMIN',
        details: `Provided solution for ticket ${id}`
      }
    });

    return NextResponse.json({ token: updatedToken });
  } catch (error) {
    console.error('Admin solution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
