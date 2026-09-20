import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, handleApiError } from '@/lib/auth-helpers';

export async function GET() {
  try {
    await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const settings = await prisma.siteSetting.findMany();
    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole(['SUPER_ADMIN', 'ADMIN']);
    const { key, value } = await req.json();

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'SITE_SETTING_CHANGE',
        details: `Updated ${key} to ${value}`
      }
    });

    return NextResponse.json({ setting });
  } catch (error) {
    return handleApiError(error);
  }
}
