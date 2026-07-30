import { expect, test, type Page } from '@playwright/test';
import { mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const password = 'Demo123!';
const companyRoot = '/green-valley-poultry';
const workspaceRoot = `${companyRoot}/workspaces/poultry-operations`;
const evidenceDirectory = resolve(
  process.cwd(),
  '../../docs/screenshots/demo-completion-m4',
);
const captureEvidence = process.env.NAVFARM_CAPTURE_M4_EVIDENCE === 'true';
const auditViewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
] as const;

const expectedEvidence = [
  'login-demo-accounts-light-1440x900.png',
  'platform-dashboard-light-1440x900.png',
  'tenant-dashboard-light-1440x900.png',
  'company-overview-light-1440x900.png',
  'company-members-light-1440x900.png',
  'company-readiness-light-1440x900.png',
  'company-workspace-switcher-light-1440x900.png',
  'workspace-dashboard-light-1440x900.png',
  'workspace-batches-light-1440x900.png',
  'workspace-quality-light-1440x900.png',
  'workspace-traceability-light-1440x900.png',
  'platform-dashboard-dark-1440x900.png',
  'company-overview-dark-1440x900.png',
  'company-members-dark-1440x900.png',
  'workspace-dashboard-dark-1440x900.png',
  'workspace-batches-dark-1440x900.png',
  'workspace-costing-dark-1440x900.png',
  'login-mobile-390x844.png',
  'tenant-dashboard-mobile-390x844.png',
  'company-members-mobile-390x844.png',
  'company-readiness-mobile-390x844.png',
  'workspace-switcher-mobile-390x844.png',
  'workspace-dashboard-mobile-390x844.png',
  'workspace-batches-viewer-mobile-390x844.png',
  'suspended-account-mobile-390x844.png',
] as const;

async function reset(page: Page) {
  await page.context().clearCookies();
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
}

async function navigate(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

async function signIn(page: Page, email: string) {
  await page.goto('/login');
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
  await expect(page).not.toHaveURL(/\/login$/);
}

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(
    `localStorage.setItem('navfarm_theme', '${theme}'); document.documentElement.setAttribute('data-theme', '${theme}')`,
  );
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

async function prepare(page: Page, width: number) {
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
}

async function capture(
  page: Page,
  name: (typeof expectedEvidence)[number],
  width: number,
  height: number,
) {
  await page.setViewportSize({ width, height });
  await prepare(page, width);
  await page.mouse.move(0, 0);
  await page.screenshot({
    path: resolve(evidenceDirectory, name),
    fullPage: false,
  });
}

async function openSwitcher(page: Page) {
  await page.getByRole('button', { name: 'Switch context' }).click();
  const switcher = page.getByRole('dialog', { name: 'Context switcher' });
  await expect(switcher).toBeVisible();
  return switcher;
}

async function auditCanonicalRoutes(page: Page, routes: readonly string[]) {
  for (const viewport of auditViewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await navigate(page, route);
      await expect(page.getByRole('main')).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByRole('heading', {
          name: /Access denied|Permission required|Something went wrong/i,
        }),
      ).toHaveCount(0);
      await prepare(page, viewport.width);
    }
  }
}

test.beforeEach(async ({ page }) => reset(page));

test('representative scopes remain distinct and theme persistence is presentation-only', async ({
  page,
}) => {
  await signIn(page, 'system@navfarm.demo');
  await expect(page.getByText('Platform administration', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('NAVFarm control plane', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await reset(page);
  await signIn(page, 'tenant@navfarm.demo');
  await expect(page.getByText('Tenant administration', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Tenant console', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Switch context' })).toHaveCount(0);

  await reset(page);
  await signIn(page, 'companyadmin@navfarm.demo');
  await expect(page).toHaveURL(/\/green-valley-poultry\/overview$/);
  await expect(page.getByText('Company scope', { exact: true })).toBeVisible();
  await expect(page.getByText(/does not require an active workspace/)).toBeVisible();

  await reset(page);
  await signIn(page, 'manager@navfarm.demo');
  await expect(page.getByText(/Operational role · MANAGER/)).toBeVisible();
  await expect(page.getByText('Poultry Operations', { exact: true }).first()).toBeVisible();
});

test('mobile navigation and company dialogs contain and restore keyboard focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'manager@navfarm.demo');
  const menuButton = page.getByRole('button', { name: 'Open navigation' });
  await menuButton.click();
  const drawer = page.getByRole('dialog', { name: 'Application navigation' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Close navigation' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menuButton).toBeFocused();

  await reset(page);
  await signIn(page, 'companyadmin@navfarm.demo');
  await navigate(page, `${companyRoot}/members`);
  const memberButton = page.getByRole('button', { name: 'View Workspace Manager' });
  await memberButton.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await page.keyboard.press('Escape');
  await expect(memberButton).toBeFocused();
  await prepare(page, 390);
});

test('public trace is public-safe, mobile-ready, and explicitly demo data', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await navigate(page, '/trace/green-valley-poultry/PACK-2026-001');
  await expect(page.getByText('Demo trace record')).toBeVisible();
  await expect(page.getByText(/not a certification or compliance statement/)).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Use dark theme' })).toBeVisible();
  await prepare(page, 390);
});

test('normal presentation contains no debug controls or Tenant switch option', async ({
  page,
}) => {
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  }).click();
  const switcher = await openSwitcher(page);
  await expect(
    switcher.getByText(/Tenant|Organisation|Organization|\bOrg\b/i),
  ).toHaveCount(0);
  await expect(
    page.getByText(/debug badge|test-only|lorem ipsum/i),
  ).toHaveCount(0);
});

