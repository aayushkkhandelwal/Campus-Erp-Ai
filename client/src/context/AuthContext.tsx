import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { authService, type LoginResult } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verify2FA: (userId: string, code: string) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; role?: 'ADMIN' | 'FACULTY' | 'STUDENT' }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getProfile();
        setUser(userData);
        if (!token) setToken('session-active');
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const result = await authService.login({ email, password });
    if (!result.requires2FA && result.user) {
      const newToken = result.token || 'session-active';
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      setToken(newToken);
      setUser(result.user);
    }
    return result;
  };

  const verify2FA = async (userId: string, code: string) => {
    const result = await authService.verify2FA(userId, code);
    const newToken = result.token || 'session-active';
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    setToken(newToken);
    setUser(result.user);
  };

  const register = async (data: { fullName: string; email: string; password: string; role?: 'ADMIN' | 'FACULTY' | 'STUDENT' }) => {
    const result = await authService.register(data);
    const newToken = result.token || 'session-active';
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    setToken(newToken);
    setUser(result.user);
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        verify2FA,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      token: null,
      loading: false,
      login: async () => ({}),
      verify2FA: async () => {},
      register: async () => {},
      logout: async () => {},
      isAuthenticated: false,
    };
  }
  return context;
};
