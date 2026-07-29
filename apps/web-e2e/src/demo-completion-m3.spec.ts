import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const companyRoot = '/green-valley-poultry';
const poultryRoot = `${companyRoot}/workspaces/poultry-operations`;
const evidenceDirectory = resolve(
  process.cwd(),
  '../../docs/screenshots/demo-completion-m3',
);
const captureEvidence = process.env.NAVFARM_CAPTURE_M3_EVIDENCE === 'true';

async function reset(page: Page) {
  await page.context().clearCookies();
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
}

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Demo123!');
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

async function openSwitcher(page: Page) {
  await page.getByRole('button', { name: 'Switch context' }).click();
  const switcher = page.getByRole('dialog', { name: 'Context switcher' });
  await expect(switcher).toBeVisible();
  return switcher;
}

async function selectPoultryWorkspace(page: Page) {
  await page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  }).click();
  await expect(page).toHaveURL(new RegExp(`${poultryRoot}/dashboard$`));
  await expect(
    page.getByRole('heading', { name: 'Executive dashboard', exact: true }),
  ).toBeVisible();
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
    page.getByText(/Loading workspace|could not be loaded|Something went wrong/i),
  ).toHaveCount(0);
  await expect
    .poll(() => page.evaluate('document.documentElement.scrollWidth'))
    .toBeLessThanOrEqual(width);
}

async function capture(page: Page, filename: string, width: number) {
  await prepareEvidence(page, width);
  await page.screenshot({
    path: resolve(evidenceDirectory, filename),
    fullPage: false,
  });
}

test.beforeEach(async ({ page }) => reset(page));

test('desktop switcher is hierarchical, searchable, selected, and tenant-free', async ({
  page,
}) => {
  await signIn(page, 'multi@navfarm.demo');
  await selectPoultryWorkspace(page);
  const switcher = await openSwitcher(page);

  await expect(
    switcher.getByText('Switch company or workspace', { exact: true }),
  ).toBeVisible();
  await expect(
    switcher.getByText('Green Valley Poultry', { exact: true }),
  ).toBeVisible();
  await expect(
    switcher.getByText('Harvest Ridge Farms', { exact: true }),
  ).toBeVisible();
  await expect(
    switcher.getByRole('button', { name: 'Poultry Operations' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    switcher.getByText(/Tenant|Organisation|Organization|\bOrg\b/i),
  ).toHaveCount(0);
  await expect(
    switcher.getByText('Archived Operations', { exact: true }),
  ).toHaveCount(0);
  await expect(
    switcher.getByText('Inactive Farm', { exact: true }),
  ).toHaveCount(0);
  await expect(
    switcher.getByText('Aquaculture Operations', { exact: true }),
  ).toHaveCount(0);
  await expect(
    switcher.getByRole('link', { name: 'Manage workspaces' }),
  ).toBeVisible();
  await expect(
    switcher.getByRole('link', { name: 'Create workspace' }),
  ).toBeVisible();

  const search = switcher.getByLabel('Search companies and workspaces');
  await search.fill('Feed Mill');
  await expect(
    switcher.getByText('Feed Mill', { exact: true }),
  ).toBeVisible();
  await expect(
    switcher.getByText('Harvest Ridge Farms', { exact: true }),
  ).toHaveCount(0);
  await search.fill('');
  await search.press('ArrowDown');
  await expect(
    switcher.getByRole('button', {
      name: 'Company administration',
      exact: true,
    }).first(),
  ).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Switch context' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(switcher).toBeVisible();
});

test('atomic selection clears company workspace and preserves the prior tuple on failure', async ({
  page,
}) => {
  await signIn(page, 'multi@navfarm.demo');
  await selectPoultryWorkspace(page);
  let switcher = await openSwitcher(page);
  await switcher
    .getByRole('button', { name: 'Company administration', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/green-valley-poultry\/overview$/);
  let session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect([
    session.activeTenantId,
    session.activeCompanyId,
    session.activeWorkspaceId,
  ]).toEqual(['tenant-demo', 'company-green-valley', null]);

  switcher = await openSwitcher(page);
  await switcher.getByRole('button', { name: 'Poultry Operations' }).click();
  await expect(page).toHaveURL(new RegExp(`${poultryRoot}/dashboard$`));
  const before = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());

  await page.route('**/api/v1/auth/context', async (route) => {
    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'STALE_CONTEXT',
          message: 'Simulated stale context.',
          status: 409,
          requestId: 'm3-switch-failure',
        },
      }),
    });
  });
  switcher = await openSwitcher(page);
  await switcher.getByRole('button', { name: 'Crop Production' }).click();
  await expect(
    switcher.getByRole('alert'),
  ).toContainText('previous company and workspace remain selected');
  session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect([
    session.activeTenantId,
    session.activeCompanyId,
    session.activeWorkspaceId,
  ]).toEqual([
    before.activeTenantId,
    before.activeCompanyId,
    before.activeWorkspaceId,
  ]);
  await expect(page).toHaveURL(new RegExp(`${poultryRoot}/dashboard$`));
});

