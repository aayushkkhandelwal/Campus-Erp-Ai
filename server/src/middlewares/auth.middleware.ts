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
  mustChangePassword?: boolean;
  collegeId?: string | null;
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
          mustChangePassword: !!(user as any).mustChangePassword,
          collegeId: (user as any).collegeId || null,
        };
      }
    }

    // 2. Fallback to Authorization Header (JWT or Session Token) if no valid cookie user
    if (!req.user) {
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
            mustChangePassword: !!(sessionUser as any).mustChangePassword,
            collegeId: (sessionUser as any).collegeId || null,
          };
        } else {
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
              mustChangePassword: !!decoded.mustChangePassword,
              collegeId: decoded.collegeId || null,
            };
          } catch {
            // Fall through to 401
          }
        }
      }
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in to continue.',
      });
    }

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token.',
    });
  }
};

/**
 * Resolves the collegeId for database query tenant isolation.
 * SECURITY ENFORCEMENT: Client-supplied collegeId is ONLY honored if user is SUPER_ADMIN.
 * Otherwise, the query is strictly bound to req.user.collegeId regardless of input parameters.
 */
export function getTenantCollegeId(req: AuthRequest): string {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  console.log(`[TenantGuard] User: ${req.user.email}, Role: ${req.user.role}, Session CollegeId: ${req.user.collegeId}`);

  // Enforce isolation boundary: Only honor client-supplied parameters if role is SUPER_ADMIN
  if (req.user.role === 'SUPER_ADMIN') {
    const clientTargetId = (req.query.collegeId as string) || (req.body.collegeId as string);
    if (clientTargetId) {
      console.log(`[TenantGuard] Super Admin overriding to target collegeId: ${clientTargetId}`);
      return clientTargetId;
    }
  }

  // For all standard tenants (ADMIN, FACULTY, STUDENT), strictly default to user's assigned context
  const collegeId = req.user.collegeId;
  if (!collegeId) {
    throw new Error('Access Denied: Tenant context missing from user session');
  }

  return collegeId;
}

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
