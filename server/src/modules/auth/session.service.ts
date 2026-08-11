import crypto from 'crypto';
import type { Response } from 'express';
import prisma from '../../prisma/client';

const SESSION_COOKIE_NAME = 'auth_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const createSession = async (
  userId: string,
  res: Response,
  ipAddress?: string,
  userAgent?: string
) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
    },
  });

  // Set secure HttpOnly cookie
  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });

  return rawToken;
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

export const validateSessionToken = async (rawToken: string) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    // Session expired, remove it
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  // Check account status
  if (session.user.status !== 'ACTIVE') {
    return null;
  }

  return session.user;
};

export const revokeUserSessions = async (userId: string) => {
  await prisma.session.deleteMany({
    where: { userId },
  });
};
