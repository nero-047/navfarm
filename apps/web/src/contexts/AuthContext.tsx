'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  authContextRequestSchema,
  authLoginRequestSchema,
  mfaCompletionRequestSchema,
  type AuthLoginResponse,
  type AuthSession,
} from '../contracts/api';
import { authorizedReturnTo, destinationForSession } from '../lib/authorization';
import { ApiError, api } from '../lib/api-client';

export type User = AuthSession['user'];
export type SessionStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'suspended'
  | 'mfa_pending'
  | 'signing_out';
export type LoginResult =
  | { status: 'authenticated' | 'suspended'; user: User; session: AuthSession }
  | { status: 'mfa_pending'; user: User; challengeId: string };

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
  status: SessionStatus;
  loading: boolean;
  mfaChallengeId: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  completeMfa: (challengeId: string, credential: { code?: string; recoveryCode?: string }) => Promise<AuthSession>;
  signup: (input: SignupInput) => Promise<User>;
  logout: () => Promise<void>;
  resetDemo: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
  selectContext: (tenantId: string | null, companyId: string | null, workspaceId?: string | null) => Promise<AuthSession>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);

  const commit = useCallback((value: AuthSession | null) => {
    setSession(value);
    setMfaChallengeId(null);
    setStatus(value?.state === 'SUSPENDED' ? 'suspended' : value ? 'authenticated' : 'unauthenticated');
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
    void refreshSession().catch(() => commit(null));
  }, [refreshSession]);
  useEffect(() => {
    if (status === 'signing_out' && pathname === '/login') {
      setStatus('unauthenticated');
    }
  }, [pathname, status]);

  const login = useCallback(async (email: string, password: string) => {
    const input = authLoginRequestSchema.parse({ email: email.trim().toLowerCase(), password });
    const next = await api.post<AuthLoginResponse>('/auth/login', input);
    if (next.state === 'MFA_PENDING') {
      setSession(null);
      setMfaChallengeId(next.challengeId);
      setStatus('mfa_pending');
      return { status: 'mfa_pending' as const, user: next.user, challengeId: next.challengeId };
    }
    commit(next);
    return {
      status: next.state === 'SUSPENDED' ? 'suspended' as const : 'authenticated' as const,
      user: next.user,
      session: next,
    };
  }, [commit]);

  const completeMfa = useCallback(async (
    challengeId: string,
    credential: { code?: string; recoveryCode?: string },
  ) => {
    const input = mfaCompletionRequestSchema.parse({ challengeId, ...credential });
    const next = await api.post<AuthSession>(
      credential.recoveryCode ? '/auth/mfa/recovery' : '/auth/mfa/verify',
      input,
    );
    return commit(next) as AuthSession;
  }, [commit]);

  const signup = useCallback(async (input: SignupInput) => {
    await api.post('/tenant/signup', {
      tenant_code: input.tenantCode, tenant_name: input.tenantName,
      tenant_type: 'SME', plan_id: 'PLAN_PRO', billing_email: input.email,
      admin_name: input.name, admin_email: input.email, admin_password: input.password,
    });
    const result = await login(input.email, input.password);
    return result.user;
  }, [login]);

  const beginSessionExit = useCallback(() => {
    setSession(null);
    setMfaChallengeId(null);
    setStatus('signing_out');
  }, []);

  const logout = useCallback(async () => {
    beginSessionExit();
    try {
      await api.post('/auth/logout');
    } finally {
      router.replace('/login');
    }
  }, [beginSessionExit, router]);

  const resetDemo = useCallback(async () => {
    beginSessionExit();
    try {
      await api.post('/__mock/reset');
      router.replace('/login');
    } catch (cause) {
      await refreshSession().catch(() => commit(null));
      throw cause;
    }
  }, [beginSessionExit, commit, refreshSession, router]);

  const selectContext = useCallback(async (tenantId: string | null, companyId: string | null, workspaceId: string | null = null) => {
    const input = authContextRequestSchema.parse({ tenantId, companyId, workspaceId });
    const next = await api.put<AuthSession>('/auth/context', input);
    commit(next);
    return next;
  }, [commit]);

  const loading = status === 'loading' || status === 'signing_out';
  const value = useMemo(() => ({
    session, user: session?.user ?? null, status, loading, mfaChallengeId,
    login, completeMfa, signup, logout, resetDemo, refreshSession, selectContext,
  }), [
    session, status, loading, mfaChallengeId, login, completeMfa, signup,
    logout, resetDemo, refreshSession, selectContext,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}

export { authorizedReturnTo, destinationForSession };
