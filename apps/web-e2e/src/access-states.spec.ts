import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const evidenceDirectory = resolve(process.cwd(), '../../docs/screenshots/access-states');

async function reset(page: Page) {
  await page.context().clearCookies();
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
}

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
}

async function capture(page: Page, name: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addStyleTag({ content: 'nextjs-portal, #__next-build-watcher { display: none !important; }' });
  await expect.poll(() => page.evaluate('document.fonts.status')).toBe('loaded');
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await expect.poll(() => page.evaluate('document.documentElement.scrollWidth')).toBeLessThanOrEqual(1440);
  await page.screenshot({ path: resolve(evidenceDirectory, `${name}-1440x900.png`) });
}

test.beforeAll(async () => {
  await mkdir(evidenceDirectory, { recursive: true });
});

test.beforeEach(async ({ page }) => reset(page));

test('Tenant Admin lands in the tenant console and opens setup without workspace membership', async ({ page }) => {
  await signIn(page, 'tenant@navfarm.demo');
  await expect(page).toHaveURL(/\/console\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Tenant dashboard' })).toBeVisible();
  await capture(page, 'tenant-admin-dashboard');

  await page.goto('/green-valley-poultry/setup/profile');
  await expect(page).toHaveURL(/\/green-valley-poultry\/setup\/profile$/);
  await expect(page.getByRole('main').getByRole('heading', { name: 'Company profile' })).toBeVisible();
});

test('Tenant Admin receives an actionable unassigned workspace state', async ({ page }) => {
  await signIn(page, 'tenant@navfarm.demo');
  await page.goto('/green-valley-poultry/workspaces/feed-mill/dashboard');
  await expect(page.getByRole('heading', { name: 'Workspace access not assigned' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to company' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Manage workspace access' })).toBeVisible();
  await expect(page.getByText(/inactive or not included/i)).toHaveCount(0);
  await capture(page, 'tenant-admin-workspace-not-assigned');
});

test('Multi-company login requires company selection and persists the selected company', async ({ page }) => {
  await signIn(page, 'multi@navfarm.demo');
  await expect(page).toHaveURL(/\/context-selection$/);
  await expect(page.getByRole('heading', { name: 'Where would you like to work?' })).toBeVisible();
  await capture(page, 'multi-company-company-selector');

  await page.getByRole('button', { name: /Green Valley Poultry/ }).click();
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces$/);
  await expect(page.getByRole('heading', { name: 'Choose a business area' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Poultry Operations/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Feed Mill/ })).toBeVisible();
  await capture(page, 'multi-company-workspace-selector');
  await page.reload();
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces$/);
});

test('Multi-company user sees the correct no-workspace state', async ({ page }) => {
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', { name: /BlueWater Aqua/ }).click();
  await expect(page).toHaveURL(/\/bluewater-aqua\/workspaces$/);
  await expect(page.getByRole('heading', { name: 'No workspace assigned' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Choose another company' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});

test('Suspended account is isolated and can sign out', async ({ page }) => {
  await signIn(page, 'suspended@navfarm.demo');
  await expect(page).toHaveURL(/\/access-denied\?reason=account_suspended$/);
  await expect(page.getByRole('heading', { name: 'Account suspended' })).toBeVisible();
  await expect(page.getByText('Your NAVFarm account has been suspended. You cannot access tenant, company or workspace data at this time. Contact your organisation administrator if you believe this is a mistake.')).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await capture(page, 'suspended-account');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});

test('Logout clears tenant, company, and workspace context', async ({ page }) => {
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', { name: /Green Valley Poultry/ }).click();
  await page.getByRole('button', { name: /Poultry Operations/ }).click();
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/);
  await page.getByRole('button', { name: /Multi-company Manager/ }).click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  expect((await page.context().cookies()).some((cookie) => cookie.name === 'navfarm_session')).toBe(false);
  expect((await page.request.get('/api/v1/auth/session')).status()).toBe(401);

  await signIn(page, 'multi@navfarm.demo');
  await expect(page).toHaveURL(/\/context-selection$/);
});

test('Permission and inactive-resource reasons remain distinct', async ({ page }) => {
  await signIn(page, 'viewer@navfarm.demo');
  await page.goto('/console/dashboard');
  await expect(page).toHaveURL(/\/access-denied\?reason=insufficient_permission$/);
  await expect(page.getByRole('heading', { name: 'Permission required' })).toBeVisible();

  await reset(page);
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', { name: /Green Valley Poultry/ }).click();
  await page.goto('/inactive-farm/workspaces');
  await expect(page).toHaveURL(/\/access-denied\?reason=company_inactive$/);
  await expect(page.getByRole('heading', { name: 'Company inactive' })).toBeVisible();

  await page.goto('/green-valley-poultry/workspaces/archived-operations/dashboard');
  await expect(page.getByRole('heading', { name: 'Workspace inactive' })).toBeVisible();
});
