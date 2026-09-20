import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { planId } = await req.json();
    if (!planId) return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
    }

    // Check for overrides
    const override = await prisma.userPlanOverride.findUnique({
      where: { userId_planId: { userId: session.userId, planId } }
    });

    const finalPrice = override ? (override.isFree ? 0 : override.customPrice ?? plan.price) : plan.price;

    // Create Payment Record (Pending)
    const payment = await prisma.payment.create({
      data: {
        amount: finalPrice,
        currency: 'INR',
        status: 'PENDING'
      }
    });

    // Handle instant activation if free (0 INR)
    if (finalPrice === 0) {
      return await activateSubscription(session.userId, plan, payment.id);
    }

    // For paid plans, we return payment info and status "PAYMENT_PENDING"
    // In a real app, this would return Razorpay order ID
    return NextResponse.json({
      message: 'Payment integration pending. Please contact support for manual activation.',
      paymentId: payment.id,
      finalPrice,
      status: 'PAYMENT_PENDING'
    });

  } catch (error) {
    console.error('Buy subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function activateSubscription(userId: string, plan: any, paymentId: string) {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // 1 month validity

  return await prisma.$transaction(async (tx) => {
    // 1. Create/Update Subscription
    const subscription = await tx.subscription.upsert({
      where: { id: `SUB-${userId}-${plan.id}` }, // Simplified ID for mock
      update: {
        isActive: true,
        endDate,
        startDate: new Date()
      },
      create: {
        id: `SUB-${userId}-${plan.id}`,
        userId,
        planId: plan.id,
        startDate: new Date(),
        endDate,
        isActive: true
      }
    });

    // 2. Add Credits to User
    await tx.user.update({
      where: { id: userId },
      data: {
        credits: { increment: plan.credits }
      }
    });

    // 3. Update Payment Status
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'COMPLETED' }
    });

    // 4. Create Credit Transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: plan.credits,
        type: 'CREDIT',
        description: `Plan Upgrade: ${plan.name}`
      }
    });

    // 5. Create Notification
    await tx.notification.create({
      data: {
        userId,
        title: 'Subscription Activated',
        message: `Your ${plan.name} plan is active! ${plan.credits} credits added.`,
        type: 'SUCCESS'
      }
    });

    // 6. Audit Log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'SUBSCRIPTION_UPGRADE',
        details: `Upgraded to ${plan.name}. Credits added: ${plan.credits}`
      }
    });

    return NextResponse.json({
      message: 'Subscription activated successfully!',
      subscription,
      status: 'SUCCESS'
    });
  });
}
