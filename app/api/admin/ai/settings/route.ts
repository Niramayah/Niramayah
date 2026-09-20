import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requirePermission('aiManage');
    
    const settings = await prisma.siteSetting.findMany({
      where: {
        key: { in: ['ai_provider', 'ai_confidence_threshold'] }
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission('aiManage');
    const { provider, threshold } = await req.json();

    const updates = [
      prisma.siteSetting.upsert({
        where: { key: 'ai_provider' },
        update: { value: provider },
        create: { key: 'ai_provider', value: provider }
      }),
      prisma.siteSetting.upsert({
        where: { key: 'ai_confidence_threshold' },
        update: { value: threshold.toString() },
        create: { key: 'ai_confidence_threshold', value: threshold.toString() }
      })
    ];

    await prisma.$transaction(updates);

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_CONFIG_UPDATE',
        details: `Updated AI Provider to ${provider} and Threshold to ${threshold}%`
      }
    });

    return NextResponse.json({ message: 'AI configuration saved successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
