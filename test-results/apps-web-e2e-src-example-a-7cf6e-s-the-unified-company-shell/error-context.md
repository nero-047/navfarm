# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/web-e2e/src/example.spec.ts >> authenticates and opens the unified company shell
- Location: apps/web-e2e/src/example.spec.ts:60:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/login", waiting until "load"

```

```
Error: page.waitForResponse: Test ended.
```

# Test source

```ts
  1   | import { mkdir } from 'node:fs/promises';
  2   | import { resolve } from 'node:path';
  3   | import { test, expect, type Page } from '@playwright/test';
  4   | 
  5   | const screenshotDirectory = resolve(process.cwd(), '../../docs/screenshots/phase2');
  6   | const phase3ScreenshotDirectory = resolve(process.cwd(), '../../docs/screenshots/phase3');
  7   | 
  8   | async function login(page: Page, email: string) {
> 9   |   const sessionLoaded = page.waitForResponse((response) =>
      |                              ^ Error: page.waitForResponse: Test ended.
  10  |     response.url().endsWith('/api/v1/auth/session'),
  11  |   );
  12  |   await page.goto('/login');
  13  |   await sessionLoaded;
  14  | 
  15  |   const emailInput = page.getByLabel('Email');
  16  |   const password = page.getByLabel('Password');
  17  |   await emailInput.fill(email);
  18  |   await password.fill('Demo123!');
  19  |   await expect(emailInput).toHaveValue(email);
  20  |   await expect(password).toHaveValue('Demo123!');
  21  |   await page.getByRole('button', { name: 'Sign In' }).click();
  22  |   const destinations: Record<string, RegExp> = {
  23  |     'system@navfarm.demo': /\/admin\/dashboard$/,
  24  |     'tenant@navfarm.demo': /\/console\/dashboard$/,
  25  |     'manager@navfarm.demo': /\/green-valley-poultry\/dashboard$/,
  26  |     'onboarding@navfarm.demo': /\/bluewater-aqua\/setup\/profile$/,
  27  |     'auditor@navfarm.demo': /\/green-valley-poultry\/dashboard$/,
  28  |   };
  29  |   await expect(page).toHaveURL(destinations[email] ?? /\/context-selection$/);
  30  | }
  31  | 
  32  | async function waitForScreenshotReady(page: Page) {
  33  |   await page.addStyleTag({ content: 'nextjs-portal, #__next-build-watcher { display: none !important; }' });
  34  |   await page.evaluate('document.fonts.ready');
  35  |   await expect(page.locator('.animate-pulse')).toHaveCount(0);
  36  |   await expect(page.getByText('Loading your secure workspace')).toHaveCount(0);
  37  |   await expect(page.getByText(/Loading.*…/)).toHaveCount(0);
  38  | }
  39  | 
  40  | async function capturePair(page: Page, name: string) {
  41  |   await page.setViewportSize({ width: 1440, height: 1000 });
  42  |   await waitForScreenshotReady(page);
  43  |   await page.screenshot({ path: resolve(screenshotDirectory, `${name}-desktop.png`), fullPage: true });
  44  |   await page.setViewportSize({ width: 390, height: 844 });
  45  |   await waitForScreenshotReady(page);
  46  |   await expect.poll(() => page.evaluate<number>('document.documentElement.scrollWidth')).toBeLessThanOrEqual(390);
  47  |   await page.screenshot({ path: resolve(screenshotDirectory, `${name}-mobile.png`), fullPage: true });
  48  | }
  49  | 
  50  | async function capturePhase3Pair(page: Page, name: string) {
  51  |   await page.setViewportSize({ width: 1440, height: 1000 });
  52  |   await waitForScreenshotReady(page);
  53  |   await page.screenshot({ path: resolve(phase3ScreenshotDirectory, `${name}-desktop.png`), fullPage: true });
  54  |   await page.setViewportSize({ width: 390, height: 844 });
  55  |   await waitForScreenshotReady(page);
  56  |   await expect.poll(() => page.evaluate<number>('document.documentElement.scrollWidth')).toBeLessThanOrEqual(390);
  57  |   await page.screenshot({ path: resolve(phase3ScreenshotDirectory, `${name}-mobile.png`), fullPage: true });
  58  | }
  59  | 
  60  | test('authenticates and opens the unified company shell', async ({ page }) => {
  61  |   await login(page, 'manager@navfarm.demo');
  62  | 
  63  |   await expect(page).toHaveURL(/\/green-valley-poultry\/dashboard$/);
  64  |   await expect(page.getByRole('heading', { name: 'Executive dashboard' })).toBeVisible();
  65  |   await expect(page.getByRole('button', { name: /Company workspace Green Valley Poultry/ })).toBeVisible();
  66  | });
  67  | 
  68  | test('system administrator opens the tenant registry and tenant detail', async ({ page }) => {
  69  |   await login(page, 'system@navfarm.demo');
  70  |   await expect(page).toHaveURL(/\/admin\/dashboard$/);
  71  |   await page.goto('/admin/tenants');
  72  |   await expect(page.getByRole('heading', { name: 'Tenant registry' })).toBeVisible();
  73  |   await expect(page.getByRole('table', { name: 'NAVFarm tenants' })).toBeVisible();
  74  |   await expect(page.getByRole('table', { name: 'NAVFarm tenants' })).toBeVisible();
  75  |   await page.goto('/admin/tenants/tenant-demo/overview');
  76  |   await expect(page.getByRole('heading', { name: 'Green Valley Holdings' })).toBeVisible();
  77  | });
  78  | 
  79  | test('tenant administrator opens dashboard and company list', async ({ page }) => {
  80  |   await login(page, 'tenant@navfarm.demo');
  81  |   await page.goto('/console/dashboard');
  82  |   await expect(page.getByRole('heading', { name: 'Tenant dashboard' })).toBeVisible();
  83  |   await page.goto('/console/companies');
  84  |   await expect(page.getByRole('main').getByRole('heading', { name: 'Companies' })).toBeVisible();
  85  |   await expect(page.getByText('Valley Feed Processing')).toBeVisible();
  86  |   await expect(page.getByText('Valley Feed Processing')).toBeVisible();
  87  | });
  88  | 
  89  | test('incomplete company context opens its onboarding profile', async ({ page }) => {
  90  |   await login(page, 'onboarding@navfarm.demo');
  91  |   await expect(page).toHaveURL(/\/bluewater-aqua\/setup\/profile$/);
  92  |   await expect(page.getByRole('main').getByRole('heading', { name: 'Company profile' })).toBeVisible();
  93  | });
  94  | 
  95  | test('platform administrator creates a tenant through the contract workflow', async ({ page }) => {
  96  |   expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
  97  |   await login(page, 'system@navfarm.demo');
  98  |   await page.goto('/admin/tenants/new');
  99  |   await expect(page.getByRole('heading', { name: 'Create tenant' })).toBeVisible();
  100 |   await page.getByLabel('Tenant code').fill('E2E_TENANT');
  101 |   await page.getByLabel('Tenant name').fill('E2E Tenant');
  102 |   await page.getByRole('button', { name: 'Save and continue' }).click();
  103 |   await expect(page.getByRole('heading', { name: 'Plan selection' })).toBeFocused();
  104 |   await page.getByRole('button', { name: 'Save and continue' }).click();
  105 |   await page.getByLabel('Billing email').fill('billing@e2e.demo');
  106 |   await page.getByRole('button', { name: 'Save and continue' }).click();
  107 |   await page.getByRole('button', { name: 'Save and continue' }).click();
  108 |   await page.getByLabel('Administrator name').fill('E2E Administrator');
  109 |   await page.getByLabel('Administrator email').fill('admin@e2e.demo');
```