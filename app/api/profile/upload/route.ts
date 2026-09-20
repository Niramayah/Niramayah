import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string || session.userId;

    // Check permission if trying to update someone else
    if (userId !== session.userId && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG and WEBP allowed.' }, { status: 400 });
    }

    // Limit size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large. Max 2MB allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profile');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filename = `${userId}-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`;
    const filePath = join(uploadDir, filename);
    const dbPath = `/uploads/profile/${filename}`;

    await writeFile(filePath, buffer);

    // Update database
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: dbPath }
    });

    // MASTER LOGO MANAGEMENT: If SUPER_ADMIN updates their own profile, it becomes the site logo
    if (session.role === 'SUPER_ADMIN' && userId === session.userId) {
      await prisma.siteSetting.upsert({
        where: { key: 'masterFaviconUrl' },
        update: { value: dbPath },
        create: { key: 'masterFaviconUrl', value: dbPath }
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: session.role === 'SUPER_ADMIN' && userId === session.userId ? 'MASTER_LOGO_UPDATE' : 'PROFILE_IMAGE_UPLOAD',
        details: session.role === 'SUPER_ADMIN' && userId === session.userId 
          ? `Super Admin updated profile and master site logo. Path: ${dbPath}`
          : `Uploaded new profile image for user ${userId}. Path: ${dbPath}`
      }
    });

    return NextResponse.json({ 
      message: 'Profile image uploaded successfully',
      path: dbPath
    });

  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
