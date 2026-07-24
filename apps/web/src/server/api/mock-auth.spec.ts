/** @jest-environment node */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { handleMockRequest } from './mock-repository';

describe('mock HTTP-only session authentication', () => {
  it('logs in with a cookie and never exposes tokens', async () => {
    const response = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'manager@navfarm.demo', password: 'Demo123!' }),
    }), '/auth/login', 'request-login');
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(payload.access_token).toBeUndefined();
    expect(payload.activeCompanyId).toBe('company-green-valley');
  });

  it('rejects invalid credentials', async () => {
    const response = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'manager@navfarm.demo', password: 'wrong' }),
    }), '/auth/login', 'request-failure');
    expect(response.status).toBe(401);
  });

  it('loads and logs out the current cookie session', async () => {
    const login = await handleMockRequest(new Request('http://localhost/api/v1/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'viewer@navfarm.demo', password: 'Demo123!' }),
    }), '/auth/login', 'request-session');
    const cookie = login.headers.get('set-cookie')!.split(';')[0];
    const loaded = await handleMockRequest(new Request('http://localhost/api/v1/auth/session', {
      headers: { cookie },
    }), '/auth/session', 'request-load');
    expect(loaded.status).toBe(200);
    const logout = await handleMockRequest(new Request('http://localhost/api/v1/auth/logout', {
      method: 'POST', headers: { cookie },
    }), '/auth/logout', 'request-logout');
    expect(logout.status).toBe(200);
    expect(logout.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
