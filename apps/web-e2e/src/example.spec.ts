import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test, expect, type Page } from '@playwright/test';

const screenshotDirectory = resolve(process.cwd(), '../../docs/screenshots/phase2');
const phase3ScreenshotDirectory = resolve(process.cwd(), '../../docs/screenshots/phase3');

async function login(page: Page, email: string) {
  const sessionLoaded = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/session'),
  );
  await page.goto('/login');
  await sessionLoaded;

  const emailInput = page.getByLabel('Email');
  const password = page.getByLabel('Password');
  await emailInput.fill(email);
  await password.fill('Demo123!');
  await expect(emailInput).toHaveValue(email);
  await expect(password).toHaveValue('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(
    email === 'system@navfarm.demo' ? /\/admin\/dashboard$/ : /\/context-selection$/,
  );
}

async function selectCompany(page: Page, name: RegExp) {
  await expect(page).toHaveURL(/\/context-selection$/);
  await page.getByRole('button', { name }).click();
}

async function capturePair(page: Page, name: string) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => new Promise((resolvePromise) => setTimeout(resolvePromise, 250)));
  await page.evaluate('document.fonts.ready');
  await page.screenshot({ path: resolve(screenshotDirectory, `${name}-desktop.png`), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => new Promise((resolvePromise) => setTimeout(resolvePromise, 250)));
  await page.evaluate('document.fonts.ready');
  await expect.poll(() => page.evaluate<number>('document.documentElement.scrollWidth')).toBeLessThanOrEqual(390);
  await page.screenshot({ path: resolve(screenshotDirectory, `${name}-mobile.png`), fullPage: true });
}

async function capturePhase3Pair(page: Page, name: string) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => new Promise((resolvePromise) => setTimeout(resolvePromise, 250)));
  await page.evaluate('document.fonts.ready');
  await page.screenshot({ path: resolve(phase3ScreenshotDirectory, `${name}-desktop.png`), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => new Promise((resolvePromise) => setTimeout(resolvePromise, 250)));
  await page.evaluate('document.fonts.ready');
  await expect.poll(() => page.evaluate<number>('document.documentElement.scrollWidth')).toBeLessThanOrEqual(390);
  await page.screenshot({ path: resolve(phase3ScreenshotDirectory, `${name}-mobile.png`), fullPage: true });
}

test('authenticates and opens the unified company shell', async ({ page }) => {
  await login(page, 'manager@navfarm.demo');

  await selectCompany(page, /Green Valley Poultry/);

  await expect(page).toHaveURL(/\/green-valley-poultry\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Executive dashboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Company workspace Green Valley Poultry/ })).toBeVisible();
});

test('system administrator opens the tenant registry and tenant detail', async ({ page }) => {
  await login(page, 'system@navfarm.demo');
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await page.goto('/admin/tenants');
  await expect(page.getByRole('heading', { name: 'Tenant registry' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'NAVFarm tenants' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'NAVFarm tenants' })).toBeVisible();
  await page.goto('/admin/tenants/tenant-demo/overview');
  await expect(page.getByRole('heading', { name: 'Green Valley Holdings' })).toBeVisible();
});

test('tenant administrator opens dashboard and company list', async ({ page }) => {
  await login(page, 'tenant@navfarm.demo');
  await selectCompany(page, /Green Valley Poultry/);
  await page.goto('/console/dashboard');
  await expect(page.getByRole('heading', { name: 'Tenant dashboard' })).toBeVisible();
  await page.goto('/console/companies');
  await expect(page.getByRole('main').getByRole('heading', { name: 'Companies' })).toBeVisible();
  await expect(page.getByText('Valley Feed Processing')).toBeVisible();
  await expect(page.getByText('Valley Feed Processing')).toBeVisible();
});

