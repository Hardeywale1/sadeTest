import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ClinicianSettings, DemoRole, Subscription, SubscriptionPlan, User } from '../types';
import { authApi } from '../api/authApi';
import { profileApi } from '../api/profileApi';
import { storage, TOKEN_KEYS } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Display name to greet the user with, already trimmed to a first name. */
  greetingName: string;
  login: (email: string, password: string) => Promise<User>;
  loginDemo: (role: DemoRole) => Promise<User>;
  signup: (email: string, password: string, displayName: string, accountType?: 'patient' | 'laboratory' | 'clinician', clinician?: ClinicianSignup, plan?: SubscriptionPlan) => Promise<User>;
  logout: () => Promise<void>;
  exitDemo: () => Promise<void>;
  /** Re-reads the profile so a renamed account is reflected everywhere. */
  refreshUser: () => Promise<void>;
  applySubscription: (subscription: Subscription) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export type ClinicianSignup = { professional_title?: string; medical_license_number?: string; nin?: string; bvn?: string; license_document_url?: string; identity_document_url?: string; clinician_settings?: ClinicianSettings };

/**
 * Falls back through display name → email local part so the greeting is always
 * the person's own name rather than a generic label.
 */
export const resolveGreetingName = (user: User | null): string => {
  const displayName = (user?.display_name || '').trim();
  if (displayName) return displayName.split(/\s+/)[0];
  const emailName = (user?.email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (emailName) return emailName.split(/\s+/)[0].replace(/^./, (char) => char.toUpperCase());
  return 'there';
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // The cached user blob can predate a profile rename, so re-read the profile and
  // keep the stored copy in step with it.
  const syncProfile = useCallback(async () => {
    try {
      const profile = await profileApi.getProfile();
      if (!profile?.display_name) return;
      setUser((current) => {
        if (!current || current.display_name === profile.display_name) return current;
        const next = { ...current, display_name: profile.display_name };
        void storage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(next));
        return next;
      });
    } catch {
      // Offline or unauthenticated: the cached display name is good enough.
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await storage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
        const userData = await storage.getItem(TOKEN_KEYS.USER_DATA);
        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (err) {
        console.warn('Auth init failed:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (user) void syncProfile();
  }, [user?.id, syncProfile]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setUser(res.user);
    return res.user;
  };

  const loginDemo = async (role: DemoRole) => {
    const res = await authApi.demoLogin(role);
    setUser(res.user);
    return res.user;
  };

  const signup = async (email: string, password: string, displayName: string, accountType: 'patient' | 'laboratory' | 'clinician' = 'patient', clinician: ClinicianSignup = {}, plan?: SubscriptionPlan) => {
    const res = await authApi.signup({
      email,
      password,
      display_name: displayName,
      account_type: accountType,
      ...clinician,
      ...(accountType === 'patient' && plan ? { plan } : {}),
    });
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      await storage.clearAuth();
    } finally {
      setUser(null);
    }
  };

  const exitDemo = async () => {
    await storage.clearAuth();
    setUser(null);
  };

  const applySubscription = async (subscription: Subscription) => {
    if (!user) return;
    const next = { ...user, subscription };
    setUser(next);
    await storage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(next));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        greetingName: resolveGreetingName(user),
        login,
        loginDemo,
        signup,
        logout,
        exitDemo,
        refreshUser: syncProfile,
        applySubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
