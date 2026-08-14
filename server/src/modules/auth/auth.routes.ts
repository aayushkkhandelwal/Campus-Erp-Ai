import { Router } from 'express';
import {
  login,
  profile,
  register,
  verify2FA,
  forgotPassword,
  resetPassword,
  changePassword,
  toggle2FA,
  logout,
} from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authLimiter, otpLimiter } from '../../middlewares/rateLimiter.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  verify2FASchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validation';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), register);
router.post('/login', authLimiter, validateRequest(loginSchema), login);
router.post('/verify-2fa', authLimiter, validateRequest(verify2FASchema), verify2FA);
router.post('/forgot-password', otpLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validateRequest(resetPasswordSchema), resetPassword);
router.post('/change-password', authenticate, authLimiter, validateRequest(changePasswordSchema), changePassword);
router.post('/toggle-2fa', authenticate, toggle2FA);
router.post('/logout', logout);
router.get('/profile', authenticate, profile);

export default router;