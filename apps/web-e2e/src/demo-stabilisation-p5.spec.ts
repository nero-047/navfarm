import { expect, test, type Page } from '@playwright/test';
import { mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const password = 'Demo123!';
const companyRoot = '/green-valley-poultry';
const workspaceRoot = `${companyRoot}/workspaces/poultry-operations`;
const evidenceDirectory = resolve(
  process.cwd(),
  '../../docs/screenshots/demo-stabilisation-p5',
);
const captureEvidence = process.env.NAVFARM_CAPTURE_P5_EVIDENCE === 'true';
const expectedEvidence = [
  'clean-account-switch-accountant-1440x900.png',
  'notification-mobile-390x844.png',
  'notification-popover-1440x900.png',
  'sidebar-accounting-active-1440x900.png',
] as const;

async function reset(page: Page) {
  await page.context().clearCookies();
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
}

async function signIn(page: Page, email: string, returnTo?: string) {
  await page.goto(
    returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login',
  );
  await expect(page.getByRole('link', { name: /sign up/i })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /forgot password/i })).toHaveCount(0);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.url().includes('/api/v1/auth/login') &&
        candidate.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Sign In' }).click(),
  ]);
  expect(response.ok()).toBe(true);
}

async function signOut(page: Page) {
  const directSignOut = page.getByRole('button', { name: 'Sign out', exact: true });
  if (!(await directSignOut.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /account menu$/ }).click();
  }
  await directSignOut.click();
  await expect(page).toHaveURL('/login');
  expect(new URL(page.url()).search).toBe('');
}

async function openNotifications(page: Page) {
  const bell = page.getByRole('button', {
    name: /Notifications(?:, \d+ unread)?/,
  });
  await expect(bell).toBeVisible();
  await expect(bell).toHaveAttribute('aria-label', /Notifications, \d+ unread/);
  await bell.click();
  const dialog = page.getByRole('dialog', { name: 'Notifications' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('list', { name: 'Notification list' })).toBeVisible();
  return { bell, dialog };
}

async function activeSidebarLabel(page: Page, scope: string) {
  const navigation = page.getByRole('navigation', {
    name: new RegExp(`^${scope}.* navigation$`),
  });
  const active = navigation.locator('a[aria-current="page"]');
  await expect(active).toHaveCount(1);
  return active.textContent();
}

async function prepareEvidence(page: Page, width: number) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content:
      'nextjs-portal, #__next-build-watcher { display: none !important; }',
  });
  await expect.poll(() => page.evaluate('document.fonts.status')).toBe('loaded');
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await expect(
    page.getByText(/Loading your secure workspace|could not be loaded|Something went wrong/i),
  ).toHaveCount(0);
  await expect
    .poll(() => page.evaluate('document.documentElement.scrollWidth'))
    .toBeLessThanOrEqual(width);
  await page.mouse.move(0, 0);
}

async function capture(
  page: Page,
  filename: (typeof expectedEvidence)[number],
  width: number,
  height: number,
) {
  await page.setViewportSize({ width, height });
  await prepareEvidence(page, width);
  await page.screenshot({
    path: resolve(evidenceDirectory, filename),
    fullPage: false,
  });
}

test.beforeEach(async ({ page }) => reset(page));

test('stale Manager returnTo is rejected for Accountant after clean logout', async ({
  page,
}) => {
  await signIn(page, 'manager@navfarm.demo');
  await expect(page).toHaveURL(`${workspaceRoot}/dashboard`);
  await page.goto(`${workspaceRoot}/batches`);
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Batches', exact: true }),
  ).toBeVisible();

  await signOut(page);
  await signIn(page, 'accountant@navfarm.demo', `${workspaceRoot}/batches`);
  await expect(page).toHaveURL(`${companyRoot}/accounting/readiness`);
  await expect(
    page.getByRole('main').getByRole('heading', {
      name: 'Company accounting readiness',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Access denied|Permission required/i)).toHaveCount(0);
  const session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect(session.activeWorkspaceId).toBeNull();
  expect(session.workspaces).toEqual([]);
});

