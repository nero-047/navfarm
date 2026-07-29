import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const evidenceDirectory = resolve(
  process.cwd(),
  '../../docs/screenshots/demo-completion-m1',
);
const captureEvidence = process.env.NAVFARM_CAPTURE_M1_EVIDENCE === 'true';

async function reset(page: Page) {
  await page.context().clearCookies();
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
}

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await expect(page.getByText('Access denied')).toHaveCount(0);
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

async function assertEvidenceReady(
  page: Page,
  width: number,
  allowAccessState = false,
) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: 'nextjs-portal, #__next-build-watcher { display: none !important; }',
  });
  await expect.poll(() => page.evaluate('document.fonts.status')).toBe('loaded');
  await expect(page.locator('[role="status"]')).toHaveCount(0);
  await expect(page.getByText('Interactive frontend demo')).toHaveCount(0);
  if (!allowAccessState) {
    await expect(page.getByText(/Access denied|Permission required/)).toHaveCount(0);
  }
  await expect
    .poll(() => page.evaluate('document.documentElement.scrollWidth'))
    .toBeLessThanOrEqual(width);
}

async function capture(
  page: Page,
  filename: string,
  width = 1440,
  height = 900,
  allowAccessState = false,
) {
  if (!captureEvidence) return;
  await page.setViewportSize({ width, height });
  await assertEvidenceReady(page, width, allowAccessState);
  await page.screenshot({ path: resolve(evidenceDirectory, filename) });
}

const accountScenarios = [
  {
    email: 'system@navfarm.demo',
    route: /\/admin\/dashboard$/,
    heading: 'Control tower',
  },
  {
    email: 'tenant@navfarm.demo',
    route: /\/console\/dashboard$/,
    heading: 'Tenant dashboard',
    evidence: 'tenant-admin-after-login-1440x900.png',
  },
  {
    email: 'companyadmin@navfarm.demo',
    route: /\/green-valley-poultry\/overview$/,
    heading: 'Green Valley Poultry',
  },
  {
    email: 'accountant@navfarm.demo',
    route: /\/green-valley-poultry\/accounting\/readiness$/,
    heading: 'Company accounting readiness',
  },
  {
    email: 'auditor@navfarm.demo',
    route: /\/green-valley-poultry\/overview$/,
    heading: 'Green Valley Poultry',
  },
  {
    email: 'manager@navfarm.demo',
    route: /\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/,
    heading: 'Executive dashboard',
  },
  {
    email: 'viewer@navfarm.demo',
    route: /\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/,
    heading: 'Executive dashboard',
  },
  {
    email: 'multi@navfarm.demo',
    route: /\/context-selection$/,
    heading: 'Where would you like to work?',
    evidence: 'multi-company-context-selection-1440x900.png',
  },
  {
    email: 'onboarding@navfarm.demo',
    route: /\/bluewater-aqua\/setup\/profile$/,
    heading: 'Company profile',
  },
  {
    email: 'suspended@navfarm.demo',
    route: /\/access-denied\?reason=account_suspended$/,
    heading: 'Account suspended',
    evidence: 'suspended-account-1440x900.png',
    allowAccessState: true,
  },
  {
    email: 'noworkspace@navfarm.demo',
    route: /\/green-valley-poultry\/workspaces$/,
    heading: 'Choose a business area',
  },
  {
    email: 'nocompany@navfarm.demo',
    route: /\/console\/dashboard$/,
    heading: 'Tenant dashboard',
  },
] as const;

test.beforeAll(async () => {
  if (captureEvidence) await mkdir(evidenceDirectory, { recursive: true });
});

test.beforeEach(async ({ page }) => reset(page));

for (const scenario of accountScenarios) {
  test(`${scenario.email} reaches only its explicit landing outcome and restores it`, async ({ page }) => {
    await signIn(page, scenario.email);
    await expect(page).toHaveURL(scenario.route);
    await expect(page.getByRole('heading', { name: scenario.heading, exact: true })).toBeVisible();
    await expect(page.getByText('Access denied')).toHaveCount(0);

    if ('evidence' in scenario) {
      await capture(
        page,
        scenario.evidence,
        1440,
        900,
        'allowAccessState' in scenario && scenario.allowAccessState,
      );
    }

    await page.reload();
    await expect(page).toHaveURL(scenario.route);
    await expect(page.getByRole('heading', { name: scenario.heading, exact: true })).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });
}

test('hydration restore never renders an access-denied flash', async ({ page }) => {
  await signIn(page, 'manager@navfarm.demo');
  await expect(page).toHaveURL(
    /\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/,
  );
  await page.addInitScript(`
    window.__navfarmSawAccessDenied = false;
    const observer = new MutationObserver(() => {
      if (document.body && document.body.innerText.includes('Access denied')) {
        window.__navfarmSawAccessDenied = true;
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  `);
  await page.reload();
  await expect(page).toHaveURL(
    /\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/,
  );
  expect(await page.evaluate('window.__navfarmSawAccessDenied')).toBe(false);
});

