'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  AUTH_STORAGE,
  api,
  clearAuthSession,
  persistAuthSession,
} from '@/lib/api-client';

export interface UserCompany {
  company_id: string;
  company_name: string;
  is_primary: boolean;
}

export interface User {
  userId: string;
  fullName: string;
  name: string;
  email: string;
  userType: string;
  companyId: string;
  tenantId: string;
  companies: UserCompany[];
  permissions: unknown[];
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: Omit<User, 'name'> & { name?: string };
  mfa_required?: boolean;
}

interface SignupInput {
  tenantName: string;
  tenantCode: string;
  name: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (input: SignupInput) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeUser(user: AuthResponse['user']): User {
  return {
    ...user,
    name: user.fullName || user.name || user.email,
    companies: user.companies || [],
    permissions: user.permissions || [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE.user);
      if (stored) setUser(normalizeUser(JSON.parse(stored)));
    } catch {
      clearAuthSession();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    if (!response.access_token || response.mfa_required) {
      throw new Error('MFA verification is required for this account.');
    }
    const nextUser = normalizeUser(response.user);
    persistAuthSession({ ...response, user: nextUser });
    setUser(nextUser);
    return nextUser;
  }, []);

  const signup = useCallback(
    async (input: SignupInput) => {
      await api.post<{ tenant_id: string }>('/tenant/signup', {
        tenant_code: input.tenantCode,
        tenant_name: input.tenantName,
        tenant_type: 'SME',
        plan_id: 'PLAN_PRO',
        billing_email: input.email,
        admin_name: input.name,
        admin_email: input.email,
        admin_password: input.password,
      });
      return login(input.email, input.password);
    },
    [login],
  );

  const logout = useCallback(() => {
    setUser(null);
    clearAuthSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
