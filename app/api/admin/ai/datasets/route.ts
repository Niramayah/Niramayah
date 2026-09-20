import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requirePermission('aiManage');
    const datasets = await prisma.aiTrainingDataset.findMany({
      orderBy: { uploadedAt: 'desc' }
    });
    return NextResponse.json({ datasets });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission('aiManage');
    const { name, dataUrl } = await req.json();

    const dataset = await prisma.aiTrainingDataset.create({
      data: { name, dataUrl }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'AI_DATASET_UPLOAD',
        details: `Uploaded new dataset: ${name}`
      }
    });

    return NextResponse.json({ dataset });
  } catch (error) {
    return handleApiError(error);
  }
}
