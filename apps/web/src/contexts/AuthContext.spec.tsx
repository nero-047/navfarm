import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AuthSession } from '../contracts/api';
import { ApiError, api } from '../lib/api-client';
import { AuthProvider, useAuth } from './AuthContext';

const mockRouterReplace = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/login',
  useRouter: () => ({ replace: mockRouterReplace }),
}));

const restoredSession: AuthSession = {
  state: 'AUTHENTICATED',
  user: {
    userId: 'user-manager',
    fullName: 'Workspace Manager',
    email: 'manager@navfarm.demo',
    platformRole: null,
    language: 'en',
    timezone: 'Asia/Kolkata',
    emailVerified: true,
    mfaEnabled: false,
    userType: 'STANDARD_USER',
    companyId: 'company-green-valley',
    tenantId: 'tenant-demo',
    companies: [],
    permissions: [],
  },
  tenants: [{
    tenantId: 'tenant-demo',
    tenantName: 'Green Valley Holdings',
    status: 'ACTIVE',
    role: 'TENANT_MEMBER',
    permissions: [],
  }],
  companies: [{
    companyId: 'company-green-valley',
    tenantId: 'tenant-demo',
    companyName: 'Green Valley Poultry',
    companySlug: 'green-valley-poultry',
    status: 'ACTIVE',
    onboardingStatus: 'COMPLETED',
    role: 'FARM_MANAGER',
    permissions: ['company.view'],
    enabledModules: ['Batches'],
  }],
  workspaces: [{
    workspaceId: 'workspace-green-poultry',
    tenantId: 'tenant-demo',
    companyId: 'company-green-valley',
    workspaceCode: 'GV_POULTRY',
    workspaceSlug: 'poultry-operations',
    workspaceName: 'Poultry Operations',
    workspaceType: 'POULTRY',
    status: 'ACTIVE',
    configuredNob: {
      nobId: 'nob-poultry',
      code: 'POULTRY',
      name: 'Poultry',
    },
    enabledLobs: ['Rearing & Breeding'],
    enabledModules: ['Batches'],
    memberCount: 1,
    role: 'MANAGER',
    permissions: ['workspaces.view', 'batches.view', 'batches.create'],
  }],
  activeTenantId: 'tenant-demo',
  activeCompanyId: 'company-green-valley',
  activeWorkspaceId: 'workspace-green-poultry',
  expiresAt: '2026-07-30T00:00:00.000Z',
};

function Harness() {
  const { status, session, login, logout, selectContext } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="tuple">
        {[
          session?.activeTenantId ?? 'none',
          session?.activeCompanyId ?? 'none',
          session?.activeWorkspaceId ?? 'none',
        ].join('|')}
      </span>
      <button onClick={() => void login('mfa@navfarm.demo', 'Demo123!')}>Login MFA</button>
      <button
        onClick={() =>
          void selectContext(
            'tenant-demo',
            'company-green-valley',
            null,
          ).catch(() => undefined)
        }
      >
        Select company
      </button>
      <button onClick={() => void logout()}>Logout</button>
    </div>
  );
}

describe('AuthProvider canonical session lifecycle', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockRouterReplace.mockReset();
  });

  it('keeps loading distinct from an unauthenticated restore outcome', async () => {
    let rejectRestore!: (cause: unknown) => void;
    jest.spyOn(api, 'get').mockReturnValue(new Promise((_resolve, reject) => {
      rejectRestore = reject;
    }));
    render(<AuthProvider><Harness /></AuthProvider>);
    expect(screen.getByTestId('status').textContent).toBe('loading');

    await act(async () => {
      rejectRestore(new ApiError('No session.', 401, 'UNAUTHORIZED'));
    });
    expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
  });

  it('restores a valid session and full context tuple after refresh', async () => {
    jest.spyOn(api, 'get').mockResolvedValue(restoredSession);
    render(<AuthProvider><Harness /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
    });
    expect(screen.getByTestId('tuple').textContent).toBe(
      'tenant-demo|company-green-valley|workspace-green-poultry',
    );
  });

  it('clears the complete in-memory session and context on logout', async () => {
    jest.spyOn(api, 'get').mockResolvedValue(restoredSession);
    jest.spyOn(api, 'post').mockResolvedValue({ success: true });
    render(<AuthProvider><Harness /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    });
    expect(screen.getByTestId('tuple').textContent).toBe('none|none|none');
    expect(mockRouterReplace).toHaveBeenCalledWith('/login');
  });

  it('preserves the previous valid tuple when context selection fails', async () => {
    jest.spyOn(api, 'get').mockResolvedValue(restoredSession);
    jest.spyOn(api, 'put').mockRejectedValue(
      new ApiError('Context rejected.', 409, 'STALE_CONTEXT'),
    );
    render(<AuthProvider><Harness /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Select company' }));
    await waitFor(() => {
      expect(api.put).toHaveBeenCalled();
    });
    expect(screen.getByTestId('tuple').textContent).toBe(
      'tenant-demo|company-green-valley|workspace-green-poultry',
    );
  });

  it('keeps an MFA challenge outside the authenticated application session', async () => {
    jest.spyOn(api, 'get').mockRejectedValue(new ApiError('No session.', 401, 'UNAUTHORIZED'));
    jest.spyOn(api, 'post').mockResolvedValue({
      state: 'MFA_PENDING',
      challengeId: 'challenge-user-mfa',
      expiresAt: '2026-07-29T12:00:00.000Z',
      user: {
        ...restoredSession.user,
        userId: 'user-mfa',
        email: 'mfa@navfarm.demo',
        mfaEnabled: true,
      },
    });
    render(<AuthProvider><Harness /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login MFA' }));
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('mfa_pending');
    });
    expect(screen.getByTestId('tuple').textContent).toBe('none|none|none');
  });
});
