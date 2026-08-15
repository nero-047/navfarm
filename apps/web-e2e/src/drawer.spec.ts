import { test, expect, type Page } from '@playwright/test';
import {
  CONTENT,
  DRAWER_BODY,
  DRAWER_FOOTER,
  DRAWER_PANEL,
  DRAWER_SCRIM,
  documentScroll,
  gotoConsole,
  gotoHarness,
} from './support/shell';

/**
 * Phase 5 exit gate — drawer / sheet foundation and overlay taxonomy.
 *
 * Mechanics run on the shell fixture, which carries a drawer at both width
 * tiers plus the three nesting cases the taxonomy rules on. The migrated
 * application forms are exercised on their real routes, because the claim
 * there is that behaviour survived the change of surface.
 *
 * Assertions are on semantics and behaviour, never on styling — the one
 * exception is width, which is a stated contract of this phase (480/720) and
 * not a cosmetic choice.
 */

const DRAWER_TRIGGER = 'harness-drawer-trigger';
const DRAWER_LG_TRIGGER = 'harness-drawer-lg-trigger';

async function horizontalOverflow(page: Page): Promise<number> {
  const doc = await documentScroll(page);
  return doc.scrollWidth - doc.clientWidth;
}

async function openDrawer(page: Page, testId = DRAWER_TRIGGER) {
  const trigger = page.getByTestId(testId);
  await trigger.click();
  await expect(page.locator(DRAWER_PANEL)).toBeVisible();
  return trigger;
}

/**
 * Opens the drawer from the keyboard, which is the path any assertion about
 * focus *restoration* has to use: WebKit does not focus a `<button>` on a mouse
 * press, so a click-opened overlay has no trigger to return focus to in that
 * engine. Same reasoning, and same fix, as the Phase 2 dialog tests.
 */
async function openDrawerByKeyboard(page: Page, testId = DRAWER_TRIGGER) {
  const trigger = page.getByTestId(testId);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(DRAWER_PANEL)).toBeVisible();
  return trigger;
}

test.describe('semantics and focus', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('opens from its trigger as a named modal dialog', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page);

    const panel = page.locator(DRAWER_PANEL);
    await expect(panel).toHaveAttribute('role', 'dialog');
    await expect(panel).toHaveAttribute('aria-modal', 'true');
    // Named and described by its own header, not by a hand-written label.
    await expect(page.getByRole('dialog', { name: 'Harness drawer' })).toHaveCount(1);
    await expect(panel).toHaveAttribute('aria-describedby', /.+/);
    const describedBy = await panel.getAttribute('aria-describedby');
    await expect(page.locator(`#${describedBy}`)).toHaveText(
      'Fixture drawer for overlay taxonomy tests.',
    );
  });

  test('focus enters the drawer and stays inside while it is open', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page);

    const inside = () =>
      page.evaluate(
        (sel) => Boolean(document.activeElement?.closest(sel)),
        DRAWER_PANEL,
      );

    expect(await inside()).toBe(true);

    // Round the trap several times: a boundary-only trap leaks on the first
    // Tab in WebKit, where buttons are outside sequential navigation.
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      expect(await inside(), `Tab ${i + 1} left the drawer`).toBe(true);
    }
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Shift+Tab');
      expect(await inside(), `Shift+Tab ${i + 1} left the drawer`).toBe(true);
    }
  });

  test('Escape closes it and returns focus to the trigger', async ({ page }) => {
    await gotoHarness(page);
    const trigger = await openDrawerByKeyboard(page);

    await page.keyboard.press('Escape');

    await expect(page.locator(DRAWER_PANEL)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('the scrim closes it and returns focus to the trigger', async ({ page }) => {
    await gotoHarness(page);
    const trigger = await openDrawerByKeyboard(page);

    await page.locator(DRAWER_SCRIM).click({ position: { x: 10, y: 10 } });

    await expect(page.locator(DRAWER_PANEL)).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('the close control has an accessible name and a visible focus ring', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page);

    const close = page.locator('[data-drawer-close]');
    const name = await close.getAttribute('aria-label');
    expect(name?.trim().length).toBeGreaterThan(0);

    // Reached by keyboard, not by `.focus()`: `:focus-visible` deliberately
    // does not match a button focused from script, so asserting on a
    // programmatic focus would test the wrong thing and fail a correct ring.
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    expect(await close.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
    expect(await close.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');

    await close.click();
    await expect(page.locator(DRAWER_PANEL)).toHaveCount(0);
  });
});

test.describe('scroll ownership', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('locks the page through the shared lock, and releases it once', async ({ page }) => {
    await gotoHarness(page);

    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', 'true');
    await openDrawer(page);
    // The centralized lock from Phase 1, not a private body.style write.
    await expect(page.locator('html')).toHaveAttribute('data-scroll-locked', 'true');

    await page.keyboard.press('Escape');
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', 'true');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  });

  test('the drawer body scrolls, and the page behind it does not', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page);

    const contentBefore = await page.locator(CONTENT).evaluate((el) => el.scrollTop);

    const moved = await page.locator(DRAWER_BODY).evaluate((el) => {
      el.scrollTop = 400;
      return el.scrollTop;
    });
    expect(moved).toBeGreaterThan(0);

    // Neither the shell's main scroller nor the document followed it.
    expect(await page.locator(CONTENT).evaluate((el) => el.scrollTop)).toBe(contentBefore);
    expect((await documentScroll(page)).scrollY).toBe(0);
  });

  test('the body is the only scroller in the drawer', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page);

    const scrollers = await page.locator(DRAWER_PANEL).evaluate((panel) =>
      Array.from(panel.querySelectorAll('*'))
        .filter((el) => {
          const style = getComputedStyle(el);
          const scrolls = ['auto', 'scroll'].includes(style.overflowY);
          return scrolls && el.scrollHeight > el.clientHeight + 1;
        })
        .map((el) => (el as HTMLElement).dataset.drawerBody !== undefined ? 'body' : el.tagName),
    );

    expect(scrollers).toEqual(['body']);
  });

  test('the footer stays visible while the body scrolls', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page);

    const footer = page.locator(DRAWER_FOOTER);
    await expect(footer).toBeVisible();
    const before = await footer.boundingBox();

    await page.locator(DRAWER_BODY).evaluate((el) => {
      el.scrollTop = 600;
    });

    await expect(footer).toBeInViewport();
    const after = await footer.boundingBox();
    // Pinned, not merely still on screen.
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(2);
    await expect(page.getByTestId('harness-drawer-footer-action')).toBeVisible();
  });
});

