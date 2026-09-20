import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authCache } from '@/lib/auth-cache';

function validatePassword(password: string): boolean {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const validLength = password.length >= 8 && password.length <= 16;
  return hasUppercase && hasLowercase && hasNumber && hasSpecial && validLength;
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Password strength check
    if (!validatePassword(password)) {
      return NextResponse.json({ error: 'Password does not meet the strength criteria.' }, { status: 400 });
    }

    // --- BACKGROUND CLEANUP TASK ---
    // Automatically delete unverified accounts older than 24 hours
    try {
      await prisma.user.deleteMany({
        where: {
          isVerified: false,
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });
    } catch (cleanupError) {
      console.error("Failed to clean up old unverified accounts:", cleanupError);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 });
    }

    // God Exception: Super Admin Bypass
    const isSuperAdminDomain = email.toLowerCase().endsWith('@niramayah.in');

    // Verification check
    if (!isSuperAdminDomain && !authCache.isEmailVerified(email)) {
      return NextResponse.json({ error: 'Email has not been verified.' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        credits: 100,
        role: isSuperAdminDomain ? 'SUPER_ADMIN' : 'USER',
        isVerified: true, // Verified inline
        otpCode: null,
        otpExpires: null,
        isUnlimitedCredits: isSuperAdminDomain
      }
    });

    // Clear verification cache
    if (!isSuperAdminDomain) {
      authCache.clearRegistration(email);
    }

    return NextResponse.json({
      message: isSuperAdminDomain ? 'Super Admin account created' : 'Account created successfully',
      requiresVerification: false,
      email: user.email
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
