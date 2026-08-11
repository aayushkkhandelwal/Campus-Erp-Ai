import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../../prisma/client';
import { emailService } from '../../services/email.service';
import { smsService } from '../../services/sms.service';

export const generateAndSendOtp = async (
  userId: string,
  email: string,
  purpose: string = 'LOGIN_2FA',
  phone?: string
) => {
  // Generate cryptographically secure 6-digit OTP
  const rawCode = crypto.randomInt(100000, 999999).toString();
  const codeHash = await bcrypt.hash(rawCode, 10);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  // Invalidate any existing unused OTPs for this user & purpose
  await prisma.oTPVerification.deleteMany({
    where: {
      userId,
      purpose,
      usedAt: null,
    },
  });

  // Create new OTP record
  await prisma.oTPVerification.create({
    data: {
      userId,
      codeHash,
      purpose,
      expiresAt,
      attempts: 0,
    },
  });

  // Send via Email Service
  await emailService.sendOtp(email, rawCode, purpose);

  // Send via SMS if phone is provided
  if (phone) {
    await smsService.sendOtp(phone, rawCode, purpose);
  }

  return { success: true, expiresAt, code: rawCode };
};

export const verifyOtpCode = async (userId: string, code: string, purpose: string = 'LOGIN_2FA'): Promise<boolean> => {
  const otpRecord = await prisma.oTPVerification.findFirst({
    where: {
      userId,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    return false;
  }

  // Check attempt limit
  if (otpRecord.attempts >= 3) {
    // Invalidate due to too many attempts
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });
    return false;
  }

  const isValid = await bcrypt.compare(code, otpRecord.codeHash);

  if (!isValid) {
    // Increment attempts
    await prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  // Mark as used
  await prisma.oTPVerification.update({
    where: { id: otpRecord.id },
    data: { usedAt: new Date() },
  });

  return true;
};
