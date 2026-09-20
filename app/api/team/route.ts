import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { Role, MemberStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const FOUNDING_EMAILS = [
  'arnab@niramayah.in',
  'bikram@niramayah.in',
  'abhirup@niramayah.in',
  'riya@niramayah.in'
];

export async function GET() {
  try {
    const allUsers = await prisma.user.findMany({
      where: {
        OR: [
          { memberStatus: MemberStatus.LEADER },
          { memberStatus: MemberStatus.ACTIVE },
          { memberStatus: MemberStatus.GHOST }
        ],
        isCoreMember: true 
      }
    });

    return NextResponse.json({
      leaders: allUsers.filter(u => u.memberStatus === MemberStatus.LEADER),
      active: allUsers.filter(u => u.memberStatus === MemberStatus.ACTIVE),
      ghosts: allUsers.filter(u => u.memberStatus === MemberStatus.GHOST)
    });
  } catch (error) {
    console.error('Fetch team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireRole([Role.SUPER_ADMIN, Role.ADMIN]);
    const { userId, status, bio, githubUrl, linkedinUrl, profileImage, name, email, password, role, coreRoleTitle } = await req.json();

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Security Gate: Only Super Admin can edit LEADER status or details
    if (targetUser.memberStatus === MemberStatus.LEADER && session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can edit Leader section.' }, { status: 403 });
    }

    // Hashing password if provided
    let hashedPassword = undefined;
    if (password && session.role === Role.SUPER_ADMIN) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const currentEmail = (email || targetUser.email).toLowerCase();
    const isFounding = FOUNDING_EMAILS.includes(currentEmail);

    // Email Change & Account Cleanup Logic
    if (email && email.toLowerCase() !== targetUser.email.toLowerCase()) {
      const existingNewUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      
      if (existingNewUser) {
        // DELETE the old record first to avoid unique constraint issues if we were to move data,
        // but here we are basically "repointing" the Leader slot to an existing user.
        await prisma.user.delete({ where: { id: targetUser.id } });

        // Update the EXISTING user with the new data and make it a LEADER
        const mergedUser = await prisma.user.update({
          where: { id: existingNewUser.id },
          data: {
            name: name || undefined,
            password: hashedPassword || undefined,
            role: (session.role === Role.SUPER_ADMIN ? (role as Role) : undefined),
            memberStatus: MemberStatus.LEADER,
            bio: bio || undefined,
            githubUrl: githubUrl || undefined,
            linkedinUrl: linkedinUrl || undefined,
            profileImage: profileImage || undefined,
            coreRoleTitle: coreRoleTitle || undefined,
            isVerified: isFounding ? true : undefined,
            mustChangePass: isFounding ? false : undefined,
            isUnlimitedCredits: isFounding ? true : undefined,
            isCoreMember: true
          }
        });
        
        return NextResponse.json({ success: true, message: 'Account merged and old record purged.', user: mergedUser });
      }
    }

    // Standard Update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        email: email ? email.toLowerCase() : undefined,
        password: hashedPassword || undefined,
        role: (session.role === Role.SUPER_ADMIN ? (role as Role) : undefined),
        memberStatus: status || undefined,
        bio: bio || undefined,
        githubUrl: githubUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        profileImage: profileImage || undefined,
        coreRoleTitle: coreRoleTitle || undefined,
        isVerified: isFounding ? true : undefined,
        mustChangePass: isFounding ? false : undefined,
        isUnlimitedCredits: isFounding ? true : undefined,
        isCoreMember: true
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireRole([Role.SUPER_ADMIN]);
    const { userId } = await req.json();

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