test('MFA creates no protected session before verification and then opens context selection', async ({ page }) => {
  await signIn(page, 'mfa@navfarm.demo');
  await expect(page).toHaveURL(/\/mfa\/verify\?challengeId=challenge-user-mfa$/);
  await expect(page.getByRole('heading', { name: 'Verify it is you' })).toBeVisible();
  expect((await page.request.get('/api/v1/auth/session')).status()).toBe(401);
  await expect(page.getByRole('navigation')).toHaveCount(0);

  await page.getByLabel('Verification code').fill('123456');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await expect(page).toHaveURL(/\/context-selection$/);
  await expect(page.getByText('MFA Administrator · mfa@navfarm.demo')).toBeVisible();
  await capture(page, 'mfa-context-selection-1440x900.png');
});

test('canonical context selection exposes companies and workspaces but no tenant switch', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'multi@navfarm.demo');
  await expect(page).toHaveURL(/\/context-selection$/);
  await expect(page.getByRole('button', { name: 'Green Valley Poultry company administration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Green Valley Poultry workspace Poultry Operations' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Harvest Ridge Farms workspace Crop Production' })).toBeVisible();
  await expect(page.getByText(/Green Valley Holdings|BlueWater Group/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /tenant|organisation/i })).toHaveCount(0);
  await capture(page, 'context-selection-mobile-390x844.png', 390, 844);
});

test('company and workspace changes commit complete tuples and clear stale workspace context', async ({ page }) => {
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  }).click();
  await expect(page).toHaveURL(
    /\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/,
  );
  let session = await page.request.get('/api/v1/auth/session').then((response) => response.json());
  expect([
    session.activeTenantId,
    session.activeCompanyId,
    session.activeWorkspaceId,
  ]).toEqual([
    'tenant-demo',
    'company-green-valley',
    'workspace-green-poultry',
  ]);

  await page.getByRole('button', { name: 'Switch context' }).click();
  const harvestCard = page.getByText('Harvest Ridge Farms', { exact: true }).locator('..');
  await harvestCard.getByRole('button', { name: 'Company administration' }).click();
  await expect(page).toHaveURL(/\/harvest-ridge-farms\/overview$/);
  session = await page.request.get('/api/v1/auth/session').then((response) => response.json());
  expect([
    session.activeTenantId,
    session.activeCompanyId,
    session.activeWorkspaceId,
  ]).toEqual(['tenant-demo', 'company-harvest-ridge', null]);
});

test('invalid cross-tenant and stale URL pairs are rejected with specific outcomes', async ({ page }) => {
  await signIn(page, 'multi@navfarm.demo');
  const response = await page.request.put('/api/v1/auth/context', {
    data: {
      tenantId: 'tenant-second',
      companyId: 'company-green-valley',
      workspaceId: null,
    },
  });
  expect(response.status()).toBe(403);
  expect((await response.json()).error.code).toBe('COMPANY_NOT_IN_TENANT');

  await page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  }).click();
  await page.goto('/harvest-ridge-farms/workspaces/poultry-operations/dashboard');
  await expect(page).toHaveURL(/\/access-denied\?reason=company_selection_required$/);
  await expect(page.getByRole('heading', { name: 'Choose a company' })).toBeVisible();
});

test('company, accounting and audit roles never receive implicit operational mutation access', async ({ page }) => {
  for (const email of [
    'tenant@navfarm.demo',
    'companyadmin@navfarm.demo',
    'accountant@navfarm.demo',
    'auditor@navfarm.demo',
  ]) {
    await reset(page);
    await signIn(page, email);
    const session = await page.request.get('/api/v1/auth/session').then((response) => response.json());
    expect(session.activeWorkspaceId).toBeNull();
    expect(session.workspaces).toEqual([]);
    const mutation = await page.request.post(
      '/api/v1/tenants/tenant-demo/companies/company-green-valley/workspaces/workspace-green-poultry/batches',
      { data: {} },
    );
    expect(mutation.status()).toBe(403);
  }
});

test('Manager can mutate only its assigned workspace while Viewer remains read-only', async ({ page }) => {
  await signIn(page, 'manager@navfarm.demo');
  await page.goto('/green-valley-poultry/workspaces/poultry-operations/batches');
  await expect(page.getByRole('button', { name: 'New batch' })).toBeVisible();

  await reset(page);
  await signIn(page, 'viewer@navfarm.demo');
  await page.goto('/green-valley-poultry/workspaces/poultry-operations/batches');
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Batches', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'New batch' })).toHaveCount(0);
  const mutation = await page.request.post(
    '/api/v1/tenants/tenant-demo/companies/company-green-valley/workspaces/workspace-green-poultry/batches',
    { data: {} },
  );
  expect(mutation.status()).toBe(403);
  expect((await mutation.json()).error.code).toBe('CAPABILITY_REQUIRED');
  await capture(page, 'viewer-read-only-workspace-1440x900.png');
});

test('logout destroys tenant, company, and workspace context', async ({ page }) => {
  await signIn(page, 'manager@navfarm.demo');
  await page.getByRole('button', { name: 'Workspace Manager' }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  expect((await page.context().cookies()).some(
    (cookie) => cookie.name === 'navfarm_session',
  )).toBe(false);
  expect((await page.request.get('/api/v1/auth/session')).status()).toBe(401);
});
