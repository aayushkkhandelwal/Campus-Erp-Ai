import bcrypt from 'bcrypt';
import type { Response } from 'express';
import prisma from '../../prisma/client';
import type {
  LoginInput,
  RegisterInput,
  Verify2FAInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './auth.validation';
import { generateAndSendOtp, verifyOtpCode } from './otp.service';
import { createSession, revokeUserSessions, clearSessionCookie } from './session.service';
import { createAuditLog } from '../../services/audit.service';

export const registerUser = async (data: RegisterInput, ipAddress?: string) => {
  const cleanEmail = (data.email || '').toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: data.phone || null,
      role: data.role || 'STUDENT',
      status: 'ACTIVE',
      mustChangePassword: true,
    } as any,
  });

  await createAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'USER_REGISTERED',
    resource: 'auth',
    details: { email: user.email, role: user.role },
    ipAddress,
  });

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  };
};

interface AttemptRecord {
  count: number;
  lockoutUntil?: number;
}

const failedAttemptsMap = new Map<string, AttemptRecord>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const loginUser = async (data: LoginInput, res: Response, ipAddress?: string, userAgent?: string) => {
  const emailKey = (data.email || '').toLowerCase().trim();
  const attemptRecord = failedAttemptsMap.get(emailKey);
  const now = Date.now();

  if (attemptRecord && attemptRecord.lockoutUntil && attemptRecord.lockoutUntil > now) {
    const remainingSeconds = Math.ceil((attemptRecord.lockoutUntil - now) / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    const timeLabel = remainingSeconds > 60 ? `${remainingMinutes} minutes` : `${remainingSeconds} seconds`;
    const err: any = new Error(`Too many failed login attempts. Please try again after ${timeLabel}.`);
    err.statusCode = 429;
    err.lockoutUntil = attemptRecord.lockoutUntil;
    err.remainingSeconds = remainingSeconds;
    err.attemptsLeft = 0;
    throw err;
  }

  const handleFailedAttempt = async (userObj?: any, reason: string = 'Invalid credentials') => {
    const currentCount = (failedAttemptsMap.get(emailKey)?.count || 0) + 1;
    await createAuditLog({
      userId: userObj?.id,
      userRole: userObj?.role,
      action: 'LOGIN_FAILED',
      resource: 'auth',
      details: { email: data.email, reason, attemptCount: currentCount },
      ipAddress,
    });

    if (currentCount >= MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      failedAttemptsMap.set(emailKey, { count: currentCount, lockoutUntil });
      const remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      const err: any = new Error(`Too many failed login attempts. Account temporarily locked for 15 minutes.`);
      err.statusCode = 429;
      err.lockoutUntil = lockoutUntil;
      err.remainingSeconds = remainingSeconds;
      err.attemptsLeft = 0;
      throw err;
    } else {
      failedAttemptsMap.set(emailKey, { count: currentCount });
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - currentCount;
      const attemptLabel = attemptsLeft === 1 ? 'attempt' : 'attempts';
      const err: any = new Error(`Invalid email or password. ${attemptsLeft} ${attemptLabel} remaining.`);
      err.statusCode = 401;
      err.attemptsLeft = attemptsLeft;
      throw err;
    }
  };

  const user = await prisma.user.findUnique({
    where: { email: emailKey },
  });



  if (!user) {
    await handleFailedAttempt(undefined, 'User not found');
    throw new Error('Invalid email or password');
  }

  // Account status check
  if (user.status !== 'ACTIVE') {
    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'LOGIN_BLOCKED',
      resource: 'auth',
      details: { email: user.email, status: user.status },
      ipAddress,
    });
    throw new Error(`Your account status is ${user.status}. Access denied.`);
  }

  let isPasswordValid = false;
  try {
    isPasswordValid = await bcrypt.compare(data.password, user.password);
  } catch (e: any) {
    console.error('bcrypt.compare error:', e.message);
    isPasswordValid = false;
  }



  if (!isPasswordValid) {
    await handleFailedAttempt(user, 'Invalid password');
    throw new Error('Invalid email or password');
  }

  // Clear failed attempt counter on successful login
  failedAttemptsMap.delete(emailKey);

  // 2FA Flow
  if (user.twoFactorEnabled) {
    await generateAndSendOtp(user.id, user.email, 'LOGIN_2FA', user.phone || undefined);

    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: '2FA_OTP_SENT',
      resource: 'auth',
      ipAddress,
    });

    return {
      requires2FA: true,
      userId: user.id,
      message: `2FA verification code sent to your registered email (${user.email}).`,
    };
  }

  // Create Cookie Session
  const sessionToken = await createSession(user.id, res, ipAddress, userAgent);

  await createAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'LOGIN_SUCCESS',
    resource: 'auth',
    ipAddress,
  });

  return {
    requires2FA: false,
    token: sessionToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      twoFactorEnabled: user.twoFactorEnabled,
      mustChangePassword: !!(user as any).mustChangePassword,
      createdAt: user.createdAt,
    },
  };
};

