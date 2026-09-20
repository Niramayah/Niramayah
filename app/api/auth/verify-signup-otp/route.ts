import { NextResponse } from 'next/server';
import { authCache } from '@/lib/auth-cache';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const isValid = authCache.verifyRegistrationOtp(email, otp);

    if (!isValid) {
      const reg = authCache.getRegistration(email);
      if (reg && Date.now() > reg.expires) {
        return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email successfully verified'
    });

  } catch (error) {
    console.error('Verify signup OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
