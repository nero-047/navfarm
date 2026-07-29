import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const evidenceDirectory = resolve(process.cwd(), '../../docs/screenshots/branding');

async function reset(page: Page) {
  await page.context().clearCookies();
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
}

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Demo123!');
  const [response] = await Promise.all([
    page.waitForResponse((candidate) => candidate.url().includes('/api/v1/auth/login') && candidate.request().method() === 'POST'),
    page.getByRole('button', { name: 'Sign In' }).click(),
  ]);
  expect(response.ok()).toBe(true);
}

async function assertBrandAsset(page: Page) {
  const visibleBrand = page.locator('img[alt="NAVFarm icon"]:visible').first();
  await expect(visibleBrand).toBeVisible();
  await expect(visibleBrand).toHaveAttribute('src', '/favicon.ico');
  await expect.poll(() => visibleBrand.evaluate((image) => {
    const renderedImage = image as unknown as { complete: boolean; naturalWidth: number };
    return renderedImage.complete && renderedImage.naturalWidth > 0;
  })).toBe(true);
}

async function capture(page: Page, name: string, width = 1440, height = 900) {
  if (process.env.NAVFARM_CAPTURE_BROAD_SCREENSHOTS !== 'true') return;
  await page.setViewportSize({ width, height });
  await page.addStyleTag({ content: 'nextjs-portal, #__next-build-watcher { display: none !important; }' });
  await expect.poll(() => page.evaluate('document.fonts.status')).toBe('loaded');
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await expect.poll(() => page.evaluate('document.documentElement.scrollWidth')).toBeLessThanOrEqual(width);
  await page.screenshot({ path: resolve(evidenceDirectory, `${name}-${width}x${height}.png`) });
}

test.beforeAll(async () => {
  if (process.env.NAVFARM_CAPTURE_BROAD_SCREENSHOTS === 'true') {
    await mkdir(evidenceDirectory, { recursive: true });
  }
});

test.beforeEach(async ({ page }) => reset(page));

test('focused local-brand evidence', async ({ page }) => {
  await page.goto('/login');
  await assertBrandAsset(page);
  await capture(page, 'login');

  await signIn(page, 'tenant@navfarm.demo');
  await expect(page).toHaveURL(/\/console\/dashboard$/);
  await assertBrandAsset(page);
  await capture(page, 'expanded-desktop-sidebar');

  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await assertBrandAsset(page);
  await capture(page, 'collapsed-desktop-sidebar');

  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await assertBrandAsset(page);
  await capture(page, 'mobile-navigation', 390, 844);

  await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
  await capture(page, 'tenant-admin-dashboard');

  await reset(page);
  await signIn(page, 'multi@navfarm.demo');
  await expect(page.getByRole('heading', { name: 'Where would you like to work?' })).toBeVisible();
  await expect(page.getByRole('button', {
    name: 'Green Valley Poultry workspace Poultry Operations',
  })).toBeVisible();
  await capture(page, 'workspace-selector');

  await reset(page);
  await signIn(page, 'tenant@navfarm.demo');
  await page.goto('/green-valley-poultry/workspaces/feed-mill/dashboard');
  await expect(page.getByRole('heading', { name: 'Workspace access not assigned' })).toBeVisible();
  await capture(page, 'access-not-assigned');

  await reset(page);
  await signIn(page, 'suspended@navfarm.demo');
  await expect(page.getByRole('heading', { name: 'Account suspended' })).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await capture(page, 'suspended-account');
});
