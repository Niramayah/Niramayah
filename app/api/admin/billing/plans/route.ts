import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireRole, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const plans = await prisma.subscriptionPlan.findMany({
      include: { _count: { select: { subscriptions: true } } }
    });
    return NextResponse.json({ plans });
  } catch (error) {
    return handleApiError(error);
  }
}

interface PlanRequest {
  name: string;
  description?: string;
  price: string | number;
  credits: string | number;
  features?: unknown[];
  isActive?: boolean;
}

export async function POST(req: Request) {
  try {
    const session = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const body: PlanRequest = await req.json();
    const { name, description, price, credits, features, isActive } = body;

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price: typeof price === 'string' ? parseFloat(price) : price,
        credits: typeof credits === 'string' ? parseInt(credits) : credits,
        features: (Array.isArray(features) ? features : []) as Prisma.InputJsonValue,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'PLAN_CREATE',
        details: `Created subscription plan: ${plan.name} (Price: ${plan.price}, Credits: ${plan.credits})`
      }
    });

    return NextResponse.json({ plan });
  } catch (error) {
    return handleApiError(error);
  }
}
