import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';
import { authCache } from '@/lib/auth-cache';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    // Check rate limit/lockout
    const limit = authCache.getLoginFailures(email);
    if (limit.lockoutUntil && Date.now() < limit.lockoutUntil) {
      return NextResponse.json({
        error: `Too many login attempts. Account temporarily locked.`,
        lockoutUntil: limit.lockoutUntil
      }, { status: 429 });
    }

    // --- SEED DEFAULT ADMIN IF MISSING ---
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedAdminPassword = await bcrypt.hash('Niramayah@4', 10);
      await prisma.user.create({
        data: {
          name: 'Niramayah Admin',
          email: 'admin@niramayah.in',
          password: hashedAdminPassword,
          role: 'SUPER_ADMIN',
          credits: 999999,
          isUnlimitedCredits: true,
          isVerified: true
        }
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      const record = authCache.recordLoginFailure(email);
      if (record.lockoutUntil) {
        return NextResponse.json({
          error: `Too many login attempts. Account temporarily locked.`,
          lockoutUntil: record.lockoutUntil
        }, { status: 429 });
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const record = authCache.recordLoginFailure(email);
      if (record.lockoutUntil) {
        return NextResponse.json({
          error: `Too many login attempts. Account temporarily locked.`,
          lockoutUntil: record.lockoutUntil
        }, { status: 429 });
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Reset login failures on successful password verification
    authCache.resetLoginFailures(email);

    // VERIFICATION CHECK: God Exception for SUPER_ADMIN
    if (!user.isVerified && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Please verify your email to log in.', 
        requiresVerification: true,
        email: user.email 
      }, { status: 403 });
    }

    // Create session
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Fetch user data for response
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        credits: true,
        isUnlimitedCredits: true,
        permissions: {
          where: { enabled: true },
          select: { permissionKey: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
