import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const news = await prisma.news.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null
      },
      include: {
        author: {
          select: {
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      success: true,
      news
    });
  } catch (error) {
    console.error("[PUBLIC_NEWS_GET]:", error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
