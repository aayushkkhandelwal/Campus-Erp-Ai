import type { Request, Response } from 'express';
import type { AuthRequest } from '../../middlewares/auth.middleware';
import {
  loginUser,
  registerUser,
  verify2FA as verify2FAService,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
  toggle2FA as toggle2FAService,
  logoutUser,
  getUserById,
} from './auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const user = await registerUser(req.body, ipAddress);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await loginUser(req.body, res, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      message: result.requires2FA ? '2FA Code Sent' : 'Login successful',
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 401;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Invalid credentials',
      lockoutUntil: error.lockoutUntil || null,
      remainingSeconds: error.remainingSeconds || null,
      attemptsLeft: typeof error.attemptsLeft === 'number' ? error.attemptsLeft : null,
    });
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await verify2FAService(req.body, res, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      message: '2FA Verification Successful',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || '2FA Verification Failed',
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await forgotPasswordService(req.body, ipAddress);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process password reset request',
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await resetPasswordService(req.body, ipAddress);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Password reset failed',
    });
  }
};

export const toggle2FA = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { enable } = req.body;
    const result = await toggle2FAService(req.user.id, !!enable);

    res.status(200).json({
      success: true,
      message: result.twoFactorEnabled ? '2FA enabled successfully' : '2FA disabled successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to toggle 2FA',
    });
  }
};

export const logout = async (_req: Request, res: Response) => {
  const result = await logoutUser(res);
  res.status(200).json({
    success: true,
    message: result.message,
  });
};

export const profile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const user = await getUserById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
