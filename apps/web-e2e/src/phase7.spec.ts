import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const screenshotDirectory = resolve(process.cwd(), '../../docs/screenshots/phase7');
const company = 'green-valley-poultry';

async function loginAsManager(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('manager@navfarm.demo');
  await page.getByLabel('Password').fill('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(new RegExp(`/${company}/workspaces/poultry-operations/dashboard$`));
}

async function openWorkspace(page: Page, route: string, heading: string) {
  await page.goto(`/${company}/workspaces/poultry-operations/${route}`);
  await expect(page.getByRole('main').getByRole('heading', { name: heading, exact: true })).toBeVisible();
}

async function waitForScreenshotReady(page: Page) {
  await page.addStyleTag({ content: 'nextjs-portal, #__next-build-watcher { display: none !important; }' });
  await expect.poll(() => page.evaluate('document.fonts.status')).toBe('loaded');
  await expect(page.locator('.animate-pulse')).toHaveCount(0);
  await expect(page.getByText('Loading your secure workspace')).toHaveCount(0);
  await expect(page.getByText(/Loading.*…/)).toHaveCount(0);
}

async function captureViewport(page: Page, name: string, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await waitForScreenshotReady(page);
  await expect
    .poll(() => page.evaluate('document.documentElement.scrollWidth'))
    .toBeLessThanOrEqual(width);
  if (process.env.NAVFARM_CAPTURE_BROAD_SCREENSHOTS === 'true') {
    await page.screenshot({
      path: resolve(screenshotDirectory, `${name}-${width}x${height}.png`),
      fullPage: true,
    });
  }
}

test('manager can create, operate, quality-release, trace, close and report a mock batch', async ({ page }) => {
  await loginAsManager(page);

  await openWorkspace(page, 'batches', 'Batches');
  await page.getByRole('button', { name: 'New batch' }).click();
  await expect(page.getByRole('dialog', { name: 'Create production batch' })).toBeVisible();
  await page.getByLabel(/Opening quantity/).fill('250');
  await page.getByLabel('Expected output').fill('240');
  await page.getByRole('button', { name: 'Create draft batch' }).click();
  await expect(page.getByRole('dialog', { name: 'Create production batch' })).toBeHidden();
  await page.getByRole('button', { name: 'Approve & lock' }).last().click();
  await expect(page.getByText('APPROVED').last()).toBeVisible();

  await openWorkspace(page, 'operations', 'Operations');
  await page.getByRole('button', { name: 'Record entry' }).click();
  await page.getByRole('dialog', { name: 'Record batch operation' }).getByLabel('Entry type').selectOption('OUTPUT');
  await page.getByRole('dialog', { name: 'Record batch operation' }).getByLabel('Actual quantity').fill('240');
  await page.getByRole('button', { name: 'Save operation' }).click();
  await expect(page.getByText('OUTPUT').last()).toBeVisible();
  await expect(page.getByText(/Dr 1150 Output Inventory/)).toBeVisible();

  await openWorkspace(page, 'quality', 'QC batches & release');
  await page.getByRole('button', { name: 'New QC batch' }).click();
  await page.getByRole('button', { name: 'Create QC hold' }).click();
  const inspection = page.getByRole('button', { name: /Inspect/ }).first();
  await inspection.click();
  await page.getByRole('dialog', { name: /Inspect QC-/ }).getByLabel('Disposition').selectOption('PASS');
  await page.getByRole('dialog', { name: /Inspect QC-/ }).getByLabel('Measured result').fill('Within target');
  await page.getByRole('button', { name: 'Save disposition' }).click();
  await expect(page.getByText('PASS').first()).toBeVisible();

  await openWorkspace(page, 'traceability', 'QR traceability');
  await page.getByRole('button', { name: 'Generate QR pack' }).click();
  await page.getByRole('dialog', { name: 'Generate QR pack' }).getByLabel('Pack quantity').fill('2');
  await page.getByRole('button', { name: 'Generate pack' }).click();
  await expect(page.getByText(/QR pack .*generated/)).toBeVisible();

  await openWorkspace(page, 'batches', 'Batches');
  await page.getByRole('button', { name: 'Run close' }).last().click();
  await expect(page.getByText(/closed with a zero WIP balance/)).toBeVisible();

  await openWorkspace(page, 'reports', 'Reports');
  await expect(page.getByText('Variance analysis')).toBeVisible();
  await expect(page.getByText('Price variance')).toBeVisible();
  await expect(page.getByText('Activity history')).toBeVisible();
});

test('key mock-mode routes render without horizontal overflow at required viewports', async ({ page }) => {
  await mkdir(screenshotDirectory, { recursive: true });
  await loginAsManager(page);

  await openWorkspace(page, 'dashboard', 'Executive dashboard');
  await captureViewport(page, 'dashboard', 1440, 900);
  await captureViewport(page, 'dashboard', 1280, 800);
  await captureViewport(page, 'dashboard', 768, 1024);
  await captureViewport(page, 'dashboard', 390, 844);

  await openWorkspace(page, 'batches', 'Batches');
  await captureViewport(page, 'batches', 1440, 900);
  await captureViewport(page, 'batches', 390, 844);

  await openWorkspace(page, 'quality', 'QC batches & release');
  await captureViewport(page, 'quality', 768, 1024);
  await captureViewport(page, 'quality', 390, 844);

  await openWorkspace(page, 'reports', 'Reports');
  await captureViewport(page, 'reports', 1440, 900);
  await captureViewport(page, 'reports', 390, 844);
});
