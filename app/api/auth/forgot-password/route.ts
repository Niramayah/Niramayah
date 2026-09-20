import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate a new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update the user: set the OTP and temporarily set isVerified to false so the verify-email page can process it
    await prisma.user.update({
      where: { email },
      data: {
        otpCode: otp,
        otpExpires: otpExpires,
        isVerified: false
      }
    });

    // Send the OTP via email
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset OTP sent to your email',
      email: user.email
    });

  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
