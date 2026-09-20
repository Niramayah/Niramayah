import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const blog = await prisma.blog.findFirst({
      where: {
        slug: slug,
        status: 'PUBLISHED',
        deletedAt: null
      },
      include: {
        category: true,
        author: {
          select: {
            name: true,
            profileImage: true
          }
        }
      }
    });

    if (!blog) {
      return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      blog
    });
  } catch (error) {
    console.error("[PUBLIC_BLOG_DETAIL_GET]:", error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
