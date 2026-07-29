import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const companyRoot = '/green-valley-poultry';
const evidenceDirectory = resolve(
  process.cwd(),
  '../../docs/screenshots/demo-completion-m2',
);
const captureEvidence = process.env.NAVFARM_CAPTURE_M2_EVIDENCE === 'true';

async function reset(page: Page) {
  await page.context().clearCookies();
  const response = await page.request.post('/api/v1/__mock/reset');
  expect(response.ok()).toBe(true);
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

async function expectNoDocumentOverflow(page: Page, width: number) {
  await expect
    .poll(() => page.evaluate('document.documentElement.scrollWidth'))
    .toBeLessThanOrEqual(width);
}

async function memberRow(page: Page, name: string): Promise<Locator> {
  return page.getByRole('row').filter({ hasText: name });
}

test.beforeEach(async ({ page }) => reset(page));

test('Tenant Admin opens company administration without workspace context', async ({ page }) => {
  await signIn(page, 'tenant@navfarm.demo');
  await page.goto(`${companyRoot}/overview`);
  await expect(
    page.getByRole('heading', { name: 'Green Valley Poultry', exact: true }),
  ).toBeVisible();
  const session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect(session.activeWorkspaceId).toBeNull();

  const navigation = page.getByRole('navigation', {
    name: 'Company administration navigation',
  });
  for (const label of [
    'Overview',
    'Setup',
    'Workspaces',
    'Masters',
    'Accounting',
    'Members',
    'Roles & permissions',
    'Readiness',
    'Settings',
  ]) {
    await expect(navigation.getByRole('link', { name: label })).toBeVisible();
  }
  for (const operational of [
    'Batches',
    'Operations',
    'Quality',
    'Traceability',
    'Resources',
    'Costing',
    'Reports',
  ]) {
    await expect(
      navigation.getByRole('link', { name: operational, exact: true }),
    ).toHaveCount(0);
  }
});

test('Company profile and settings work without workspace state or farm-demo dependencies', async ({ page }) => {
  await signIn(page, 'companyadmin@navfarm.demo');
  await page.goto(`${companyRoot}/profile`);
  await expect(
    page.getByRole('heading', { name: 'Company profile', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Legal company name')).toHaveValue(
    'Green Valley Poultry',
  );

  await page.goto(`${companyRoot}/settings`);
  await expect(
    page.getByRole('heading', { name: 'Company settings', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Company configuration')).toBeVisible();
  await page.getByRole('link', { name: 'Localisation & region' }).click();
  await page.getByLabel('Default language').fill('en-GB');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(
    page.getByText('Localisation & region saved in the mock demo.'),
  ).toBeVisible();

  const session = await page.request
    .get('/api/v1/auth/session')
    .then((response) => response.json());
  expect(session.activeWorkspaceId).toBeNull();
});

test('Company Members is canonical and administrators can search, filter, and invite', async ({ page }) => {
  await signIn(page, 'companyadmin@navfarm.demo');
  await page.goto(`${companyRoot}/members`);
  await expect(page).toHaveURL(new RegExp(`${companyRoot}/members$`));
  await expect(
    page.getByRole('heading', { name: 'Company members', exact: true }),
  ).toBeVisible();

  await page.getByLabel('Search members').fill('Workspace Manager');
  await expect(await memberRow(page, 'Workspace Manager')).toBeVisible();
  await expect(await memberRow(page, 'Company Accountant')).toHaveCount(0);
  await page.getByLabel('Search members').fill('');
  await page.getByLabel('Company role filter').selectOption('ACCOUNTANT');
  await expect(await memberRow(page, 'Company Accountant')).toBeVisible();
  await expect(await memberRow(page, 'Workspace Manager')).toHaveCount(0);
  await page.getByLabel('Company role filter').selectOption('ALL');
  await page.getByLabel('Workspace filter').selectOption(
    'workspace-green-poultry',
  );
  await expect(await memberRow(page, 'Workspace Manager')).toBeVisible();

  await page.getByRole('button', { name: 'Invite member' }).click();
  await page.getByLabel('Full name').fill('E2E Demo Invitee');
  await page.getByLabel('Email').fill('m2.invitee@navfarm.demo');
  await page.getByLabel('Invite company role').selectOption('SUPERVISOR');
  await page.getByRole('button', { name: 'Send invitation' }).click();
  await expect(page.getByText('Invitation sent to m2.invitee@navfarm.demo.'))
    .toBeVisible();
  await expect(page.getByText('E2E Demo Invitee')).toBeVisible();
});

test('company role and workspace assignment workflows remain independent', async ({ page }) => {
  await signIn(page, 'companyadmin@navfarm.demo');
  await page.goto(`${companyRoot}/members`);
  await page.getByRole('button', { name: 'View Company Accountant' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', {
      name: 'Company Accountant',
      exact: true,
    }),
  ).toBeVisible();

  await page.getByLabel('Company role', { exact: true }).selectOption('AUDITOR');
  await page.getByRole('button', { name: 'Save company role' }).click();
  await expect(
    page.getByText(
      "Company Accountant's company role changed to AUDITOR.",
    ),
  ).toBeVisible();

  await page
    .getByRole('dialog')
    .getByLabel('Workspace', { exact: true })
    .selectOption('workspace-green-poultry');
  await page.getByLabel('Workspace role', { exact: true }).selectOption('VIEWER');
  await page.getByRole('button', { name: 'Add workspace access' }).click();
  await expect(page.getByText('Workspace access added for Company Accountant.'))
    .toBeVisible();

  let member = await page.request
    .get('/api/v1/companies/company-green-valley/members/user-accountant')
    .then((response) => response.json());
  expect(member.companyRole).toBe('AUDITOR');
  expect(member.workspaceAssignments[0].workspaceRole).toBe('VIEWER');

  await page
    .getByRole('combobox', {
      name: 'Workspace role for Poultry Operations',
      exact: true,
    })
    .selectOption('OPERATOR');
  await page
    .getByRole('button', {
      name: 'Save workspace role for Poultry Operations',
    })
    .click();
  await expect(
    page.getByText(
      "Workspace role changed without changing Company Accountant's company role.",
    ),
  ).toBeVisible();

  member = await page.request
    .get('/api/v1/companies/company-green-valley/members/user-accountant')
    .then((response) => response.json());
  expect(member.companyRole).toBe('AUDITOR');
  expect(member.workspaceAssignments[0].workspaceRole).toBe('OPERATOR');

  await page
    .getByRole('button', {
      name: 'Remove Poultry Operations assignment',
    })
    .click();
  await page.getByRole('button', { name: 'Remove workspace access' }).click();
  await expect(
    page.getByText(
      'Poultry Operations access removed from Company Accountant.',
    ),
  ).toBeVisible();

  const login = await page.request.post('/api/v1/auth/login', {
    data: {
      email: 'accountant@navfarm.demo',
      password: 'Demo123!',
    },
  });
  expect(login.ok()).toBe(true);
  expect((await login.json()).workspaces).toEqual([]);
});

test('roles page separates company and workspace permissions and labels custom roles as planned', async ({ page }) => {
  await signIn(page, 'companyadmin@navfarm.demo');
  await page.goto(`${companyRoot}/roles`);
  await expect(
    page.getByRole('heading', { name: 'Roles & permissions', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Company roles', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Workspace roles', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Workspace manager', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Custom company roles', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('PLANNED', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /create custom role/i }),
  ).toHaveCount(0);
});

test('Readiness is a real aggregate with non-blocking unresolved policy', async ({ page }) => {
  await signIn(page, 'companyadmin@navfarm.demo');
  await page.goto(`${companyRoot}/readiness`);
  await expect(page).toHaveURL(new RegExp(`${companyRoot}/readiness$`));
  await expect(
    page.getByRole('heading', { name: 'Company readiness', exact: true }),
  ).toBeVisible();
  for (const heading of [
    'Company foundation',
    'Company onboarding',
    'Shared master data',
    'Accounting readiness',
    'Workspace creation',
    'Workspace membership',
    'NOB & LOB configuration',
    'Operational readiness by workspace',
  ]) {
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.locator('a[href$="/accounting/readiness"]', {
      hasText: 'Open responsible area',
    }),
  ).toHaveCount(1);
  const policy = page
    .getByRole('heading', { name: 'Policy decisions pending' })
    .locator('..');
  await expect(policy.getByText('POLICY PENDING').first()).toBeVisible();
  await expect(policy.getByText('BLOCKING', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'Open Poultry Operations' }),
  ).toHaveAttribute(
    'href',
    '/green-valley-poultry/workspaces/poultry-operations',
  );
});

test('Viewer, Accountant, and Auditor cannot perform company member mutations', async ({ page }) => {
  for (const email of [
    'viewer@navfarm.demo',
    'accountant@navfarm.demo',
    'auditor@navfarm.demo',
  ]) {
    await reset(page);
    await signIn(page, email);
    const mutation = await page.request.patch(
      '/api/v1/companies/company-green-valley/members/user-manager/role',
      { data: { companyRole: 'VIEWER' } },
    );
    expect(mutation.status()).toBe(403);
    expect((await mutation.json()).error.code).toBe('CAPABILITY_REQUIRED');
  }

  await reset(page);
  await signIn(page, 'auditor@navfarm.demo');
  await page.goto(`${companyRoot}/settings`);
  await expect(page.getByText('Read only')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes' })).toHaveCount(0);
});

test('workspace operational routes retain their scoped provider', async ({ page }) => {
  await signIn(page, 'manager@navfarm.demo');
  await expect(page).toHaveURL(
    /\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/,
  );
  await expect(
    page.getByRole('heading', { name: 'Executive dashboard', exact: true }),
  ).toBeVisible();
});

for (const route of ['members', 'readiness', 'settings'] as const) {
  test(`${route} remains usable at 390x844 without document overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page, 'companyadmin@navfarm.demo');
    await page.goto(`${companyRoot}/${route}`);
    const heading = route === 'members'
      ? 'Company members'
      : route === 'readiness'
        ? 'Company readiness'
        : 'Company settings';
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    await expectNoDocumentOverflow(page, 390);
    if (route === 'members') {
      await expect(
        page.getByRole('button', { name: 'View Workspace Manager' }),
      ).toBeVisible();
    }
  });
}

test('capture exactly the Milestone 2 evidence set', async ({ page }) => {
  test.skip(!captureEvidence, 'Evidence capture is opt-in after validation.');
  await mkdir(evidenceDirectory, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await signIn(page, 'companyadmin@navfarm.demo');

  async function capture(route: string, filename: string, heading: string) {
    await page.goto(`${companyRoot}/${route}`);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    await prepareEvidence(page, 1440);
    await page.screenshot({ path: resolve(evidenceDirectory, filename) });
  }

  await capture(
    'overview',
    'company-overview-no-workspace-1440x900.png',
    'Green Valley Poultry',
  );
  await capture('members', 'company-members-1440x900.png', 'Company members');
  await page.getByRole('button', { name: 'View Workspace Manager' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', {
      name: 'Workspace Manager',
      exact: true,
    }),
  ).toBeVisible();
  await prepareEvidence(page, 1440);
  await page.screenshot({
    path: resolve(evidenceDirectory, 'company-member-detail-1440x900.png'),
  });
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await capture('roles', 'company-roles-1440x900.png', 'Roles & permissions');
  await capture(
    'readiness',
    'company-readiness-1440x900.png',
    'Company readiness',
  );
  await capture(
    'settings',
    'company-settings-1440x900.png',
    'Company settings',
  );

  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, filename, heading] of [
    ['members', 'company-members-mobile-390x844.png', 'Company members'],
    ['readiness', 'company-readiness-mobile-390x844.png', 'Company readiness'],
    ['settings', 'company-settings-mobile-390x844.png', 'Company settings'],
  ] as const) {
    await page.goto(`${companyRoot}/${route}`);
    await expect(
      page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
    await prepareEvidence(page, 390);
    await page.screenshot({ path: resolve(evidenceDirectory, filename) });
  }
});

async function prepareEvidence(page: Page, width: number) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: 'nextjs-portal, #__next-build-watcher { display: none !important; }',
  });
  await expect.poll(() => page.evaluate('document.fonts.status')).toBe('loaded');
  await expect(page.locator('[role="status"]')).toHaveCount(0);
  await expect(page.getByText(/Access denied|Permission required/)).toHaveCount(0);
  await expectNoDocumentOverflow(page, width);
}