test.describe('nesting rules', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('a drawer refuses to open inside a drawer', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await gotoHarness(page);
    await openDrawer(page);
    await expect(page.locator(DRAWER_PANEL)).toHaveCount(1);

    await page.getByTestId('harness-nested-drawer-trigger').click();

    // Still exactly one drawer, and it is still the first one.
    await expect(page.locator(DRAWER_PANEL)).toHaveCount(1);
    await expect(page.getByRole('dialog', { name: 'Harness drawer' })).toHaveCount(1);
    await expect(page.getByRole('dialog', { name: 'Nested drawer' })).toHaveCount(0);
    await expect(page.getByTestId('harness-nested-drawer-body')).toHaveCount(0);
    // Refused loudly, so the call site is a fixable bug rather than a mystery.
    expect(errors.join('\n')).toMatch(/cannot open inside another Drawer/i);
  });

  test('a drawer may contain a dialog', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page);

    await page.getByTestId('harness-drawer-dialog-trigger').click();

    const dialog = page.getByRole('dialog', { name: 'Nested dialog' });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('harness-drawer-dialog-action')).toBeVisible();

    // The inner overlay takes Escape; the drawer behind it survives.
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(DRAWER_PANEL)).toHaveCount(1);
    // The reference-counted lock is still held by the drawer.
    await expect(page.locator('html')).toHaveAttribute('data-scroll-locked', 'true');

    await page.keyboard.press('Escape');
    await expect(page.locator(DRAWER_PANEL)).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', 'true');
  });

  test('a drawer may contain a popover', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page);

    const trigger = page.getByTestId('harness-drawer-popover-trigger');
    await trigger.click();

    const menu = page.getByRole('menu', { name: 'Drawer choices' });
    await expect(menu).toBeVisible();

    // Escape dismisses the popover only — Popover stops it reaching the drawer.
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(page.locator(DRAWER_PANEL)).toHaveCount(1);
    await expect(trigger).toBeFocused();
  });
});

test.describe('desktop presentation', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the standard tier is a 480px right-hand panel', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page);

    const panel = await page.locator(DRAWER_PANEL).boundingBox();
    expect(Math.round(panel!.width)).toBe(480);
    // Anchored to the trailing edge, full height — not a centred card.
    expect(Math.round(panel!.x + panel!.width)).toBe(1440);
    expect(Math.round(panel!.height)).toBe(900);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });

  test('the large tier is 720px', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page, DRAWER_LG_TRIGGER);

    const panel = await page.locator(DRAWER_PANEL).boundingBox();
    expect(Math.round(panel!.width)).toBe(720);
    expect(Math.round(panel!.x + panel!.width)).toBe(1440);
  });

  test('the page stays visible beside it', async ({ page }) => {
    await gotoHarness(page);
    await openDrawer(page, DRAWER_LG_TRIGGER);

    // A drawer opens beside the page; it does not take the whole viewport.
    const panel = await page.locator(DRAWER_PANEL).boundingBox();
    expect(panel!.x).toBeGreaterThan(0);
  });
});

