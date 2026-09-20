import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError } from '@/lib/auth-helpers';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const { id } = await params;
    const { name, description, price, credits, features, isActive } = await req.json();

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        credits: credits !== undefined ? parseInt(credits) : undefined,
        features: Array.isArray(features) ? features : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'PLAN_UPDATE',
        details: `Updated subscription plan: ${plan.name} (${id})`
      }
    });

    return NextResponse.json({ plan });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const { id } = await params;

    const plan = await prisma.subscriptionPlan.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'PLAN_DELETE',
        details: `Deleted subscription plan: ${plan.name} (${id})`
      }
    });

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
