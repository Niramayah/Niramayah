import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const news = await prisma.news.findFirst({
      where: {
        slug: slug,
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
      }
    });

    if (!news) {
      return NextResponse.json({ success: false, message: 'News not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      news
    });
  } catch (error) {
    console.error("[PUBLIC_NEWS_DETAIL_GET]:", error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
