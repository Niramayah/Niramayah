import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        isCoreMember: true,
        coreRoleTitle: true,
        profile: true
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { targetUserId, name, email, profileImage, age, gender, height, weight, bloodType } = body;

    const finalUserId = (session.role === 'SUPER_ADMIN' && targetUserId) ? targetUserId : session.userId;

    const [updatedUser, updatedProfile] = await prisma.$transaction([
      // Update User fields
      prisma.user.update({
        where: { id: finalUserId },
        data: { 
          name: name || undefined,
          email: email || undefined,
          profileImage: profileImage || undefined
        }
      }),
      // Upsert Profile
      prisma.profile.upsert({
        where: { userId: finalUserId },
        create: {
          userId: finalUserId,
          age: age ? parseInt(age) : null,
          gender: gender || null,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          bloodType: bloodType || null
        },
        update: {
          age: age ? parseInt(age) : null,
          gender: gender || null,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          bloodType: bloodType || null
        }
      })
    ]);

    // Notifications & Logs
    await prisma.notification.create({
      data: {
        userId: finalUserId,
        title: 'Profile Updated',
        message: 'Your personal information has been updated.',
        type: 'SUCCESS'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'PROFILE_UPDATE',
        details: `Updated profile for user ${finalUserId}. Fields: ${Object.keys(body).join(', ')}`
      }
    });

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: { ...updatedUser, profile: updatedProfile } 
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
