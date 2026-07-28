import { test, expect } from '@playwright/test';

async function waitForScreenshotReady(page: import('@playwright/test').Page) {
  await page.addStyleTag({ content: 'nextjs-portal, #__next-build-watcher { display: none !important; }' });
  await expect.poll(() => page.evaluate('document.fonts.status')).toBe('loaded');
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await expect(page.getByText('Loading your secure workspace')).toHaveCount(0);
  await expect(page.getByText(/Loading.*…/)).toHaveCount(0);
}

test('shared ApplicationShell geometry assertions', async ({ page }) => {
  // ── Tenant admin context ──
  await page.goto('/login');
  await page.getByLabel('Email').fill('tenant@navfarm.demo');
  await page.getByLabel('Password').fill('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/console\/dashboard$/);

  // ── Desktop 1280×800: tenant dashboard ──
  await page.setViewportSize({ width: 1280, height: 800 });
  await waitForScreenshotReady(page);

  const sidebarDesktop = await page.locator('aside').first().boundingBox();
  const mainDesktop = await page.locator('main').first().boundingBox();
  expect(sidebarDesktop).not.toBeNull();
  expect(mainDesktop).not.toBeNull();
  // Sidebar must be at the left edge
  expect(sidebarDesktop!.x).toBe(0);
  // Sidebar width should be the expanded width (252px)
  expect(sidebarDesktop!.width).toBe(252);
  // Main content must start immediately after the sidebar, not underneath it
  expect(mainDesktop!.x).toBe(sidebarDesktop!.width);
  // Main + sidebar must fill the viewport
  expect(mainDesktop!.x + mainDesktop!.width).toBe(1280);
  // No horizontal overflow
  const scrollWidthDesktop = await page.evaluate<number>('document.documentElement.scrollWidth');
  expect(scrollWidthDesktop).toBeLessThanOrEqual(1280);
  await page.screenshot({ path: 'debug-tenant-dashboard-1280x800.png', fullPage: true });

  // ── Mobile 390×844: tenant company list ──
  await page.goto('/console/companies');
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForScreenshotReady(page);

  // On mobile, the desktop sidebar must be hidden (no aside visible in flow)
  const asideBoxMobile = await page.locator('aside').first().boundingBox();
  // aside should be null or hidden (display: none via `hidden lg:block`)
  expect(asideBoxMobile).toBeNull();
  // Main must start at x=0 (no left margin from sidebar)
  const mainMobileCompanies = await page.locator('main').first().boundingBox();
  expect(mainMobileCompanies).not.toBeNull();
  expect(mainMobileCompanies!.x).toBe(0);
  // Main must use full viewport width
  expect(mainMobileCompanies!.width).toBe(390);
  // No horizontal overflow
  const scrollWidthCompanies = await page.evaluate<number>('document.documentElement.scrollWidth');
  expect(scrollWidthCompanies).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'debug-company-list-390x844.png', fullPage: true });

  // ── Mobile 390×844: Chart of Accounts (company workspace) ──
  await page.goto('/login');
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill('manager@navfarm.demo');
  await page.getByLabel('Password').fill('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces\/poultry-operations\/dashboard$/);

  await page.goto('/green-valley-poultry/accounting/chart-of-accounts');
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForScreenshotReady(page);

  const asideBoxCoA = await page.locator('aside').first().boundingBox();
  expect(asideBoxCoA).toBeNull();
  const mainMobileCoA = await page.locator('main').first().boundingBox();
  expect(mainMobileCoA).not.toBeNull();
  expect(mainMobileCoA!.x).toBe(0);
  expect(mainMobileCoA!.width).toBe(390);
  const scrollWidthCoA = await page.evaluate<number>('document.documentElement.scrollWidth');
  expect(scrollWidthCoA).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'debug-coa-390x844.png', fullPage: true });
});
