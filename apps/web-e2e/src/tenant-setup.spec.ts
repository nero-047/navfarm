import { test, expect } from '@playwright/test';
const BASE = 'http://localhost:3001';

test('Tenant Admin forbidden landing', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
  await page.getByLabel('Email').fill('tenant@navfarm.demo');
  await page.getByLabel('Password').fill('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/console\/dashboard$/);
  
  await page.goto(`${BASE}/valley-feed-processing/setup`);
  
  // See if it redirects to access-denied
  await expect(page).not.toHaveURL(/\/access-denied/);
  console.log('Final URL:', page.url());
});
