import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const password = 'Demo123!';
const presentationDirectory = resolve(process.cwd(), '../../docs/screenshots/presentation');

async function reset(page: Page) {
  await page.context().clearCookies();
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
}

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

async function waitForScreenshotReady(page: Page) {
  await page.addStyleTag({ content: 'nextjs-portal, #__next-build-watcher { display: none !important; }' });
  await expect.poll(() => page.evaluate('document.fonts.status')).toBe('loaded');
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await expect(page.getByText('Loading your secure workspace')).toHaveCount(0);
  await expect(page.getByText(/Loading.*…/)).toHaveCount(0);
}

async function capture(page: Page, name: string, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await waitForScreenshotReady(page);
  await expect.poll(() => page.evaluate('document.documentElement.scrollWidth')).toBeLessThanOrEqual(width);
  await page.screenshot({ path: resolve(presentationDirectory, `${name}-${width}x${height}.png`), fullPage: true });
}

test.beforeEach(async ({ page }) => reset(page));

test('mock login presents deterministic demo account scenarios without automatic sign-in', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Demo accounts' })).toBeVisible();
  await page.getByRole('button', { name: 'Fill credentials for MFA Administrator' }).click();
  await expect(page.getByLabel('Email')).toHaveValue('mfa@navfarm.demo');
  await expect(page.getByLabel('Password')).toHaveValue(password);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Verification code 123456 or recovery NAVFARM-RECOVERY')).toBeVisible();
});

test('each primary account lands only in its permitted mock scenario', async ({ page }) => {
  await signIn(page, 'system@navfarm.demo');
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await reset(page);
  await signIn(page, 'tenant@navfarm.demo');
  await expect(page).toHaveURL(/\/console\/dashboard$/);
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/access-denied/);
  await reset(page);
  await signIn(page, 'manager@navfarm.demo');
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/);
  await reset(page);
  await signIn(page, 'viewer@navfarm.demo');
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/);
});

test('viewer can inspect but cannot initiate operational mutations', async ({ page }) => {
  await signIn(page, 'viewer@navfarm.demo');
  await page.goto('/green-valley-poultry/batches');
  await expect(page.getByRole('main').getByRole('heading', { name: 'Batches' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New batch' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Manage batch/ })).toHaveCount(0);
  await page.goto('/green-valley-poultry/operations');
  await expect(page.getByRole('button', { name: 'Record entry' })).toHaveCount(0);
  await page.goto('/green-valley-poultry/quality');
  await expect(page.getByRole('button', { name: 'New QC batch' })).toHaveCount(0);
  const response = await page.request.post('/api/v1/companies/company-green-valley/batches', { data: {} });
  expect(response.status()).toBe(403);
});

test('multi-company context selection switches and persists without cross-company leakage', async ({ page }) => {
  await signIn(page, 'multi@navfarm.demo');
  await expect(page).toHaveURL(/\/context-selection$/);
  await page.getByRole('button', { name: /Green Valley Poultry/ }).click();
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces$/);
  await page.getByRole('button', { name: /Poultry Operations/ }).click();
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/);
  await page.reload();
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/);
  await page.goto('/context-selection');
  await page.getByRole('button', { name: /Harvest Ridge Farms/ }).click();
  await expect(page).toHaveURL(/\/harvest-ridge-farms\/workspaces\/crop-production\/dashboard$/);
  await expect(page.getByText('Green Valley Poultry').first()).toHaveCount(0);
});

test('MFA blocks protected pages until verification and supports recovery', async ({ page }) => {
  await signIn(page, 'mfa@navfarm.demo');
  await expect(page).toHaveURL(/\/mfa\/verify\?challengeId=challenge-user-mfa$/);
  await page.getByLabel('Verification code').fill('000000');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await expect(page.getByText('Invalid verification code.')).toBeVisible();
  await page.goto('/green-valley-poultry/dashboard');
  await expect(page).toHaveURL(/\/login/);
  await signIn(page, 'mfa@navfarm.demo');
  await page.getByRole('link', { name: 'Use a recovery code' }).click();
  await page.getByLabel('Recovery code').fill('NAVFARM-RECOVERY');
  await page.getByRole('button', { name: 'Recover account' }).click();
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/);
});

test('suspended and incomplete-onboarding accounts remain in their protected flows', async ({ page }) => {
  await signIn(page, 'suspended@navfarm.demo');
  await expect(page).toHaveURL(/\/access-denied\?reason=suspended-tenant$/);
  await expect(page.getByRole('heading', { name: 'Tenant access suspended' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, 'onboarding@navfarm.demo');
  await expect(page).toHaveURL(/\/bluewater-aqua\/setup\/profile$/);
  await page.goto('/bluewater-aqua/operations');
  await expect(page).toHaveURL(/\/bluewater-aqua\/setup\/review$/);
  await expect(page.getByRole('heading', { name: 'Review & completion' })).toBeVisible();
});

test('presentation routes are responsive and retain reachable actions', async ({ page }) => {
  await mkdir(presentationDirectory, { recursive: true });
  await signIn(page, 'manager@navfarm.demo');
  await capture(page, 'manager-dashboard', 1440, 900);
  await page.goto('/green-valley-poultry/batches');
  await expect(page.getByRole('button', { name: 'New batch' })).toBeVisible();
  await capture(page, 'manager-batches', 1440, 900);
  await page.goto('/green-valley-poultry/reports');
  await expect(page.getByText('Variance analysis')).toBeVisible();
  await capture(page, 'manager-reports', 1440, 900);
  await page.goto('/green-valley-poultry/quality');
  await expect(page.getByRole('button', { name: 'New QC batch' })).toBeVisible();
  await capture(page, 'manager-quality', 768, 1024);
  await page.goto('/green-valley-poultry/traceability');
  await expect(page.getByRole('button', { name: 'Generate QR pack' })).toBeVisible();
  await capture(page, 'manager-traceability', 768, 1024);
  await page.goto('/green-valley-poultry/resources');
  await expect(page.getByRole('button', { name: 'Add resource' })).toBeVisible();
  await capture(page, 'manager-resources', 390, 844);
  await page.goto('/green-valley-poultry/batches');
  await capture(page, 'manager-batches', 390, 844);
  await page.getByRole('button', { name: 'New batch' }).click();
  await expect(page.getByRole('dialog', { name: 'Create production batch' })).toBeVisible();
  await capture(page, 'manager-batch-dialog', 390, 844);
  await page.goto('/login');
  await page.context().clearCookies();
  await signIn(page, 'tenant@navfarm.demo');
  await expect(page.getByRole('heading', { name: 'Tenant dashboard' })).toBeVisible();
  await capture(page, 'tenant-dashboard', 1280, 800);
  await reset(page);
  await signIn(page, 'onboarding@navfarm.demo');
  await expect(page.getByRole('heading', { name: 'Company profile' })).toBeVisible();
  await capture(page, 'onboarding-profile', 1280, 800);
  await capture(page, 'onboarding-profile', 390, 844);
});
