import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: 'Password does not meet the strength criteria.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.otpCode !== otp) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password, set isVerified to true, and clear OTP
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        isVerified: true,
        otpCode: null,
        otpExpires: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. You can now log in.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
