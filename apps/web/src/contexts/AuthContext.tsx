'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearAuthSession, persistAuthSession } from '@/lib/api-client';
import {
  NavUser,
  getStoredUser,
  setActiveWorkspaceScope,
  setActiveCompanyId,
  setActiveOperationalAreaId,
} from '@/hooks/useAuth';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: NavUser;
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
  user: NavUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<NavUser>;
  signup: (input: SignupInput) => Promise<NavUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NavUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setUser(getStoredUser());
    } catch {
      clearAuthSession();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    if (!response.access_token || response.mfa_required) {
      throw new Error('MFA verification is required for this account.');
    }
    const nextUser = response.user;
    persistAuthSession({ ...response, user: nextUser });

    // Initialize workspace scope strictly by role — delegates to the single
    // scope-setter implementation shared with every other scope-changing UI.
    setActiveWorkspaceScope(
      nextUser.userType === 'TENANT_ADMIN'
        ? 'TENANT'
        : nextUser.userType === 'COMPANY_ADMIN'
          ? 'COMPANY'
          : 'OPERATIONAL',
    );
    const compId = nextUser.companyId || nextUser.company_id || nextUser.companies?.[0]?.company_id;
    if (compId) setActiveCompanyId(compId);
    if (nextUser.userType === 'COMPANY_ADMIN' || nextUser.userType === 'TENANT_ADMIN') {
      setActiveOperationalAreaId(null);
    } else {
      const areaId = nextUser.operationalAreaId || nextUser.operational_area_id || nextUser.operationalAreas?.[0]?.area_id;
      if (areaId) setActiveOperationalAreaId(areaId);
    }

    setUser(nextUser);
    return nextUser;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
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
  }, [login]);

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
