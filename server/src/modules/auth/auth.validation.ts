import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'FACULTY', 'STUDENT']).optional().default('STUDENT'),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

export const verify2FASchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Valid email address is required'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const updatePhoneSchema = z.object({
  phone: z.string().min(5, 'Valid phone number is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePhoneInput = z.infer<typeof updatePhoneSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;