test('company onboarding works at desktop and mobile widths', async ({ page }) => {
  await login(page, 'onboarding@navfarm.demo');
  await selectCompany(page, /BlueWater Aqua/);
  await page.goto('/bluewater-aqua/setup/profile');
  await expect(page.getByRole('heading', { name: 'Company profile' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Company setup completion' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('navigation', { name: 'Company setup steps' })).toBeVisible();
  await page.goto('/bluewater-aqua/setup/review');
  await expect(page.getByRole('heading', { name: 'Review & completion' })).toBeVisible();
  await expect(page.getByText('Blocking requirements')).toBeVisible();
});

test('platform administrator creates a tenant through the contract workflow', async ({ page }) => {
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
  await login(page, 'system@navfarm.demo');
  await page.goto('/admin/tenants/new');
  await expect(page.getByRole('heading', { name: 'Create tenant' })).toBeVisible();
  await page.getByLabel('Tenant code').fill('E2E_TENANT');
  await page.getByLabel('Tenant name').fill('E2E Tenant');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByRole('heading', { name: 'Plan selection' })).toBeFocused();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.getByLabel('Billing email').fill('billing@e2e.demo');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.getByLabel('Administrator name').fill('E2E Administrator');
  await page.getByLabel('Administrator email').fill('admin@e2e.demo');
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.getByRole('button', { name: 'Confirm review' }).click();
  await page.getByRole('button', { name: 'Create tenant' }).click();
  await expect(page.getByText('E2E Tenant was created.')).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/tenants\/tenant-.*\/overview$/);
  await expect(page.getByRole('heading', { name: 'E2E Tenant' })).toBeVisible();
});

test('tenant administrator creates a draft company and enters setup', async ({ page }) => {
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
  await login(page, 'tenant@navfarm.demo');
  await selectCompany(page, /Green Valley Poultry/);
  await page.goto('/console/companies/new');
  await expect(page.getByRole('heading', { name: 'Create company' })).toBeVisible();
  await page.getByLabel('Company code').fill('E2E_COMPANY');
  await page.getByLabel('Legal company name').fill('E2E Company');
  await page.getByRole('button', { name: 'Create and start setup' }).click();
  await expect(page).toHaveURL(/\/e2e-company\/setup\/profile$/);
  await expect(page.getByRole('heading', { name: 'Company profile' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Company setup completion' })).toHaveAttribute('aria-valuenow', '0');
});

test('captures the Phase 2 desktop and mobile evidence set', async ({ page }) => {
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
  await mkdir(screenshotDirectory, { recursive: true });

  await login(page, 'system@navfarm.demo');
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await page.goto('/admin/tenants');
  await expect(page.getByRole('heading', { name: 'Tenant registry' })).toBeVisible();
  await capturePair(page, 'tenant-list');
  await page.goto('/admin/tenants/tenant-demo/overview');
  await expect(page.getByRole('heading', { name: 'Green Valley Holdings' })).toBeVisible();
  await capturePair(page, 'tenant-details');

  await page.context().clearCookies();
  await login(page, 'tenant@navfarm.demo');
  await selectCompany(page, /Green Valley Poultry/);
  await page.goto('/console/dashboard');
  await expect(page.getByRole('heading', { name: 'Tenant dashboard' })).toBeVisible();
  await capturePair(page, 'tenant-dashboard');
  await page.goto('/console/companies');
  await expect(page.getByRole('main').getByRole('heading', { name: 'Companies' })).toBeVisible();
  await capturePair(page, 'company-list');

  await page.context().clearCookies();
  await login(page, 'onboarding@navfarm.demo');
  await selectCompany(page, /BlueWater Aqua/);
  await page.goto('/bluewater-aqua/setup/profile');
  await expect(page.getByRole('heading', { name: 'Company profile' })).toBeVisible();
  await capturePair(page, 'company-onboarding');
  await page.goto('/bluewater-aqua/setup/review');
  await expect(page.getByRole('heading', { name: 'Review & completion' })).toBeVisible();
  await capturePair(page, 'setup-review-readiness');
});

test('Phase 3 masters and accounting workflows render responsively', async ({ page }) => {
  test.slow();
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
  await mkdir(phase3ScreenshotDirectory, { recursive: true });
  await login(page, 'tenant@navfarm.demo');
  await selectCompany(page, /Green Valley Poultry/);

  await page.goto('/green-valley-poultry/masters');
  await expect(page.getByRole('heading', { name: 'Master-data dashboard' })).toBeVisible();
  await capturePhase3Pair(page, 'master-data-dashboard');

  await page.goto('/green-valley-poultry/masters/items');
  await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();
  await expect(page.getByText('FEED_GROWER')).toBeVisible();
  await page.getByRole('button', { name: 'Add record' }).click();
  await expect(page.getByRole('heading', { name: 'Create items record' })).toBeVisible();
  await capturePhase3Pair(page, 'item-listing-and-form');

  await page.goto('/green-valley-poultry/settings/business-structure');
  await expect(page.getByRole('heading', { name: 'NOB & LOB business structure' })).toBeVisible();
  await expect(page.getByText('company-nob-poultry')).toBeVisible();
  await capturePhase3Pair(page, 'nob-lob-configuration');

  await page.goto('/green-valley-poultry/accounting/chart-of-accounts');
  await expect(page.getByRole('heading', { name: 'Chart of accounts' })).toBeVisible();
  await expect(page.getByText(/1100/)).toBeVisible();
  await capturePhase3Pair(page, 'chart-of-accounts-tree');

  await page.goto('/green-valley-poultry/accounting/gl-mappings');
  await expect(page.getByRole('heading', { name: 'GL mapping matrix' })).toBeVisible();
  await capturePhase3Pair(page, 'gl-mapping-dashboard');

  await page.goto('/green-valley-poultry/masters/items/import');
  await expect(page.getByRole('heading', { name: 'Import Items' })).toBeVisible();
  await page.getByRole('button', { name: 'Validate upload' }).click();
  await expect(page.getByRole('heading', { name: 'Validation preview' })).toBeVisible();
  await capturePhase3Pair(page, 'import-validation');

  await page.goto('/green-valley-poultry/accounting/readiness');
  await expect(page.getByRole('heading', { name: 'Configuration readiness' })).toBeVisible();
  await expect(page.getByText('Operations ready')).toBeVisible();
  await capturePhase3Pair(page, 'operations-readiness');

  await page.goto('/green-valley-poultry/masters');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Master-data dashboard' })).toBeVisible();
  await page.screenshot({ path: resolve(phase3ScreenshotDirectory, 'mobile-master-data-navigation.png'), fullPage: true });
});

test('Phase 3 role restrictions apply to direct URLs and actions', async ({ page }) => {
  await login(page, 'auditor@navfarm.demo');
  await selectCompany(page, /Green Valley Poultry/);
  await page.goto('/green-valley-poultry/accounting/chart-of-accounts');
  await expect(page.getByRole('heading', { name: 'Chart of accounts' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Add account' })).toHaveCount(0);
  await page.goto('/green-valley-poultry/masters/items');
  await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add record' })).toHaveCount(0);
});
