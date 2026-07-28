'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthSession } from '../contracts/api';
import { destinationForSession } from '../lib/authorization';
import { ApiError, api } from '../lib/api-client';
import { setSessionSnapshot } from '../hooks/useAuth';

export type User = AuthSession['user'];

interface SignupInput {
  tenantName: string;
  tenantCode: string;
  name: string;
  email: string;
  password: string;
}

interface AuthContextType {
  session: AuthSession | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User & { mfaRequired?: boolean; challengeId?: string }>;
  signup: (input: SignupInput) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
  selectContext: (tenantId: string | null, companyId: string | null, workspaceId?: string | null) => Promise<AuthSession>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const commit = useCallback((value: AuthSession | null) => {
    setSession(value);
    setSessionSnapshot(value);
    return value;
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      return commit(await api.get<AuthSession>('/auth/session'));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) return commit(null);
      throw cause;
    }
  }, [commit]);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const next = await api.post<AuthSession>('/auth/login', { email, password });
    // An MFA challenge is intentionally not an authenticated application session.
    // The server only creates the real session after verification/recovery succeeds.
    if (!next.mfaRequired) commit(next);
    return { ...next.user, mfaRequired: next.mfaRequired, challengeId: next.challengeId };
  }, [commit]);

  const signup = useCallback(async (input: SignupInput) => {
    await api.post('/tenant/signup', {
      tenant_code: input.tenantCode, tenant_name: input.tenantName,
      tenant_type: 'SME', plan_id: 'PLAN_PRO', billing_email: input.email,
      admin_name: input.name, admin_email: input.email, admin_password: input.password,
    });
    return login(input.email, input.password);
  }, [login]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { commit(null); }
  }, [commit]);

  const selectContext = useCallback(async (tenantId: string | null, companyId: string | null, workspaceId: string | null = null) => {
    const next = await api.put<AuthSession>('/auth/context', { tenantId, companyId, workspaceId });
    commit(next);
    return next;
  }, [commit]);

  const value = useMemo(() => ({
    session, user: session?.user ?? null, loading, login, signup, logout,
    refreshSession, selectContext,
  }), [session, loading, login, signup, logout, refreshSession, selectContext]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}

export { destinationForSession };
