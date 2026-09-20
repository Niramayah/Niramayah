import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Missing email or OTP' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: 'User already verified' }, { status: 200 });
    }

    // Check if OTP matches and is not expired
    if (user.otpCode !== otp) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Mark as verified and clear OTP
    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpires: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
