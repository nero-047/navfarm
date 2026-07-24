import { test, expect } from '@playwright/test';

test('authenticates and opens the unified company shell', async ({ page }) => {
  const sessionLoaded = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/auth/session'),
  );
  await page.goto('/login');
  await sessionLoaded;

  const email = page.getByLabel('Email');
  const password = page.getByLabel('Password');
  await email.fill('manager@navfarm.demo');
  await password.fill('Demo123!');
  await expect(email).toHaveValue('manager@navfarm.demo');
  await expect(password).toHaveValue('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/context-selection$/);
  await page.getByRole('button', { name: /Green Valley Poultry/ }).click();

  await expect(page).toHaveURL(/\/green-valley-poultry\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Executive dashboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Company workspace Green Valley Poultry/ })).toBeVisible();
});
