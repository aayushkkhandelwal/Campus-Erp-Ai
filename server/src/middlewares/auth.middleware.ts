import type { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { validateSessionToken } from '../modules/auth/session.service';

export interface UserPayload {
  id: string;
  role: string;
  email: string;
  fullName: string;
  status: string;
  phone?: string | null;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Try Cookie Session Token first
    const cookieToken = req.cookies?.auth_session;

    if (cookieToken) {
      const user = await validateSessionToken(cookieToken);
      if (user) {
        req.user = {
          id: user.id,
          role: user.role,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
          phone: user.phone,
        };
        return next();
      }
    }

    // 2. Fallback to Authorization Header (JWT or Session Token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Check if it's a DB session token
      const sessionUser = await validateSessionToken(token);
      if (sessionUser) {
        req.user = {
          id: sessionUser.id,
          role: sessionUser.role,
          email: sessionUser.email,
          fullName: sessionUser.fullName,
          status: sessionUser.status,
          phone: sessionUser.phone,
        };
        return next();
      }

      // Try JWT verification fallback
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new Error('JWT_SECRET missing');
        }
        const decoded = jwt.verify(token, jwtSecret) as any;
        req.user = {
          id: decoded.id,
          role: decoded.role,
          email: decoded.email,
          fullName: decoded.fullName || 'User',
          status: decoded.status || 'ACTIVE',
        };
        return next();
      } catch {
        // Fall through to 401
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to continue.',
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token.',
    });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (req.user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended or disabled. Please contact the administrator.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};