test('sequential roles receive only their own context and capabilities', async ({
  page,
}) => {
  await signIn(page, 'tenant@navfarm.demo');
  await expect(page).toHaveURL('/console/dashboard');
  await signOut(page);

  await signIn(page, 'viewer@navfarm.demo');
  await expect(page).toHaveURL(`${workspaceRoot}/dashboard`);
  await page.goto(`${workspaceRoot}/batches`);
  await expect(page.getByRole('button', { name: 'New batch' })).toHaveCount(0);
  let session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect(session.activeWorkspaceId).toBe('workspace-green-poultry');
  expect(session.workspaces).toHaveLength(1);
  expect(session.workspaces[0].role).toBe('VIEWER');
  await signOut(page);

  await signIn(page, 'multi@navfarm.demo');
  await expect(page).toHaveURL('/context-selection');
  await signOut(page);

  await signIn(page, 'companyadmin@navfarm.demo');
  await expect(page).toHaveURL(`${companyRoot}/overview`);
  session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect(session.activeWorkspaceId).toBeNull();
  expect(session.workspaces).toEqual([]);
  await signOut(page);

  await signIn(page, 'auditor@navfarm.demo');
  await expect(page).toHaveURL(`${companyRoot}/overview`);
  await expect(page.getByRole('button', { name: /create|add|edit/i })).toHaveCount(0);
  session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect(session.activeWorkspaceId).toBeNull();
  expect(session.workspaces).toEqual([]);
});

test('MFA and suspended transitions cannot leak context to the next account', async ({
  page,
}) => {
  await signIn(page, 'mfa@navfarm.demo');
  await expect(page).toHaveURL(/\/mfa\/verify\?challengeId=challenge-user-mfa$/);
  await page.getByLabel('Verification code').fill('123456');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await expect(page).toHaveURL('/context-selection');
  await signOut(page);

  await signIn(page, 'manager@navfarm.demo');
  await expect(page).toHaveURL(`${workspaceRoot}/dashboard`);
  await signOut(page);

  await signIn(page, 'suspended@navfarm.demo');
  await expect(page).toHaveURL('/access-denied?reason=account_suspended');
  await signOut(page);

  await signIn(page, 'tenant@navfarm.demo');
  await expect(page).toHaveURL('/console/dashboard');
  const session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect(session.user.email).toBe('tenant@navfarm.demo');
  expect(session.activeWorkspaceId).toBeNull();
  expect(session.workspaces).toEqual([]);
});

test('Reset demo data restores operational records and Viewer permissions', async ({
  page,
}) => {
  await signIn(page, 'manager@navfarm.demo');
  await page.goto(`${workspaceRoot}/batches`);
  const batchRows = page.locator('tbody tr');
  await expect.poll(() => batchRows.count()).toBeGreaterThan(0);
  const initialCount = await batchRows.count();
  await page.getByRole('button', { name: 'New batch' }).click();
  await page.getByRole('button', { name: 'Create draft batch' }).click();
  await expect(batchRows).toHaveCount(initialCount + 1);

  await page.getByRole('button', { name: /account menu$/ }).click();
  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await expect(page).toHaveURL('/login');
  expect((await page.request.get('/api/v1/auth/session')).status()).toBe(401);

  await signIn(page, 'viewer@navfarm.demo');
  await page.goto(`${workspaceRoot}/batches`);
  await expect(batchRows).toHaveCount(initialCount);
  await expect(page.getByRole('button', { name: 'New batch' })).toHaveCount(0);
  const session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect(session.user.email).toBe('viewer@navfarm.demo');
  expect(session.workspaces[0].permissions).not.toContain('batches.create');
});