test('workspace switching preserves supported lists, falls back safely, and drops record IDs', async ({
  page,
}) => {
  await signIn(page, 'multi@navfarm.demo');
  await selectPoultryWorkspace(page);

  await page.goto(`${poultryRoot}/batches/PLT-2026-041`);
  await expect(
    page.getByRole('heading', { name: 'PLT-2026-041', exact: true }),
  ).toBeVisible();
  let switcher = await openSwitcher(page);
  await switcher.getByRole('button', { name: 'Crop Production' }).click();
  await expect(page).toHaveURL(
    /\/harvest-ridge-farms\/workspaces\/crop-production\/batches$/,
  );
  expect(page.url()).not.toContain('PLT-2026-041');

  await page.goto(
    '/harvest-ridge-farms/workspaces/crop-production/reports',
  );
  switcher = await openSwitcher(page);
  await switcher.getByRole('button', { name: 'Feed Mill' }).click();
  await expect(page).toHaveURL(
    /\/green-valley-poultry\/workspaces\/feed-mill\/dashboard$/,
  );
});

test('manager and viewer canonical workspace routes are direct-entry safe', async ({
  page,
}) => {
  await signIn(page, 'manager@navfarm.demo');
  const routes = [
    ['dashboard', 'Executive dashboard'],
    ['batches', 'Batches'],
    ['operations', 'Operations'],
    ['quality', 'QC batches & release'],
    ['traceability', 'QR traceability'],
    ['resources', 'Resources and KPIs'],
    ['costing', 'Costing'],
    ['reports', 'Reports'],
    ['masters', 'Workspace masters'],
    ['settings', 'Workspace settings'],
  ] as const;
  for (const [route, heading] of routes) {
    await page.goto(`${poultryRoot}/${route}`);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Access|Permission required/i }),
    ).toHaveCount(0);
  }
  await page.goto(`${poultryRoot}/batches/PLT-2026-041`);
  await expect(
    page.getByRole('heading', { name: 'PLT-2026-041', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'PLT-2026-041', exact: true }),
  ).toBeVisible();

  await reset(page);
  await signIn(page, 'viewer@navfarm.demo');
  await page.goto(`${poultryRoot}/operations`);
  await expect(
    page.getByRole('heading', { name: 'Operations', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record entry' })).toHaveCount(0);
  await page.goto(`${poultryRoot}/resources`);
  await expect(page.getByRole('button', { name: 'Add resource' })).toHaveCount(0);
});

test('administrative and non-operational roles receive no implicit workspace access', async ({
  page,
}) => {
  for (const email of [
    'companyadmin@navfarm.demo',
    'accountant@navfarm.demo',
    'auditor@navfarm.demo',
    'noworkspace@navfarm.demo',
  ]) {
    await reset(page);
    await signIn(page, email);
    await page.goto(`${poultryRoot}/dashboard`);
    await expect(
      page.getByRole('heading', { name: 'Workspace access not assigned' }),
    ).toBeVisible();
  }
});

test('mobile drawer is full-height, searchable, closable, and overflow-safe', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'multi@navfarm.demo');
  await selectPoultryWorkspace(page);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const switcher = await openSwitcher(page);
  await expect(switcher).toHaveCSS('height', '844px');
  await expect(
    switcher.getByLabel('Search companies and workspaces'),
  ).toBeVisible();
  await expect(
    switcher.getByRole('button', { name: 'Close context switcher' }),
  ).toBeVisible();
  await prepareEvidence(page, 390);
  await switcher.getByRole('button', { name: 'Close context switcher' }).click();
  await expect(page.getByRole('button', { name: 'Switch context' })).toBeFocused();
});

