import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.MAIL_PORT || '2525'),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: '"NIRAMAYAH AI" <no-reply@niramayah.in>',
    to: email,
    subject: 'Verify your NIRAMAYAH account',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e0e0e0; border-radius: 20px;">
        <h2 style="color: #071a38; text-align: center;">Welcome to NIRAMAYAH</h2>
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">Thank you for signing up for NIRAMAYAH Precision Cardiac AI. To complete your registration, please verify your email address using the code below:</p>
        <div style="background: #f8fafc; border: 2px dashed #00856f; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #00856f;">${otp}</span>
        </div>
        <p style="color: #718096; font-size: 12px; text-align: center;">This code will expire in 10 minutes. If you did not sign up for this account, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 30px 0;">
        <p style="text-align: center; color: #a0aec0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">NIRAMAYAH • Precision Cardiac AI • Made in India</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};
