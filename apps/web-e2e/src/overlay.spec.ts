import { test, expect, type Page } from '@playwright/test';
import {
  CONTENT,
  HEADER,
  PRIMARY_NAV,
  SECOND_COMPANY,
  DEFAULT_COMPANY,
  documentScroll,
  gotoConsole,
  gotoHarness,
} from './support/shell';

/**
 * Phase 2 exit gate — popover / profile / overlay foundation.
 *
 * Split by what each test is actually about. Interaction mechanics — focus,
 * keyboard traversal, dismissal, scroll lock — run on the shell fixture, which
 * renders the same AppShell and the same ProfilePopover for a fraction of the
 * server work. Everything that is only true of the application — that Sign out
 * left the rail, that signing out really ends the session, the workspace
 * switcher, the header's overlay inventory — runs on the real console route.
 *
 * Assertions are on semantics and behaviour — roles, focus, scroll state —
 * never on styling.
 */

/** The identity the shell fixture renders. */
const HARNESS_NAME = 'Shell Harness';
const HARNESS_EMAIL = 'harness@navfarm.test';

const PROFILE_TRIGGER = 'profile-trigger';
const SWITCHER_TRIGGER = 'workspace-switcher-trigger';

async function horizontalOverflow(page: Page): Promise<number> {
  const doc = await documentScroll(page);
  return doc.scrollWidth - doc.clientWidth;
}

