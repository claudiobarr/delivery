'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name?: string; phone?: string; isPartner?: boolean; storeName?: string; storeDescription?: string; cnpj?: string }) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  loginWithApple: (token: string) => Promise<void>;
  loginWithBiometry: () => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isPartner: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getProfile()
        .then((res: any) => setUser(res.user || res))
        .catch(() => api.setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
  };

  const register = async (data: { email: string; password: string; name?: string; phone?: string; isPartner?: boolean; storeName?: string; storeDescription?: string; cnpj?: string }) => {
    const res = await api.register(data);
    setUser(res.user);
  };

  const loginWithGoogle = async (token: string) => {
    const res = await api.googleLogin(token);
    setUser(res.user);
  };

  const loginWithApple = async (token: string) => {
    const res = await api.appleLogin(token);
    setUser(res.user);
  };

  const loginWithBiometry = async () => {
    const { startAuthentication } = await import('@simplewebauthn/browser');
    const options = await api.passkeyLoginOptions();
    const response = await startAuthentication(options);
    const res = await api.passkeyLoginVerify(response);
    setUser(res.user);
  };

  const logout = () => {
    api.logout().catch(() => {});
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        loginWithApple,
        loginWithBiometry,
        logout,
        isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
        isPartner: user?.role === 'PARTNER',
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
