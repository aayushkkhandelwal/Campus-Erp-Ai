import api from './api';
import type { LoginCredentials, RegisterData, User, AuthResponse } from '../types';

export interface LoginResult {
  requires2FA?: boolean;
  userId?: string;
  token?: string;
  user?: User;
  message?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data?.data || response.data;
    } catch (error: any) {
      if (error.response) {
        const err: any = new Error(error.response.data?.message || 'Invalid email or password');
        err.response = error.response;
        err.lockoutUntil = error.response.data?.lockoutUntil;
        err.remainingSeconds = error.response.data?.remainingSeconds;
        err.attemptsLeft = error.response.data?.attemptsLeft;
        throw err;
      }
      throw error;
    }
  },

  async verify2FA(userId: string, code: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/verify-2fa', { userId, code });
      return response.data?.data || response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Invalid verification code');
      }
      throw error;
    }
  },

  async forgotPassword(email: string): Promise<{ message: string; userId?: string }> {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data?.data || response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to request password reset');
      }
      throw error;
    }
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/reset-password', { email, code, newPassword });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Password reset failed');
      }
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to change password');
      }
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', data);
      return response.data?.data || response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Registration failed');
      }
      throw error;
    }
  },

  async toggle2FA(enable: boolean): Promise<{ twoFactorEnabled: boolean }> {
    try {
      const response = await api.post('/auth/toggle-2fa', { enable });
      return response.data?.data || response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to update 2FA setting');
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await api.get('/auth/profile');
      if (response.data?.data) return response.data.data;
      if (response.data?.user) return response.data.user;
    } catch {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch {
          // ignore
        }
      }
    }

    throw new Error('Unauthenticated');
  },
};