test('capture exactly the Milestone 3 evidence set', async ({ page }) => {
  test.skip(!captureEvidence, 'Evidence capture is opt-in after validation.');
  await mkdir(evidenceDirectory, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, 'multi@navfarm.demo');
  await selectPoultryWorkspace(page);

  await openSwitcher(page);
  await capture(
    page,
    'company-workspace-switcher-open-1440x900.png',
    1440,
  );
  await page.keyboard.press('Escape');

  await page.goto(`${poultryRoot}/dashboard`);
  await expect(page.getByRole('heading', { name: 'Executive dashboard' })).toBeVisible();
  await capture(page, 'workspace-dashboard-poultry-1440x900.png', 1440);
  await page.goto(`${poultryRoot}/batches`);
  await expect(page.getByRole('button', { name: 'New batch' })).toBeVisible();
  await capture(page, 'workspace-batches-manager-1440x900.png', 1440);
  await page.goto(`${poultryRoot}/quality`);
  await expect(page.getByRole('heading', { name: 'QC batches & release' })).toBeVisible();
  await capture(page, 'workspace-quality-1440x900.png', 1440);
  await page.goto(`${poultryRoot}/traceability`);
  await expect(page.getByRole('heading', { name: 'QR traceability' })).toBeVisible();
  await capture(page, 'workspace-traceability-1440x900.png', 1440);
  await page.goto(`${poultryRoot}/costing`);
  await expect(page.getByRole('heading', { name: 'Costing' })).toBeVisible();
  await capture(page, 'workspace-costing-1440x900.png', 1440);
  await page.goto(`${poultryRoot}/masters`);
  await expect(page.getByRole('heading', { name: 'Workspace masters' })).toBeVisible();
  await capture(page, 'workspace-masters-1440x900.png', 1440);
  await page.goto(`${poultryRoot}/settings`);
  await expect(page.getByRole('heading', { name: 'Workspace settings' })).toBeVisible();
  await capture(page, 'workspace-settings-1440x900.png', 1440);

  let switcher = await openSwitcher(page);
  await switcher.getByRole('button', { name: 'Crop Production' }).click();
  await expect(page).toHaveURL(
    /\/harvest-ridge-farms\/workspaces\/crop-production\/settings$/,
  );
  await capture(page, 'multi-company-workspace-switch-1440x900.png', 1440);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  switcher = await openSwitcher(page);
  await capture(
    page,
    'company-workspace-switcher-mobile-390x844.png',
    390,
  );
  await switcher.getByRole('button', { name: 'Poultry Operations' }).click();
  await expect(page).toHaveURL(new RegExp(`${poultryRoot}/settings$`));
  await page.goto(`${poultryRoot}/dashboard`);
  await expect(page.getByRole('heading', { name: 'Executive dashboard' })).toBeVisible();
  await capture(page, 'workspace-dashboard-mobile-390x844.png', 390);

  await reset(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'viewer@navfarm.demo');
  await page.goto(`${poultryRoot}/batches`);
  await expect(page.getByRole('button', { name: 'New batch' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Batches' })).toBeVisible();
  await capture(page, 'workspace-batches-viewer-mobile-390x844.png', 390);
});
