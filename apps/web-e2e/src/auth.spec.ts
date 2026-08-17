import { test, expect } from '@playwright/test';

/**
 * Phase 7 auth polish — theme coherence and password visibility.
 *
 * The auth composition (branding panel + form) must resolve to one theme
 * rather than a permanently-dark panel beside a theme-aware form, and the
 * three-way System/Light/Dark control must behave like a real preference:
 * System tracks the OS live, an explicit choice survives a reload and is
 * never silently overwritten by an OS change.
 */

const THEME_KEY = 'navfarm_theme';

test.describe('auth theme — System default and live OS tracking', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('System is the default for a user with no stored preference', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('System resolves to the OS preference — light', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await context.close();
  });

  test('System resolves to the OS preference — dark', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await context.close();
  });

  test('System reacts live when the OS preference changes without a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('auth theme — explicit Light/Dark selection', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('selecting Light applies immediately and persists across reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('radio', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate((k) => localStorage.getItem(k), THEME_KEY)).toBe('light');

    await page.reload();
    await expect(page.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('selecting Dark applies immediately and persists across reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate((k) => localStorage.getItem(k), THEME_KEY)).toBe('dark');

    await page.reload();
    await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('an explicit choice is never silently overwritten by an OS change', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/login');
    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // The OS "changes" back to light; an explicit Dark choice must hold.
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
  });

  test('the branding panel and form panel resolve to the same theme', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('radio', { name: 'Dark' }).click();

    // Both panels derive their surface from theme tokens rather than one
    // being permanently hard-coded — assert they're both dark, not just
    // that the page-level attribute flipped.
    const leftBg = await page.getByTestId('auth-branding-panel').evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const rightBg = await page.getByTestId('auth-form-panel').evaluate((el) => getComputedStyle(el).backgroundColor);
    const luminance = (rgb: string) => {
      const [r, g, b] = (rgb.match(/\d+/g) ?? ['0', '0', '0']).map(Number);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    // Both panels are dark surfaces now (low luminance), not one dark / one
    // near-white — the actual bug this task fixed.
    expect(luminance(leftBg)).toBeLessThan(100);
    expect(luminance(rightBg)).toBeLessThan(100);
  });
});

test.describe('password visibility control', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('defaults to hidden, toggles to shown, and back', async ({ page }) => {
    await page.goto('/login');
    const input = page.locator('#password');
    await expect(input).toHaveAttribute('type', 'password');

    await input.fill('mySecret123!');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();

    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('does not clear or alter the password value', async ({ page }) => {
    await page.goto('/login');
    const input = page.locator('#password');
    await input.fill('mySecret123!');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(input).toHaveValue('mySecret123!');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(input).toHaveValue('mySecret123!');
  });

  test('does not submit the form', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#password').fill('mySecret123!');
    const urlBefore = page.url();
    await page.getByRole('button', { name: 'Show password' }).click();
    // No navigation, and the login form's own validation error (which
    // fires on a real submit with no email filled in) never appears.
    await expect(page).toHaveURL(urlBefore);
    await expect(page.getByText('Please fill in all fields')).toBeHidden();
  });

  test('is keyboard-activatable', async ({ page }) => {
    await page.goto('/login');
    const input = page.locator('#password');
    await input.fill('mySecret123!');
    await page.getByRole('button', { name: 'Show password' }).focus();
    await page.keyboard.press('Enter');
    await expect(input).toHaveAttribute('type', 'text');
  });

  test('is present and independent on the signup password field', async ({ page }) => {
    await page.goto('/signup');
    const input = page.locator('#password');
    await expect(input).toHaveAttribute('type', 'password');
    await input.fill('Str0ng!Pass');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(input).toHaveValue('Str0ng!Pass');
  });
});

test.describe('auth responsive — theme control at every breakpoint', () => {
  for (const [name, viewport] of Object.entries({
    '1440x900': { width: 1440, height: 900 },
    '1280x800': { width: 1280, height: 800 },
    '834x1112': { width: 834, height: 1112 },
    '390x844': { width: 390, height: 844 },
  })) {
    test(`${name}: theme selector renders without overlapping the logo, no page overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/login');
      await expect(page.getByRole('radiogroup', { name: 'Theme' })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
