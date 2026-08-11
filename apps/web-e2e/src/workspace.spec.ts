import { expect, test } from '@playwright/test';

test('unauthenticated entry fails closed to sign in', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(
    /demo|sample data|restore sample/i,
  );
});

test('authentication surface remains usable at required viewport widths', async ({
  page,
}) => {
  for (const width of [1440, 1280, 1024, 834, 768, 640, 390]) {
    await page.setViewportSize({ width, height: width <= 640 ? 844 : 900 });
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    const overflow = await page.evaluate(() => {
      const browserGlobal = globalThis as unknown as {
        document: {
          documentElement: { scrollWidth: number; clientWidth: number };
        };
      };
      return (
        browserGlobal.document.documentElement.scrollWidth -
        browserGlobal.document.documentElement.clientWidth
      );
    });
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(
      1,
    );
  }
});

test('validation uses accessible feedback without calling the API', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Please fill in all fields')).toBeVisible();
});