test('canonical routes have one sidebar owner and NOB/LOB compatibility routes select a section', async ({
  page,
}) => {
  await signIn(page, 'accountant@navfarm.demo');
  for (const route of [
    'readiness',
    'chart-of-accounts',
    'gl-mappings',
    'costing',
  ]) {
    await page.goto(`${companyRoot}/accounting/${route}`);
    expect(await activeSidebarLabel(page, 'Company')).toContain('Accounting');
  }
  await signOut(page);

  await signIn(page, 'manager@navfarm.demo');
  await page.goto(`${workspaceRoot}/batches/PLT-2026-041`);
  expect(await activeSidebarLabel(page, 'Workspace')).toContain('Batches');
  await page.goto(`${workspaceRoot}/masters`);
  expect(await activeSidebarLabel(page, 'Workspace')).toContain('Workspace masters');
  await page.goto(`${workspaceRoot}/settings`);
  expect(await activeSidebarLabel(page, 'Workspace')).toContain('Workspace settings');
  await signOut(page);

  await signIn(page, 'companyadmin@navfarm.demo');
  await page.goto(`${companyRoot}/masters`);
  expect(await activeSidebarLabel(page, 'Company')).toContain('Masters');
  await page.goto(`${companyRoot}/settings/business-structure`);
  expect(await activeSidebarLabel(page, 'Company')).toContain('Settings');

  await page.goto(`${companyRoot}/masters/nobs`);
  await expect(page).toHaveURL(
    `${companyRoot}/settings/business-structure?section=nobs`,
  );
  await expect(
    page.getByRole('link', { name: 'Nature of Business' }),
  ).toHaveAttribute('aria-current', 'page');

  await page.goto(`${companyRoot}/masters/lobs`);
  await expect(page).toHaveURL(
    `${companyRoot}/settings/business-structure?section=lobs`,
  );
  await expect(
    page.getByRole('link', { name: 'Lines of Business' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('Tenant navigation exposes one profile destination and no duplicate Settings', async ({
  page,
}) => {
  await signIn(page, 'tenant@navfarm.demo');
  const navigation = page.getByRole('navigation', {
    name: /^Tenant.* navigation$/,
  });
  await expect(navigation.locator('a[href="/console/profile"]')).toHaveCount(1);
  await expect(navigation.getByRole('link', { name: 'Settings' })).toHaveCount(0);
  await page.goto('/console/profile');
  await expect(
    navigation.locator('a[aria-current="page"]'),
  ).toHaveCount(1);
  await expect(
    navigation.getByRole('link', { name: 'Tenant profile' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('notifications are interactive, account-scoped, resettable, and keyboard accessible', async ({
  page,
}) => {
  await signIn(page, 'manager@navfarm.demo');
  let { bell, dialog } = await openNotifications(page);
  await expect(
    dialog.getByText('A resource threshold was exceeded', { exact: true }),
  ).toBeVisible();
  const originalLabel = await bell.getAttribute('aria-label');
  const originalCount = Number(originalLabel?.match(/(\d+) unread/)?.[1]);
  expect(originalCount).toBeGreaterThan(1);

  await dialog.getByRole('button', { name: 'Mark as read' }).first().click();
  await expect(bell).toHaveAttribute(
    'aria-label',
    `Notifications, ${originalCount - 1} unread`,
  );
  await dialog.getByRole('button', { name: 'Mark all as read' }).click();
  await expect(bell).toHaveAttribute('aria-label', 'Notifications');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(bell).toBeFocused();
  await signOut(page);

  await signIn(page, 'viewer@navfarm.demo');
  ({ dialog } = await openNotifications(page));
  await expect(
    dialog.getByText('A resource threshold was exceeded', { exact: true }),
  ).toHaveCount(0);

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /account menu$/ }).click();
  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await expect(page).toHaveURL('/login');
  await signIn(page, 'manager@navfarm.demo');
  ({ bell } = await openNotifications(page));
  await expect(bell).toHaveAttribute(
    'aria-label',
    `Notifications, ${originalCount} unread`,
  );
});

test('mobile notification dialog is usable and restores focus at 390×844', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'manager@navfarm.demo');
  const { bell, dialog } = await openNotifications(page);
  await expect(dialog).toHaveCSS('position', 'fixed');
  await expect
    .poll(() => page.evaluate('document.documentElement.scrollWidth'))
    .toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(bell).toBeFocused();
});

test('captures exactly the four focused Phase 5 screenshots', async ({ page }) => {
  test.skip(!captureEvidence, 'Set NAVFARM_CAPTURE_P5_EVIDENCE=true to capture evidence.');
  await mkdir(evidenceDirectory, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, 'manager@navfarm.demo');
  await page.goto(`${workspaceRoot}/batches`);
  await signOut(page);
  await signIn(page, 'accountant@navfarm.demo');
  await expect(page).toHaveURL(`${companyRoot}/accounting/readiness`);
  await capture(
    page,
    'clean-account-switch-accountant-1440x900.png',
    1440,
    900,
  );

  await page.goto(`${companyRoot}/accounting/gl-mappings`);
  await expect(
    page.getByRole('navigation', { name: /^Company.* navigation$/ })
      .getByRole('link', { name: 'Accounting' }),
  ).toHaveAttribute('aria-current', 'page');
  await capture(
    page,
    'sidebar-accounting-active-1440x900.png',
    1440,
    900,
  );

  await reset(page);
  await signIn(page, 'manager@navfarm.demo');
  await openNotifications(page);
  await capture(
    page,
    'notification-popover-1440x900.png',
    1440,
    900,
  );

  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await openNotifications(page);
  await capture(page, 'notification-mobile-390x844.png', 390, 844);

  expect((await readdir(evidenceDirectory)).sort()).toEqual(
    [...expectedEvidence].sort(),
  );
});
