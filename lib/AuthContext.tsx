import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { api, ApiUser, tokenStore } from './api';
import { API_BASE_URL } from './config';

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  register: (name: string, email: string, password: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  adminLogin: (password: string) => Promise<void>;
  adminLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toUser(u: ApiUser): User {
  return { id: u.id, name: u.name, email: u.email, isAdmin: u.isAdmin ?? false };
}

function parseQueryParam(url: string, key: string): string | null {
  try {
    const u = new URL(url);
    return u.searchParams.get(key);
  } catch {
    const match = url.match(new RegExp(`[?&]${key}=([^&]+)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const [sessionToken, adminToken] = await Promise.all([
          tokenStore.getSession(),
          tokenStore.getAdmin(),
        ]);
        if (sessionToken) {
          const { user: u } = await api.auth.me();
          setUser(toUser(u));
        }
        if (adminToken) setIsAdmin(true);
      } catch {
        await tokenStore.clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user: u, token } = await api.auth.login(email.trim().toLowerCase(), password);
    await tokenStore.setSession(token);
    setUser(toUser(u));
  };

  const signInWithGoogle = async () => {
    const googleUrl = `${API_BASE_URL}/api/auth/google?mobile=true`;
    const result = await WebBrowser.openAuthSessionAsync(googleUrl, 'ziva://auth-callback');
    if (result.type !== 'success') return;

    const token = parseQueryParam(result.url, 'token');
    const id    = parseQueryParam(result.url, 'id');
    const name  = parseQueryParam(result.url, 'name');
    const email = parseQueryParam(result.url, 'email');

    if (!token || !id || !name || !email) {
      throw new Error('Google sign-in failed. Please try again.');
    }

    await tokenStore.setSession(token);
    setUser({ id, name, email, isAdmin: false });
  };

  const sendOtp = async (email: string) => {
    await api.auth.sendOtp(email.trim().toLowerCase());
  };

  const register = async (name: string, email: string, password: string, code: string) => {
    const { user: u, token } = await api.auth.signup(name.trim(), email.trim().toLowerCase(), password, code);
    await tokenStore.setSession(token);
    setUser(toUser(u));
  };

  const signOut = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    await tokenStore.clearSession();
    setUser(null);
  };

  const updateProfile = async (name: string) => {
    const { user: u } = await api.auth.updateProfile(name.trim());
    setUser(toUser(u));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.auth.changePassword(currentPassword, newPassword);
  };

  const deleteAccount = async () => {
    await api.auth.deleteAccount();
    await tokenStore.clearSession();
    setUser(null);
  };

  const adminLogin = async (password: string) => {
    const { token } = await api.admin.login(password);
    await tokenStore.setAdmin(token);
    setIsAdmin(true);
  };

  const adminLogout = async () => {
    try { await api.admin.logout(); } catch { /* ignore */ }
    await tokenStore.clearAdmin();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user, isAdmin, loading,
      signIn, signInWithGoogle, sendOtp, register, signOut,
      updateProfile, changePassword, deleteAccount,
      adminLogin, adminLogout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