test.describe('profile popover', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the avatar is the account trigger and announces its menu', async ({ page }) => {
    await gotoHarness(page);

    const trigger = page.getByTestId(PROFILE_TRIGGER);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('data-state', 'closed');
    // Accessible name, not a bare initials blob.
    await expect(page.getByRole('button', { name: /account menu/i })).toHaveCount(1);
  });

  test('sign out is no longer a permanent primary-nav action', async ({ page }) => {
    await gotoConsole(page);

    await expect(page.locator(PRIMARY_NAV).getByText(/sign out/i)).toHaveCount(0);
    // Nor anywhere else on the page until the account menu is opened.
    await expect(page.getByText(/sign out/i)).toHaveCount(0);
  });

  test('clicking the avatar opens the menu with identity and sign out', async ({ page }) => {
    await gotoHarness(page);

    const trigger = page.getByTestId(PROFILE_TRIGGER);
    await trigger.click();

    const menu = page.getByRole('menu', { name: /account menu/i });
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('data-state', 'open');

    // aria-controls resolves to the panel that is actually on screen.
    await expect(trigger).toHaveAttribute('aria-controls', /\S+/);
    const controls = await trigger.getAttribute('aria-controls');
    await expect(page.locator(`[id="${controls}"]`)).toBeVisible();

    // Account identity, asserted inside the panel: the point is that the menu
    // states who you are, not that the name appears somewhere on the page.
    const panel = page.locator('[data-popover-panel]');
    await expect(panel.getByText(HARNESS_NAME, { exact: true })).toBeVisible();
    await expect(panel.getByText(HARNESS_EMAIL, { exact: true })).toBeVisible();

    // Account entries, then the destructive action.
    await expect(menu.getByRole('menuitem')).toHaveCount(4);
    await expect(menu.getByRole('menuitem', { name: 'Account', exact: true })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Preferences' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /sign out/i })).toBeVisible();
  });

  test('Escape closes it, returns focus to the trigger, and moves no scroll', async ({ page }) => {
    await gotoHarness(page);

    const trigger = page.getByTestId(PROFILE_TRIGGER);
    const contentScroll = () => page.locator(CONTENT).evaluate((el) => el.scrollTop);

    await trigger.click();
    await expect(page.getByRole('menu', { name: /account menu/i })).toBeVisible();
    const before = await contentScroll();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('menu', { name: /account menu/i })).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(await contentScroll()).toBe(before);
    expect((await documentScroll(page)).scrollY).toBe(0);
  });

  test('an outside click closes it without stranding focus', async ({ page }) => {
    await gotoHarness(page);

    const trigger = page.getByTestId(PROFILE_TRIGGER);
    await trigger.click();
    await expect(page.getByRole('menu', { name: /account menu/i })).toBeVisible();

    await page.getByRole('navigation', { name: 'Breadcrumb' }).click();

    await expect(page.getByRole('menu', { name: /account menu/i })).toHaveCount(0);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Non-destructive: the press decides where focus lands, and focus is never
    // left on a node that has been removed from the document with the panel.
    const focus = await page.evaluate(() => ({
      connected: document.activeElement?.isConnected ?? false,
      insidePanel: Boolean(document.activeElement?.closest('[data-popover-panel]')),
    }));
    expect(focus).toEqual({ connected: true, insidePanel: false });
  });

  test('opens from the keyboard and supports Arrow, Home and End', async ({ page }) => {
    await gotoHarness(page);

    const trigger = page.getByTestId(PROFILE_TRIGGER);
    await trigger.focus();
    await page.keyboard.press('ArrowDown');

    const menu = page.getByRole('menu', { name: /account menu/i });
    await expect(menu).toBeVisible();

    const account = menu.getByRole('menuitem', { name: 'Account', exact: true });
    const preferences = menu.getByRole('menuitem', { name: 'Preferences' });
    const signOut = menu.getByRole('menuitem', { name: /sign out/i });

    // Focus enters the menu on open.
    await expect(account).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(preferences).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(account).toBeFocused();

    await page.keyboard.press('End');
    await expect(signOut).toBeFocused();

    await page.keyboard.press('Home');
    await expect(account).toBeFocused();

    // Wrapping, in both directions.
    await page.keyboard.press('ArrowUp');
    await expect(signOut).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(account).toBeFocused();
  });

  test('ArrowUp on the trigger opens the menu at its last entry', async ({ page }) => {
    await gotoHarness(page);

    await page.getByTestId(PROFILE_TRIGGER).focus();
    await page.keyboard.press('ArrowUp');

    const menu = page.getByRole('menu', { name: /account menu/i });
    await expect(menu.getByRole('menuitem', { name: /sign out/i })).toBeFocused();
  });

  test('entries without a destination are announced as unavailable', async ({ page }) => {
    await gotoHarness(page);

    await page.getByTestId(PROFILE_TRIGGER).click();
    const menu = page.getByRole('menu', { name: /account menu/i });

    for (const name of ['Account', 'Preferences', 'Settings']) {
      await expect(menu.getByRole('menuitem', { name, exact: true })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
    await expect(menu.getByRole('menuitem', { name: /sign out/i })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('does not lock page scrolling', async ({ page }) => {
    await gotoHarness(page);

    await page.getByTestId(PROFILE_TRIGGER).click();
    await expect(page.getByRole('menu', { name: /account menu/i })).toBeVisible();

    // A popover is not a modal surface: the page keeps its scrolling. The
    // Phase 1 lock is reference counted and signals itself on <html>, so its
    // absence here is proof no overlay took it.
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', 'true');

    const scrollability = await page.evaluate((selector) => {
      const content = document.querySelector(selector) as HTMLElement;
      return {
        body: getComputedStyle(document.body).overflow,
        content: getComputedStyle(content).overflowY,
      };
    }, CONTENT);
    expect(scrollability).toEqual({ body: 'visible', content: 'auto' });
  });

  test('signing out clears the session and leaves the console', async ({ page }) => {
    await gotoConsole(page);

    await page.getByTestId(PROFILE_TRIGGER).click();
    await page.getByRole('menuitem', { name: /sign out/i }).click();

    // Two hops — the console replaces to `/`, which redirects to `/login` — and
    // under a contended dev server the second route may still be compiling.
    // The assertion is about where sign-out lands, not how fast it gets there,
    // so it is given room rather than the 5s expect default.
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
    const session = await page.evaluate(() => ({
      token: localStorage.getItem('navfarm_access_token'),
      user: localStorage.getItem('navfarm_auth_user'),
      activeCompany: localStorage.getItem('active_company_id'),
    }));
    expect(session).toEqual({ token: null, user: null, activeCompany: null });
  });

  test('opening the menu introduces no horizontal overflow', async ({ page }) => {
    await gotoHarness(page);

    await page.getByTestId(PROFILE_TRIGGER).click();
    await expect(page.getByRole('menu', { name: /account menu/i })).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});

test.describe('workspace switcher', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const companies = [DEFAULT_COMPANY, SECOND_COMPANY];

  test('uses the shared popover foundation', async ({ page }) => {
    await gotoConsole(page, { companies });

    const trigger = page.getByTestId(SWITCHER_TRIGGER);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const controls = await trigger.getAttribute('aria-controls');
    await expect(page.locator(`[id="${controls}"]`)).toBeVisible();

    // Choosing a company is a selection, so the entries are radios and the
    // active one is checked. The data itself is unchanged.
    const menu = page.getByRole('menu', { name: /switch company/i });
    await expect(menu.getByRole('menuitemradio')).toHaveCount(2);
    await expect(
      menu.getByRole('menuitemradio', { name: new RegExp(DEFAULT_COMPANY.company_name) }),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(
      menu.getByRole('menuitemradio', { name: new RegExp(SECOND_COMPANY.company_name) }),
    ).toHaveAttribute('aria-checked', 'false');
    // The home-company marker the previous implementation showed is preserved.
    await expect(menu.getByText(/home company/i)).toBeVisible();
  });

  test('closes on Escape and restores focus, like every other popover', async ({ page }) => {
    await gotoConsole(page, { companies });

    const trigger = page.getByTestId(SWITCHER_TRIGGER);
    await trigger.click();
    await expect(page.getByRole('menu', { name: /switch company/i })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: /switch company/i })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('keyboard traversal works and no scroll lock is taken', async ({ page }) => {
    await gotoConsole(page, { companies });

    await page.getByTestId(SWITCHER_TRIGGER).focus();
    await page.keyboard.press('ArrowDown');

    const menu = page.getByRole('menu', { name: /switch company/i });
    const first = menu.getByRole('menuitemradio').first();
    const second = menu.getByRole('menuitemradio').nth(1);

    await expect(first).toBeFocused();
    await page.keyboard.press('End');
    await expect(second).toBeFocused();
    await page.keyboard.press('Home');
    await expect(first).toBeFocused();

    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', 'true');
  });

  test('only one popover is open at a time', async ({ page }) => {
    await gotoConsole(page, { companies });

    await page.getByTestId(SWITCHER_TRIGGER).click();
    await expect(page.getByRole('menu', { name: /switch company/i })).toBeVisible();

    await page.getByTestId(PROFILE_TRIGGER).click();
    await expect(page.getByRole('menu', { name: /account menu/i })).toBeVisible();
    await expect(page.getByRole('menu', { name: /switch company/i })).toHaveCount(0);
  });
});

test.describe('overlay foundation coverage', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('notifications remains a navigation destination, not an overlay', async ({ page }) => {
    await gotoConsole(page);

    // Audited in Phase 2: notifications is a route reached from the primary
    // rail, not a header popover, so there is no competing overlay to migrate.
    await expect(
      page.locator(PRIMARY_NAV).getByRole('link', { name: 'Notifications' }),
    ).toHaveCount(1);
    await expect(page.locator(`${HEADER} [aria-haspopup]`)).toHaveCount(1);
  });

  test('every header overlay trigger comes from the shared foundation', async ({ page }) => {
    await gotoConsole(page, { companies: [DEFAULT_COMPANY, SECOND_COMPANY] });

    const triggers = page.locator(`${HEADER} [aria-haspopup]`);
    await expect(triggers).toHaveCount(2);
    for (let i = 0; i < 2; i += 1) {
      await expect(triggers.nth(i)).toHaveAttribute('aria-haspopup', 'menu');
      await expect(triggers.nth(i)).toHaveAttribute('aria-expanded', 'false');
      await expect(triggers.nth(i)).toHaveAttribute('data-state', 'closed');
    }
  });
});

test.describe('overlay taxonomy — dialog', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('a dialog takes focus and the shared scroll lock, unlike a popover', async ({ page }) => {
    await gotoHarness(page);

    const trigger = page.getByTestId('harness-dialog-trigger');
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Harness dialog' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Focus enters the surface, and the one centralized lock is held.
    await expect(dialog).toBeFocused();
    await expect(page.locator('html')).toHaveAttribute('data-scroll-locked', 'true');
  });

  test('Escape closes the dialog, restores focus and releases the lock', async ({ page }) => {
    await gotoHarness(page);

    // Opened from the keyboard on purpose. Dialog restores focus to whatever
    // was active when it opened, and WebKit does not focus a <button> on a
    // mouse press — so a click-opened dialog has nothing to go back to in that
    // engine. The keyboard path is the one this assertion is about.
    const trigger = page.getByTestId('harness-dialog-trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Harness dialog' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Harness dialog' })).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', 'true');
  });

  test('Tab does not escape an open dialog into the shell behind it', async ({ page }) => {
    await gotoHarness(page);

    await page.getByTestId('harness-dialog-trigger').click();
    const dialog = page.getByRole('dialog', { name: 'Harness dialog' });
    await expect(dialog).toBeVisible();

    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      );
      expect(inside, `focus left the dialog after ${i + 1} tabs`).toBe(true);
    }
  });
});

test.describe('profile popover on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('is reachable without opening the navigation drawer', async ({ page }) => {
    await gotoHarness(page);

    // The rail is an off-canvas modal below 1024px; the account menu must not
    // be buried inside it.
    await expect(page.locator(PRIMARY_NAV)).toBeHidden();

    const trigger = page.getByTestId(PROFILE_TRIGGER);
    await expect(trigger).toBeVisible();
    await trigger.click();

    await expect(page.getByRole('menu', { name: /account menu/i })).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: /account menu/i })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});
