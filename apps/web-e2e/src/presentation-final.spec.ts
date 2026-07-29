import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const password = 'Demo123!';
const finalDirectory = resolve(process.cwd(), '../../docs/screenshots/presentation-final');
const phase2Directory = resolve(process.cwd(), '../../docs/screenshots/phase2');
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
  await expect(page).not.toHaveURL(/\/login$/);
}

async function assertCaptureReady(page: Page, width: number) {
  await page.addStyleTag({
    content: 'nextjs-portal, #__next-build-watcher { display: none !important; }',
  });
  await expect.poll(() => page.evaluate('document.fonts.status')).toBe('loaded');
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await expect(page.getByText(/Loading your secure workspace|Loading.*…/)).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText(/Something went wrong|Unable to load|Request failed/i)).toHaveCount(0);
  await expect
    .poll(() => page.evaluate('document.documentElement.scrollWidth'))
    .toBeLessThanOrEqual(width);
}

async function capture(page: Page, path: string, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await assertCaptureReady(page, width);
  if (process.env.NAVFARM_CAPTURE_BROAD_SCREENSHOTS === 'true') await page.screenshot({ path });
}

test.beforeAll(async () => {
  await mkdir(finalDirectory, { recursive: true });
  await mkdir(phase2Directory, { recursive: true });
  await mkdir(presentationDirectory, { recursive: true });
});

test.beforeEach(async ({ page }) => reset(page));

test('approved manager operational evidence', async ({ page }) => {
  await signIn(page, 'manager@navfarm.demo');
  await expect(page).toHaveURL(
    /\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/,
  );
  await expect(page.getByText('Green Valley Poultry').first()).toBeVisible();
  await expect(page.getByText('Poultry Operations').first()).toBeVisible();
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Executive dashboard' }),
  ).toBeVisible();
  await capture(
    page,
    resolve(presentationDirectory, 'manager-dashboard-1440x900.png'),
    1440,
    900,
  );
  await capture(
    page,
    resolve(finalDirectory, 'manager-dashboard-green-valley-poultry-operations-1440x900.png'),
    1440,
    900,
  );

  await page.goto('/green-valley-poultry/workspaces/poultry-operations/resources');
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Resources and KPIs' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add resource' })).toBeVisible();
  await expect(page.getByText('KPI scheduler')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByText('KPI scheduler').scrollIntoViewIfNeeded();
  await capture(
    page,
    resolve(presentationDirectory, 'manager-resources-390x844.png'),
    390,
    844,
  );
});

test('approved tenant workspace administration evidence', async ({ page }) => {
  await signIn(page, 'tenant@navfarm.demo');
  await page.goto('/green-valley-poultry/workspaces');
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Choose a business area' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create workspace' })).toBeVisible();
  await capture(
    page,
    resolve(finalDirectory, 'tenant-admin-workspace-list-green-valley-1440x900.png'),
    1440,
    900,
  );

  await page.goto('/green-valley-poultry/workspaces/poultry-operations');
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Poultry Operations' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save workspace' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Readiness' })).toBeVisible();
  await expect(page.getByText('Workspace membership')).toBeVisible();
  await capture(
    page,
    resolve(finalDirectory, 'tenant-admin-workspace-detail-poultry-operations-1440x900.png'),
    1440,
    900,
  );
  await page.getByRole('button', { name: 'Add member' }).scrollIntoViewIfNeeded();
  await expect(page.getByLabel('Member email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add member' })).toBeVisible();
  await capture(
    page,
    resolve(finalDirectory, 'tenant-admin-workspace-membership-poultry-operations-1440x900.png'),
    1440,
    900,
  );
});

test('approved legacy route selector evidence', async ({ page }) => {
  await signIn(page, 'multi@navfarm.demo');
  await page.getByRole('button', {
    name: 'Green Valley Poultry company administration',
  }).click();
  await page.goto('/green-valley-poultry/batches');
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Choose a business area' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Poultry Operations/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Feed Mill/ })).toBeVisible();
  await capture(
    page,
    resolve(finalDirectory, 'multi-workspace-legacy-batches-selector-1440x900.png'),
    1440,
    900,
  );
});

test('onboarding evidence uses explicitly requested loaded setup screens', async ({ page }) => {
  await signIn(page, 'onboarding@navfarm.demo');
  await page.goto('/bluewater-aqua/setup/review');
  await expect(page).toHaveURL(/\/bluewater-aqua\/setup\/review$/);
  await expect(page.getByRole('main').getByRole('heading', { name: 'Review & completion' })).toBeVisible();
  await capture(
    page,
    resolve(phase2Directory, 'company-onboarding-redirect-desktop.png'),
    1440,
    900,
  );
  await capture(
    page,
    resolve(phase2Directory, 'company-onboarding-redirect-mobile.png'),
    390,
    844,
  );
  await page.goto('/bluewater-aqua/setup/profile');
  await expect(page.getByRole('main').getByRole('heading', { name: 'Company profile' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save and continue' })).toBeVisible();
  await capture(
    page,
    resolve(presentationDirectory, 'onboarding-profile-390x844.png'),
    390,
    844,
  );
});