test('Platform canonical routes are overflow-safe at all required viewports', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await signIn(page, 'system@navfarm.demo');
  await auditCanonicalRoutes(page, [
    '/admin/dashboard',
    '/admin/tenants',
    '/admin/tenants/tenant-demo',
    '/admin/plans',
    '/admin/masters',
    '/admin/audit',
  ]);
});

test('Tenant canonical routes are overflow-safe at all required viewports', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await signIn(page, 'tenant@navfarm.demo');
  await auditCanonicalRoutes(page, [
    '/console/dashboard',
    '/console/profile',
    '/console/companies',
    '/console/users',
    '/console/invitations',
    '/console/roles',
    '/console/subscription',
    '/console/usage',
    '/console/audit',
    '/console/notifications',
  ]);
});

test('Company canonical routes are overflow-safe at all required viewports', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await signIn(page, 'companyadmin@navfarm.demo');
  await auditCanonicalRoutes(page, [
    `${companyRoot}/overview`,
    `${companyRoot}/setup/profile`,
    `${companyRoot}/profile`,
    `${companyRoot}/workspaces`,
    `${companyRoot}/masters`,
    `${companyRoot}/accounting/readiness`,
    `${companyRoot}/members`,
    `${companyRoot}/roles`,
    `${companyRoot}/readiness`,
    `${companyRoot}/settings`,
  ]);
});

test('Workspace canonical routes are overflow-safe at all required viewports', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await signIn(page, 'manager@navfarm.demo');
  await auditCanonicalRoutes(page, [
    `${workspaceRoot}/dashboard`,
    `${workspaceRoot}/batches`,
    `${workspaceRoot}/batches/PLT-2026-041`,
    `${workspaceRoot}/operations`,
    `${workspaceRoot}/quality`,
    `${workspaceRoot}/traceability`,
    `${workspaceRoot}/resources`,
    `${workspaceRoot}/costing`,
    `${workspaceRoot}/reports`,
    `${workspaceRoot}/masters`,
    `${workspaceRoot}/settings`,
  ]);
});