test.describe('mobile and tablet presentation', () => {
  for (const viewport of [
    { name: 'tablet', width: 834, height: 1112 },
    { name: 'mobile', width: 390, height: 844 },
  ] as const) {
    test(`${viewport.name} — becomes a bottom sheet within the viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoHarness(page);
      await openDrawer(page);

      const panel = await page.locator(DRAWER_PANEL).boundingBox();

      // Full width, anchored to the bottom edge.
      expect(Math.round(panel!.width)).toBe(viewport.width);
      expect(Math.round(panel!.y + panel!.height)).toBe(viewport.height);
      // Capped at ~92dvh, so the page it came from stays visible above it.
      expect(panel!.height).toBeLessThanOrEqual(viewport.height * 0.92 + 1);
      expect(panel!.y).toBeGreaterThan(0);

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });

    test(`${viewport.name} — the sheet body scrolls and the footer stays put`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoHarness(page);
      await openDrawer(page);

      const footer = page.locator(DRAWER_FOOTER);
      const before = await footer.boundingBox();

      const moved = await page.locator(DRAWER_BODY).evaluate((el) => {
        el.scrollTop = 400;
        return el.scrollTop;
      });
      expect(moved).toBeGreaterThan(0);

      const after = await footer.boundingBox();
      expect(Math.abs(after!.y - before!.y)).toBeLessThan(2);
      await expect(footer).toBeInViewport();
      // Content is not clipped out of reach: the last row is reachable.
      await expect(page.getByTestId('harness-drawer-last')).toBeAttached();
    });

    test(`${viewport.name} — semantics are unchanged from desktop`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoHarness(page);
      await openDrawer(page);

      // One implementation, one role — the sheet is not a second component.
      await expect(page.getByRole('dialog', { name: 'Harness drawer' })).toHaveCount(1);
      await expect(page.locator(DRAWER_PANEL)).toHaveAttribute('aria-modal', 'true');
    });
  }
});

test.describe('migrated application forms', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('master data create opens in a drawer with its fields and actions intact', async ({
    page,
  }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    const add = page.locator(CONTENT).getByRole('button', { name: /^add /i });
    await add.click();

    const drawer = page.locator(DRAWER_PANEL);
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    // The dense tier, because these configs run well past two fields.
    expect(Math.round((await drawer.boundingBox())!.width)).toBe(720);

    // The form still renders its fields, and the actions are in the pinned
    // footer rather than lost at the bottom of a long body.
    await expect(drawer.locator('input, select, textarea').first()).toBeVisible();
    const footer = page.locator(DRAWER_FOOTER);
    await expect(footer.getByRole('button', { name: /create/i })).toBeVisible();
    await expect(footer.getByRole('button', { name: /cancel/i })).toBeVisible();

    // Cancel still closes without submitting anything.
    await footer.getByRole('button', { name: /cancel/i }).click();
    await expect(page.locator(DRAWER_PANEL)).toHaveCount(0);
  });

  test('master data delete confirmation stays a dialog', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    // The taxonomy is a classification, not a migration: a one-line
    // destructive confirmation must not have become a drawer.
    const add = page.locator(CONTENT).getByRole('button', { name: /^add /i });
    await add.click();
    await expect(page.locator(DRAWER_PANEL)).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator(DRAWER_PANEL)).toHaveCount(0);
  });

  test('the team invite form opens in a drawer and still submits from its form', async ({
    page,
  }) => {
    await gotoConsole(page, { path: '/console/users' });

    await page.getByRole('button', { name: /invite user/i }).click();

    const drawer = page.locator(DRAWER_PANEL);
    await expect(drawer).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Invite a team member' })).toHaveCount(1);

    // The submit control stayed inside the <form> it submits.
    const submit = drawer.getByRole('button', { name: /register user/i });
    await expect(submit).toHaveAttribute('type', 'submit');
    expect(await submit.evaluate((el) => Boolean(el.closest('form')))).toBe(true);

    // Required fields still gate submission — validation is unchanged.
    await submit.click();
    await expect(drawer).toBeVisible();
  });

  test('the add-company form opens in a drawer with its fields intact', async ({ page }) => {
    // A tenant admin, because the companies *directory* — and so the Add
    // Company action — is a tenant-wide view that a company admin never sees.
    // The default session would land on the single-company view and skip the
    // assertion entirely, which would prove nothing about the migration.
    await gotoConsole(page, { path: '/console/companies', userType: 'TENANT_ADMIN' });

    await page.getByRole('button', { name: /add company/i }).click();
    await expect(page.getByRole('dialog', { name: 'Add a company' })).toBeVisible();

    const drawer = page.locator(DRAWER_PANEL);
    // Eight fields still render, and the submit control stayed inside its form.
    expect(await drawer.locator('input, select').count()).toBeGreaterThanOrEqual(8);
    const submit = drawer.getByRole('button', { name: /create company/i });
    await expect(submit).toHaveAttribute('type', 'submit');
    expect(await submit.evaluate((el) => Boolean(el.closest('form')))).toBe(true);

    await expect(page.getByRole('button', { name: /^cancel$/i })).toBeVisible();
  });
});

test.describe('non-migrated overlays still work', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the harness dialog is unchanged by the shared focus hook', async ({ page }) => {
    await gotoHarness(page);

    // Keyboard-opened for the same WebKit reason as the drawer above.
    const trigger = page.getByTestId('harness-dialog-trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Harness dialog' });
    await expect(dialog).toBeVisible();
    // It is a dialog, not a drawer — the taxonomy did not swallow it.
    await expect(page.locator(DRAWER_PANEL)).toHaveCount(0);

    const inside = () =>
      page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
    expect(await inside()).toBe(true);
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      expect(await inside()).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', 'true');
  });
});
