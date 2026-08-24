import nodemailer from 'nodemailer';

// Create transporter using provided credentials
const createTransporter = () => {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS || process.env.MAIL_PASSWORD;
  const host = process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.MAIL_PORT || '465');

  if (!user || !pass) {
    return null;
  }
  
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

export const sendPasswordResetEmail = async (email: string, otp: string) => {
  const transporter = createTransporter();
  
  const subject = 'TalkFlow Password Reset OTP';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">TalkFlow</h2>
      <h3 style="color: #333;">Password Reset Request</h3>
      <p style="color: #555; font-size: 16px;">Hello,</p>
      <p style="color: #555; font-size: 16px;">We received a request to reset your TalkFlow password.</p>
      <p style="color: #555; font-size: 16px;">Your verification code is:</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
      </div>
      <p style="color: #555; font-size: 16px;">This OTP will expire in 10 minutes.</p>
      <p style="color: #555; font-size: 16px;">If you did not request a password reset, you can safely ignore this email.</p>
      <p style="color: #555; font-size: 14px; margin-top: 30px;">For security reasons, never share this OTP with anyone.</p>
      <p style="color: #777; font-size: 14px; text-align: center; margin-top: 40px;">Thanks,<br>TalkFlow Team</p>
    </div>
  `;

  if (!transporter) {
    console.warn('\n=========================================');
    console.warn(`[DEV MODE] Password Reset OTP for ${email}`);
    console.warn(`OTP: ${otp}`);
    console.warn('Set MAIL_HOST, MAIL_USER, MAIL_PASSWORD in .env to send real emails.');
    console.warn('=========================================\n');
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || '"TalkFlow" <noreply@talkflow.com>',
      to: email,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Could not send email');
  }
};
