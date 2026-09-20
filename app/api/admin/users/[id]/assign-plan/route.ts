import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const body = await req.json();
    const { planId, isFree, endDate, grantCredits } = body;

    // 1. Verify target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, credits: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role !== 'USER') {
      return NextResponse.json({ error: 'Plans can only be assigned to normal USER accounts.' }, { status: 400 });
    }

    // 2. Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // 3. Process subscription and credits in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deactivate current active subscriptions for this user
      await tx.subscription.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false }
      });

      // Calculate end date (default 30 days if not provided)
      const finalEndDate = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create new subscription
      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId,
          startDate: new Date(),
          endDate: finalEndDate,
          isActive: true
        }
      });

      let updatedCredits = targetUser.credits;
      
      if (grantCredits) {
        // Add plan credits to user
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            credits: { increment: plan.credits }
          }
        });
        updatedCredits = updatedUser.credits;

        // Create credit transaction
        await tx.creditTransaction.create({
          data: {
            userId,
            amount: plan.credits,
            type: 'CREDIT',
            description: `Admin assigned plan: ${plan.name} (Free Access + Credits Granted)`
          }
        });
      }

      // Create notification for user
      await tx.notification.create({
        data: {
          userId,
          title: grantCredits ? 'Plan Assigned & Credits Added' : 'Plan Assigned',
          message: grantCredits 
            ? `Admin has assigned you the ${plan.name} plan for free. ${plan.credits} credits have been added to your account.`
            : `Admin has assigned you the ${plan.name} plan for free.`,
          type: 'INFO'
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'PLAN_ASSIGN_FREE',
          details: `Assigned free plan ${plan.name} to user ${targetUser.name} (${targetUser.id}). Credits added: ${grantCredits ? plan.credits : 0}`
        }
      });

      return { subscription, credits: updatedCredits };
    });

    return NextResponse.json({ 
      success: true, 
      message: grantCredits 
        ? `Plan ${plan.name} assigned and ${plan.credits} credits granted successfully`
        : `Plan ${plan.name} assigned successfully`,
      credits: result.credits
    });

  } catch (error: any) {
    console.error('Plan assignment error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
