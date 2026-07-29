import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const evidenceDirectory = resolve(
  process.cwd(),
  '../../docs/screenshots/phase93',
);

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

async function capture(page: Page, name: string) {
  if (process.env.NAVFARM_CAPTURE_BROAD_SCREENSHOTS !== 'true') return;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content:
      'nextjs-portal, #__next-build-watcher { display: none !important; }',
  });
  await expect
    .poll(() => page.evaluate('document.fonts.status'))
    .toBe('loaded');
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await page.waitForTimeout(550);
  await expect
    .poll(() => page.evaluate('document.documentElement.scrollWidth'))
    .toBeLessThanOrEqual(1440);
  await page.screenshot({
    path: resolve(evidenceDirectory, `${name}-1440x900.png`),
  });
}

async function openSwitcher(page: Page) {
  await page.getByRole('button', { name: 'Switch context' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Context switcher' }),
  ).toBeVisible();
}

test.beforeAll(async () => {
  if (process.env.NAVFARM_CAPTURE_BROAD_SCREENSHOTS === 'true') {
    await mkdir(evidenceDirectory, { recursive: true });
  }
});
test.beforeEach(async ({ page }) => reset(page));

test('audited mobile hierarchical context drawer evidence', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await signIn(page, 'multi@navfarm.demo');
  await expect(page).toHaveURL(/\/context-selection$/);
  await page.getByRole('button', {
    name: 'Green Valley Poultry company administration',
  }).click();
  await expect(page).toHaveURL(/\/green-valley-poultry\/overview$/);

  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Switch context' }).click();
  const drawer = page.getByRole('dialog', { name: 'Context switcher' });
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByText('Green Valley Poultry', { exact: true }),
  ).toBeVisible();
  await expect(
    drawer.getByText('Harvest Ridge Farms', { exact: true }),
  ).toBeVisible();
  await expect(
    drawer.getByRole('button', {
      name: 'Company administration',
      exact: true,
    }),
  ).toHaveCount(3);
  await expect(
    drawer.getByRole('button', { name: /Poultry Operations/ }),
  ).toBeVisible();
  await expect(drawer.getByRole('button', { name: /Feed Mill/ })).toBeVisible();
  await expect(
    drawer.getByRole('button', { name: /Crop Production/ }),
  ).toBeVisible();
  await expect(drawer).toHaveCSS('height', '844px');
  await page.addStyleTag({
    content:
      'nextjs-portal, #__next-build-watcher { display: none !important; }',
  });
  await expect
    .poll(() => page.evaluate('document.fonts.status'))
    .toBe('loaded');
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await expect(
    page.getByText(
      /Loading|Something went wrong|Unable to load|Request failed/i,
    ),
  ).toHaveCount(0);
  await expect
    .poll(() => page.evaluate('document.documentElement.scrollWidth'))
    .toBeLessThanOrEqual(390);
  if (process.env.NAVFARM_CAPTURE_BROAD_SCREENSHOTS === 'true') {
    await page.screenshot({
      path: resolve(
        evidenceDirectory,
        'hierarchical-switcher-mobile-390x844.png',
      ),
    });
  }
});

test('company dashboard resolves to overview with company-only navigation and accounting', async ({
  page,
}) => {
  await signIn(page, 'tenant@navfarm.demo');
  await page.goto('/green-valley-poultry/dashboard');
  await expect(page).toHaveURL(/\/green-valley-poultry\/overview$/);
  await expect(
    page.getByRole('heading', { name: 'Green Valley Poultry' }),
  ).toBeVisible();
  const nav = page.getByRole('navigation', {
    name: 'Company administration navigation',
  });
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(
    nav.getByRole('link', { name: /Batches|Operations|Quality|Reports/ }),
  ).toHaveCount(0);
  await capture(page, 'tenant-admin-company-overview');
  await capture(page, 'company-administration-sidebar');

  await openSwitcher(page);
  await expect(page.getByText('Company administration').last()).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Poultry Operations/ }),
  ).toHaveCount(0);
  await capture(page, 'hierarchical-switcher-open');

  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Switch context' }),
  ).toBeFocused();
  await page.goto('/green-valley-poultry/accounting/readiness');
  await expect(
    page.getByRole('heading', { name: 'Company accounting readiness' }),
  ).toBeVisible();
  await expect(page.getByText(/Operations gate|Operations ready/)).toHaveCount(
    0,
  );
  await capture(page, 'company-accounting-readiness');
});

