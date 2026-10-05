import nodemailer from 'nodemailer';
import { prisma } from '../index.js';
import crypto from 'crypto';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendVerificationEmail(email: string, username: string, token: string): Promise<void> {
  const transporterInstance = getTransporter();
  
  if (!transporterInstance) {
    console.log('=== EMAIL VERIFICATION (DEV MODE) ===');
    console.log(`To: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Verify URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`);
    console.log('=== END EMAIL ===');
    return;
  }
  
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  await transporterInstance.sendMail({
    from: process.env.EMAIL_FROM || '"Face Voting System" <noreply@facevoting.local>',
    to: email,
    subject: 'Verify your email for Face Voting System',
    html: `
      <h1>Welcome to Face Voting System, ${username}!</h1>
      <p>Please click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `,
  });
}

export async function createVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerification.upsert({
    where: { userId },
    create: {
      userId,
      tokenHash,
      expiresAt,
    },
    update: {
      tokenHash,
      expiresAt,
      usedAt: null,
    },
  });

  return token;
}

export async function verifyEmailToken(token: string): Promise<{ userId: string } | null> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const verification = await prisma.emailVerification.findUnique({
    where: { tokenHash },
  });

  if (!verification || verification.usedAt || verification.expiresAt < new Date()) {
    return null;
  }

  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { usedAt: new Date() },
  });

  await prisma.user.update({
    where: { id: verification.userId },
    data: { emailVerified: true },
  });

  return { userId: verification.userId };
}