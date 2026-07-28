import { test, expect } from '@playwright/test';
const BASE = 'http://localhost:3001';

test('stale context test', async ({ page }) => {
  // Login as platform admin
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.getByLabel('Email').fill('system@navfarm.demo');
  await page.getByLabel('Password').fill('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/admin\/dashboard$/);

  // Now go back to login without explicitly logging out
  await page.goto(`${BASE}/login`);
  
  await page.getByLabel('Email').fill('tenant@navfarm.demo');
  await page.getByLabel('Password').fill('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Does it get access-denied?
  await expect(page).not.toHaveURL(/\/access-denied/);
  
  const url = page.url();
  console.log('Final URL:', url);
});