test('company and workspace selections update the full context tuple atomically', async ({
  page,
}) => {
  await signIn(page, 'multi@navfarm.demo');
  await expect(page).toHaveURL(/\/context-selection$/);
  await capture(page, 'multi-company-company-selection');
  await page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  }).click();
  await expect(page).toHaveURL(
    /\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/,
  );

  let session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect([
    session.activeTenantId,
    session.activeCompanyId,
    session.activeWorkspaceId,
  ]).toEqual([
    'tenant-demo',
    'company-green-valley',
    'workspace-green-poultry',
  ]);

  await openSwitcher(page);
  const [contextResponse] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.url().includes('/api/v1/auth/context') &&
        candidate.request().method() === 'PUT',
    ),
    page
      .getByRole('button', { name: 'Company administration' })
      .first()
      .click(),
  ]);
  expect(contextResponse.ok()).toBe(true);
  await expect(page).toHaveURL(/\/green-valley-poultry\/overview$/);
  await expect
    .poll(async () => {
      session = await page.request
        .get('/api/v1/auth/session')
        .then((response) => response.json());
      return session.activeWorkspaceId;
    })
    .toBeNull();
});

test('hierarchical switcher lists only authorized contexts and preserves supported modules', async ({
  page,
}) => {
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  }).click();
  await page.goto(
    '/green-valley-poultry/workspaces/poultry-operations/reports',
  );
  await openSwitcher(page);
  await expect(
    page.getByRole('button', { name: /Crop Production/ }),
  ).toBeVisible();
  await expect(page.getByText('Aquaculture', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /Crop Production/ }).click();
  await expect(page).toHaveURL(
    /\/harvest-ridge-farms\/workspaces\/crop-production\/reports$/,
  );
});

test('workspace navigation follows type, modules and workspace permissions', async ({
  page,
}) => {
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  }).click();
  let nav = page.getByRole('navigation', {
    name: 'Workspace operations navigation',
  });
  await expect(nav.getByRole('link', { name: 'Batches' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Traceability' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Executive dashboard' }),
  ).toBeVisible();
  await capture(page, 'poultry-workspace-navigation');

  await openSwitcher(page);
  await page.getByRole('button', { name: /Crop Production/ }).click();
  nav = page.getByRole('navigation', {
    name: 'Workspace operations navigation',
  });
  await expect(
    nav.getByRole('link', { name: 'Production cycles' }),
  ).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Traceability' })).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Executive dashboard' }),
  ).toBeVisible();
  await capture(page, 'agriculture-workspace-navigation');
});

test('explicit workspace membership and stale company-workspace pairs are rejected', async ({
  page,
}) => {
  await signIn(page, 'tenant@navfarm.demo');
  await page.goto('/green-valley-poultry/workspaces/feed-mill/dashboard');
  await expect(
    page.getByRole('heading', { name: 'Workspace access not assigned' }),
  ).toBeVisible();
  await capture(page, 'workspace-not-assigned');

  await reset(page);
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  }).click();
  await page.goto(
    '/harvest-ridge-farms/workspaces/poultry-operations/dashboard',
  );
  await expect(
    page.getByRole('heading', { name: 'Choose a company' }),
  ).toBeVisible();
});

test('manager and viewer navigation matches mutation authorization', async ({
  page,
}) => {
  await signIn(page, 'manager@navfarm.demo');
  await expect(
    page
      .getByRole('navigation', { name: 'Workspace operations navigation' })
      .getByRole('link', { name: 'Operations' }),
  ).toBeVisible();
  await page.goto(
    '/green-valley-poultry/workspaces/poultry-operations/batches',
  );
  await expect(page.getByRole('button', { name: 'New batch' })).toBeVisible();

  await reset(page);
  await signIn(page, 'viewer@navfarm.demo');
  await page.goto(
    '/green-valley-poultry/workspaces/poultry-operations/batches',
  );
  await expect(page.getByRole('button', { name: 'New batch' })).toHaveCount(0);
  const response = await page.request.post(
    '/api/v1/tenants/tenant-demo/companies/company-green-valley/workspaces/workspace-green-poultry/batches',
    { data: {} },
  );
  expect(response.status()).toBe(403);
});