test('capture exactly the Milestone 4 final presentation evidence', async ({
  page,
}) => {
  test.skip(!captureEvidence, 'Evidence capture is opt-in after validation.');
  await mkdir(evidenceDirectory, { recursive: true });

  await navigate(page, '/login');
  await setTheme(page, 'light');
  await expect(page.getByRole('heading', { name: 'Demo accounts' })).toBeVisible();
  await capture(page, 'login-demo-accounts-light-1440x900.png', 1440, 900);

  await signIn(page, 'system@navfarm.demo');
  await setTheme(page, 'light');
  await expect(page.getByRole('heading', { name: 'Control tower' })).toBeVisible();
  await capture(page, 'platform-dashboard-light-1440x900.png', 1440, 900);

  await reset(page);
  await signIn(page, 'tenant@navfarm.demo');
  await setTheme(page, 'light');
  await expect(page.getByRole('heading', { name: 'Tenant dashboard' })).toBeVisible();
  await capture(page, 'tenant-dashboard-light-1440x900.png', 1440, 900);

  await reset(page);
  await signIn(page, 'companyadmin@navfarm.demo');
  await setTheme(page, 'light');
  await navigate(page, `${companyRoot}/overview`);
  await expect(page.getByRole('heading', { name: 'Green Valley Poultry' })).toBeVisible();
  await capture(page, 'company-overview-light-1440x900.png', 1440, 900);
  await navigate(page, `${companyRoot}/members`);
  await expect(page.getByRole('heading', { name: 'Company members' })).toBeVisible();
  await capture(page, 'company-members-light-1440x900.png', 1440, 900);
  await navigate(page, `${companyRoot}/readiness`);
  await expect(page.getByRole('heading', { name: 'Company readiness', exact: true })).toBeVisible();
  await capture(page, 'company-readiness-light-1440x900.png', 1440, 900);

  await reset(page);
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  }).click();
  await openSwitcher(page);
  await capture(
    page,
    'company-workspace-switcher-light-1440x900.png',
    1440,
    900,
  );
  await page.keyboard.press('Escape');

  await reset(page);
  await signIn(page, 'manager@navfarm.demo');
  await setTheme(page, 'light');
  for (const [route, heading, filename] of [
    ['dashboard', 'Executive dashboard', 'workspace-dashboard-light-1440x900.png'],
    ['batches', 'Batches', 'workspace-batches-light-1440x900.png'],
    ['quality', 'QC batches & release', 'workspace-quality-light-1440x900.png'],
    ['traceability', 'QR traceability', 'workspace-traceability-light-1440x900.png'],
  ] as const) {
    await navigate(page, `${workspaceRoot}/${route}`);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await capture(page, filename, 1440, 900);
  }

  await reset(page);
  await signIn(page, 'system@navfarm.demo');
  await setTheme(page, 'dark');
  await expect(page.getByRole('heading', { name: 'Control tower' })).toBeVisible();
  await capture(page, 'platform-dashboard-dark-1440x900.png', 1440, 900);

  await reset(page);
  await signIn(page, 'companyadmin@navfarm.demo');
  await setTheme(page, 'dark');
  await navigate(page, `${companyRoot}/overview`);
  await expect(page.getByRole('heading', { name: 'Green Valley Poultry' })).toBeVisible();
  await capture(page, 'company-overview-dark-1440x900.png', 1440, 900);
  await navigate(page, `${companyRoot}/members`);
  await expect(page.getByRole('heading', { name: 'Company members' })).toBeVisible();
  await capture(page, 'company-members-dark-1440x900.png', 1440, 900);

  await reset(page);
  await signIn(page, 'manager@navfarm.demo');
  await setTheme(page, 'dark');
  for (const [route, heading, filename] of [
    ['dashboard', 'Executive dashboard', 'workspace-dashboard-dark-1440x900.png'],
    ['batches', 'Batches', 'workspace-batches-dark-1440x900.png'],
    ['costing', 'Costing', 'workspace-costing-dark-1440x900.png'],
  ] as const) {
    await navigate(page, `${workspaceRoot}/${route}`);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await capture(page, filename, 1440, 900);
  }

  await reset(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await navigate(page, '/login');
  await setTheme(page, 'light');
  await capture(page, 'login-mobile-390x844.png', 390, 844);

  await signIn(page, 'tenant@navfarm.demo');
  await capture(page, 'tenant-dashboard-mobile-390x844.png', 390, 844);

  await reset(page);
  await signIn(page, 'companyadmin@navfarm.demo');
  await navigate(page, `${companyRoot}/members`);
  await expect(page.getByRole('heading', { name: 'Company members' })).toBeVisible();
  await capture(page, 'company-members-mobile-390x844.png', 390, 844);
  await navigate(page, `${companyRoot}/readiness`);
  await expect(page.getByRole('heading', { name: 'Company readiness', exact: true })).toBeVisible();
  await capture(page, 'company-readiness-mobile-390x844.png', 390, 844);

  await reset(page);
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  }).click();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await openSwitcher(page);
  await capture(page, 'workspace-switcher-mobile-390x844.png', 390, 844);
  await page.keyboard.press('Escape');

  await reset(page);
  await signIn(page, 'manager@navfarm.demo');
  await navigate(page, `${workspaceRoot}/dashboard`);
  await expect(page.getByRole('heading', { name: 'Executive dashboard' })).toBeVisible();
  await capture(page, 'workspace-dashboard-mobile-390x844.png', 390, 844);

  await reset(page);
  await signIn(page, 'viewer@navfarm.demo');
  await navigate(page, `${workspaceRoot}/batches`);
  await expect(page.getByRole('button', { name: 'New batch' })).toHaveCount(0);
  await capture(page, 'workspace-batches-viewer-mobile-390x844.png', 390, 844);

  await reset(page);
  await signIn(page, 'suspended@navfarm.demo');
  await expect(page.getByRole('heading', { name: 'Account suspended' })).toBeVisible();
  await capture(page, 'suspended-account-mobile-390x844.png', 390, 844);

  expect((await readdir(evidenceDirectory)).sort()).toEqual(
    [...expectedEvidence].sort(),
  );
});
