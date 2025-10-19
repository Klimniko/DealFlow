import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { fetchMe, login as loginApi, logout as logoutApi } from '../api/auth';
import type { User, Permission } from '../types/user';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetchMe()
      .then((payload) => {
        if (!ignore) {
          setUser(payload);
        }
      })
      .catch(() => {
        if (!ignore) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const validated = loginSchema.parse({ email, password });
    const response = await loginApi(validated);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      if (user.permissions.includes('*')) return true;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const value = useMemo(() => ({ user, isLoading, login, logout, hasPermission }), [
    user,
    isLoading,
    login,
    logout,
    hasPermission,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