export const verify2FA = async (data: Verify2FAInput, res: Response, ipAddress?: string, userAgent?: string) => {
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new Error('User account is invalid or inactive');
  }

  const isValid = await verifyOtpCode(user.id, data.code, 'LOGIN_2FA');
  if (!isValid) {
    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: '2FA_FAILED',
      resource: 'auth',
      ipAddress,
    });
    throw new Error('Invalid or expired 2FA code. Please try again.');
  }

  // Create Session
  const sessionToken = await createSession(user.id, res, ipAddress, userAgent);

  await createAuditLog({
    userId: user.id,
    userRole: user.role,
    action: '2FA_SUCCESS',
    resource: 'auth',
    ipAddress,
  });

  return {
    token: sessionToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      twoFactorEnabled: user.twoFactorEnabled,
      mustChangePassword: !!(user as any).mustChangePassword,
      createdAt: user.createdAt,
    },
  };
};

export const forgotPassword = async (data: ForgotPasswordInput, ipAddress?: string) => {
  const cleanEmail = (data.email || '').toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  // Non-enumerating response to protect against account enumeration attacks
  const genericMessage = 'If an eligible account exists with this email, a password reset code has been sent.';

  if (!user || user.status !== 'ACTIVE') {
    return { message: genericMessage };
  }

  await generateAndSendOtp(user.id, user.email, 'PASSWORD_RESET', user.phone || undefined);

  await createAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'PASSWORD_RESET_REQUESTED',
    resource: 'auth',
    ipAddress,
  });

  return { message: genericMessage, userId: user.id };
};

export const resetPassword = async (data: ResetPasswordInput, ipAddress?: string) => {
  const cleanEmail = (data.email || '').toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new Error('Invalid email or expired reset token');
  }

  const isValid = await verifyOtpCode(user.id, data.code, 'PASSWORD_RESET');
  if (!isValid) {
    throw new Error('Invalid or expired reset code');
  }

  const newHash = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: newHash },
  });

  // Revoke all existing active sessions
  await revokeUserSessions(user.id);

  await createAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'PASSWORD_RESET_SUCCESS',
    resource: 'auth',
    ipAddress,
  });

  return { success: true, message: 'Password reset successfully. Please log in with your new password.' };
};

export const toggle2FA = async (userId: string, enable: boolean) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: enable },
  });

  await createAuditLog({
    userId: user.id,
    userRole: user.role,
    action: enable ? '2FA_ENABLED' : '2FA_DISABLED',
    resource: 'auth',
  });

  return { success: true, twoFactorEnabled: user.twoFactorEnabled };
};

export const logoutUser = async (res: Response) => {
  clearSessionCookie(res);
  return { success: true, message: 'Logged out successfully' };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    mustChangePassword: !!(user as any).mustChangePassword,
    createdAt: user.createdAt,
  };
};

export const changePassword = async (userId: string, data: ChangePasswordInput, ipAddress?: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new Error('User account is invalid or inactive');
  }

  const isCurrentValid = await bcrypt.compare(data.currentPassword, user.password);
  if (!isCurrentValid) {
    throw new Error('Current password is incorrect');
  }

  const newHash = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: newHash,
      mustChangePassword: false,
    } as any,
  });

  await createAuditLog({
    userId: user.id,
    userRole: user.role,
    action: 'PASSWORD_CHANGE_SUCCESS',
    resource: 'auth',
    ipAddress,
  });

  return { success: true, message: 'Password changed successfully' };
};