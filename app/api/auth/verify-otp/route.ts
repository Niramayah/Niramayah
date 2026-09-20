import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      message: 'Verification code is valid'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
