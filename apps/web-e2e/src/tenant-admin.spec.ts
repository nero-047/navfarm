import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3001';

test('tenant admin reaches setup route and inspects session', async ({ page }) => {
  const logs: any[] = [];
  page.on('response', async (response) => {
    if (response.url().includes('/api/v1/auth/login') || response.url().includes('/api/v1/auth/session')) {
      const json = await response.json().catch(() => null);
      logs.push({ url: response.url(), json });
    }
  });

  await page.goto(`${BASE}/login`);
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.getByLabel('Email').fill('tenant@navfarm.demo');
  await page.getByLabel('Password').fill('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/console\/dashboard$/);
  
  await page.goto(`${BASE}/console/companies`);
  await expect(page).toHaveURL(/\/console\/companies$/);

  // Click View details or Continue setup
  // Wait, Green Valley Poultry is ACTIVE, so it has "Open workspace"
  // Let's go directly to setup
  await page.goto(`${BASE}/green-valley-poultry/setup`);
  
  // What does it do?
  const url = page.url();
  console.log('Final URL:', url);
  console.log('Logs:', JSON.stringify(logs, null, 2));
  
  const text = await page.textContent('body');
  console.log('Body Text:', text?.substring(0, 500));
});
