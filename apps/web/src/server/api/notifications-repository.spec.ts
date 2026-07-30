/** @jest-environment node */

import {
  handleMockRequest,
  resetMockRepositoryState,
} from './mock-repository';

async function login(email: string) {
  const response = await handleMockRequest(
    new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'Demo123!' }),
    }),
    '/auth/login',
    `notification-login-${email}`,
  );
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error(`No session cookie returned for ${email}`);
  return cookie;
}

async function call(cookie: string, method: string, path: string) {
  const response = await handleMockRequest(
    new Request(`http://localhost/api/v1${path}`, {
      method,
      headers: { cookie },
    }),
    path,
    `notification-${method}-${path}`,
  );
  return { response, payload: await response.json() };
}

describe('account-scoped demo notifications', () => {
  const originalResetFlag = process.env.NAVFARM_ENABLE_MOCK_RESET;

  beforeEach(() => {
    process.env.NAVFARM_ENABLE_MOCK_RESET = 'true';
    resetMockRepositoryState();
  });

  afterAll(() => {
    if (originalResetFlag === undefined) {
      delete process.env.NAVFARM_ENABLE_MOCK_RESET;
    } else {
      process.env.NAVFARM_ENABLE_MOCK_RESET = originalResetFlag;
    }
  });

  it('returns only notifications relevant to the signed-in account', async () => {
    const managerCookie = await login('manager@navfarm.demo');
    const viewerCookie = await login('viewer@navfarm.demo');
    const manager = await call(managerCookie, 'GET', '/notifications');
    const viewer = await call(viewerCookie, 'GET', '/notifications');
    expect(manager.payload.items.map(
      (item: { notificationId: string }) => item.notificationId,
    )).toContain('notification-resource-threshold');
    expect(viewer.payload.items.map(
      (item: { notificationId: string }) => item.notificationId,
    )).not.toContain('notification-resource-threshold');
  });

  it('marks one notification and then all notifications as read', async () => {
    const cookie = await login('manager@navfarm.demo');
    const initial = await call(cookie, 'GET', '/notifications');
    const firstId = initial.payload.items[0].notificationId as string;
    const marked = await call(
      cookie,
      'PATCH',
      `/notifications/${firstId}/read`,
    );
    expect(marked.payload.read).toBe(true);
    const afterOne = await call(cookie, 'GET', '/notifications');
    expect(afterOne.payload.unreadCount).toBe(initial.payload.unreadCount - 1);

    const afterAll = await call(cookie, 'POST', '/notifications/read-all');
    expect(afterAll.payload.unreadCount).toBe(0);
    expect(afterAll.payload.items.every(
      (item: { read: boolean }) => item.read,
    )).toBe(true);
  });

  it('reset restores unread state and invalidates every prior session', async () => {
    const managerCookie = await login('manager@navfarm.demo');
    const viewerCookie = await login('viewer@navfarm.demo');
    await call(managerCookie, 'POST', '/notifications/read-all');
    expect((await call(managerCookie, 'GET', '/notifications')).payload.unreadCount)
      .toBe(0);

    const reset = await call(managerCookie, 'POST', '/__mock/reset');
    expect(reset.response.status).toBe(200);
    expect(reset.payload.invalidatedSessions).toBeGreaterThanOrEqual(2);
    expect(reset.response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect((await call(managerCookie, 'GET', '/auth/session')).response.status)
      .toBe(401);
    expect((await call(viewerCookie, 'GET', '/auth/session')).response.status)
      .toBe(401);

    const restoredCookie = await login('manager@navfarm.demo');
    expect((await call(restoredCookie, 'GET', '/notifications')).payload.unreadCount)
      .toBeGreaterThan(0);
  });
});
