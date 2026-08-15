import { test, expect, type Page } from '@playwright/test';
import {
  CONTENT,
  CONTEXT_NAV,
  CONTEXT_NAV_ITEM,
  CONTEXT_NAV_LIST,
  CONTEXT_NAV_TRIGGER,
  FULL_WIDTH_ROUTES,
  MODULE_ROUTES,
  PRIMARY_NAV,
  WORKSPACE,
  documentScroll,
  gotoConsole,
} from './support/shell';

/**
 * Phase 3 exit gate — primary + contextual navigation.
 *
 * The subject is the hierarchy: a stable global rail, a quieter module index
 * that holds still beside the content, and a content region that owns the
 * scrolling and the emphasis. Assertions are on structure, semantics and
 * scroll behaviour — never on colours or spacing, which the visual QA covers.
 *
 * Everything runs against real console routes rather than the shell fixture:
 * which routes get an index, and what is in it, is a property of the
 * application, not of the shell primitive.
 */

async function horizontalOverflow(page: Page): Promise<number> {
  const doc = await documentScroll(page);
  return doc.scrollWidth - doc.clientWidth;
}

async function scrollElement(page: Page, selector: string, top: number): Promise<number> {
  return page.locator(selector).evaluate((el, value) => {
    el.scrollTop = value;
    return el.scrollTop;
  }, top);
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** `boundingBox()` that fails the test on a missing box instead of returning null. */
async function box(page: Page, selector: string): Promise<Box> {
  const rect = await page.locator(selector).boundingBox();
  expect(rect, `${selector} is not laid out`).not.toBeNull();
  return rect as Box;
}

test.describe('which routes receive contextual navigation', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const path of MODULE_ROUTES) {
    test(`${path} renders a module index`, async ({ page }) => {
      await gotoConsole(page, { path });

      await expect(page.locator(CONTEXT_NAV)).toBeVisible();
      await expect(page.locator(WORKSPACE)).toHaveAttribute('data-has-context-nav', 'true');
      // A real index, not an empty region.
      await expect(page.locator(CONTEXT_NAV_ITEM).first()).toBeVisible();
    });
  }

  for (const path of FULL_WIDTH_ROUTES) {
    test(`${path} stays full-width`, async ({ page }) => {
      await gotoConsole(page, { path });

      await expect(page.locator(CONTEXT_NAV)).toHaveCount(0);
      await expect(page.locator(WORKSPACE)).toHaveAttribute('data-has-context-nav', 'false');
    });
  }

  test('a module index does not outlive the module it belongs to', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });
    await expect(page.locator(CONTEXT_NAV)).toBeVisible();

    // Leaving for a full-width route must unregister it, not leave the previous
    // module's sections stranded over the next page.
    //
    // Given room deliberately: this is the one assertion in the file that
    // crosses a route boundary, so it waits on the dev server compiling
    // /console/dashboard on demand — up to ~20s under four-worker contention.
    // The claim is that the index does not survive the navigation, not that the
    // navigation is quick, so the 5s expect default is the wrong budget here.
    await page.locator(PRIMARY_NAV).getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/console\/dashboard/, { timeout: 30_000 });
    await expect(page.locator(CONTEXT_NAV)).toHaveCount(0, { timeout: 30_000 });
  });
});

test.describe('desktop hierarchy and scroll architecture', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('primary nav, context nav and content sit in that order', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    const nav = await box(page, PRIMARY_NAV);
    const context = await box(page, CONTEXT_NAV);
    const content = await box(page, CONTENT);

    expect(nav.x + nav.width).toBeLessThanOrEqual(context.x + 1);
    expect(context.x + context.width).toBeLessThanOrEqual(content.x + 1);
    // The work surface is the widest of the three by a clear margin.
    expect(content.width).toBeGreaterThan(nav.width + context.width);
  });

  test('the document still is not the scroller', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    const doc = await documentScroll(page);
    expect(doc.scrollHeight).toBeLessThanOrEqual(doc.clientHeight + 1);
  });

  test('a long index scrolls on its own without moving the chrome', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    const region = page.locator(CONTEXT_NAV);
    const overflows = await region.evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(overflows, 'Master Data is the long index this assertion needs').toBe(true);

    const navBefore = await box(page, PRIMARY_NAV);
    const scrolled = await scrollElement(page, CONTEXT_NAV, 400);
    expect(scrolled).toBeGreaterThan(0);

    // The rail did not move, and the content did not scroll with the index.
    const navAfter = await box(page, PRIMARY_NAV);
    expect(navAfter.y).toBe(navBefore.y);
    expect(await page.locator(CONTENT).evaluate((el) => el.scrollTop)).toBe(0);
  });

  test('main scrolls independently of the index', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    const before = await page.locator(CONTEXT_NAV).evaluate((el) => el.scrollTop);
    await scrollElement(page, CONTENT, 300);

    expect(await page.locator(CONTEXT_NAV).evaluate((el) => el.scrollTop)).toBe(before);
    expect((await documentScroll(page)).scrollY).toBe(0);
  });

  test('no scroll chaining between the three regions', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    // Every scrollable shell region contains its own overscroll, so reaching
    // the end of one never hands the gesture to the region behind it.
    const containment = await page.evaluate(
      ([navSel, contextSel, contentSel]) => {
        const at = (sel: string) => {
          const el = document.querySelector(sel) as HTMLElement;
          return getComputedStyle(el).overscrollBehaviorY;
        };
        return {
          nav: at(`${navSel} [data-shell-nav-scroll]`),
          context: at(contextSel),
          content: at(contentSel),
        };
      },
      [PRIMARY_NAV, CONTEXT_NAV, CONTENT],
    );

    expect(containment).toEqual({ nav: 'contain', context: 'contain', content: 'contain' });
  });
});

test.describe('active state', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the primary rail marks the module the user is in', async ({ page }) => {
    await gotoConsole(page, { path: '/console/inventory' });

    // Exactly one rail entry reads as the current location, and it is the one
    // the URL is on.
    const current = page.locator(`${PRIMARY_NAV} a[aria-current="page"]`);
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText('Inventory');
  });

  test('primary and contextual current-state are independent levels', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    // Moving within the module must not disturb where the rail says you are.
    await page.getByTestId('context-nav-item-supplier').click();

    await expect(page.locator(`${PRIMARY_NAV} a[aria-current="page"]`)).toHaveText('Master Data');
    await expect(page.locator(`${CONTEXT_NAV_ITEM}[aria-current="page"]`)).toHaveText('Suppliers');
  });

  test('exactly one index entry is the current page, and selecting moves it', async ({ page }) => {
    await gotoConsole(page, { path: '/console/inventory' });

    const current = page.locator(`${CONTEXT_NAV_ITEM}[aria-current="page"]`);
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText('Stock Balance');

    await page.getByTestId('context-nav-item-goods-receipt').click();

    await expect(page.locator(`${CONTEXT_NAV_ITEM}[aria-current="page"]`)).toHaveCount(1);
    await expect(page.locator(`${CONTEXT_NAV_ITEM}[aria-current="page"]`)).toHaveText('Goods Receipt');
    // Selection is state, not routing — Phase 3 changes no URLs.
    await expect(page).toHaveURL(/\/console\/inventory$/);
  });

  test('selecting an entry swaps the work surface', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    await expect(page.locator(CONTENT).getByRole('heading', { name: 'Farms' })).toBeVisible();
    await page.getByTestId('context-nav-item-supplier').click();
    await expect(page.locator(CONTENT).getByRole('heading', { name: 'Suppliers' })).toBeVisible();
  });
});

test.describe('accessibility', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the index is a named navigation landmark, and only one of them', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    // Exactly one, despite both presentations being in the DOM: the one that
    // does not apply at this width is `display: none` and so is not in the
    // accessibility tree at all.
    await expect(page.getByRole('navigation', { name: /master data sections/i })).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(1);
  });

  test('the index exposes no landmark at all on mobile, where it is a selector', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoConsole(page, { path: '/console/master-data' });

    await expect(page.locator(CONTEXT_NAV_TRIGGER)).toBeVisible();
    // The collapsed presentation is a button and a menu, not a second
    // navigation landmark competing with the rail.
    await expect(page.getByRole('navigation', { name: /master data sections/i })).toHaveCount(0);
  });

  test('index entries are keyboard focusable and operable', async ({ page }) => {
    await gotoConsole(page, { path: '/console/inventory' });

    // Focused directly rather than tabbed to: WebKit keeps buttons out of
    // sequential navigation by platform preference, which is not a property of
    // this component. What must hold everywhere is that the entry takes focus
    // and responds to both activation keys.
    const ledger = page.getByTestId('context-nav-item-ledger');
    await ledger.focus();
    await expect(ledger).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator(`${CONTEXT_NAV_ITEM}[aria-current="page"]`)).toHaveText('Inventory Ledger');

    const transfer = page.getByTestId('context-nav-item-stock-transfer');
    await transfer.focus();
    await page.keyboard.press(' ');
    await expect(page.locator(`${CONTEXT_NAV_ITEM}[aria-current="page"]`)).toHaveText('Stock Transfer');
  });

  test('the primary navigation renders exactly once', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    await expect(page.locator(PRIMARY_NAV)).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(1);
    // One node per destination — no duplicated desktop/mobile copies.
    await expect(page.locator(PRIMARY_NAV).getByRole('link', { name: 'Master Data' })).toHaveCount(1);
  });
});

test.describe('mobile and tablet presentation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('a flat index becomes a tab strip, not a second sidebar', async ({ page }) => {
    await gotoConsole(page, { path: '/console/inventory' });

    const list = page.locator(CONTEXT_NAV_LIST);
    await expect(list).toBeVisible();
    await expect(list).toHaveAttribute('data-grouped', 'false');
    // A flat set needs no selector at all — the same list simply lays out
    // horizontally, so there is one index in the DOM at every width.
    await expect(page.locator(CONTEXT_NAV_TRIGGER)).toHaveCount(0);

    // Laid out as a strip: entries sit side by side, not stacked.
    const [first, second] = await page.locator(CONTEXT_NAV_ITEM).evaluateAll((els) =>
      els.slice(0, 2).map((el) => el.getBoundingClientRect()),
    );
    expect(second.x).toBeGreaterThan(first.x);
    expect(Math.abs(second.y - first.y)).toBeLessThan(2);
  });

  test('a grouped index collapses to a selector', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    // The twenty-entry column is not repeated above the content.
    await expect(page.locator(CONTEXT_NAV_LIST)).toBeHidden();

    const trigger = page.locator(CONTEXT_NAV_TRIGGER);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    // Names the index, not the selection. The selected section is the page's
    // H1 immediately below, and repeating it here made level 2 read as a
    // second, quieter title — see the mobile hierarchy tests in
    // page-header.spec.ts.
    await expect(trigger).toHaveText(/master data sections/i);

    await trigger.click();
    const menu = page.getByRole('menu', { name: /master data sections/i });
    await expect(menu).toBeVisible();
    // Choosing a section is a selection, and the groups survive the collapse.
    await expect(menu.getByRole('menuitemradio', { name: 'Farms' })).toHaveAttribute('aria-checked', 'true');
    await expect(menu.getByRole('group', { name: 'Livestock & Health' })).toHaveCount(1);

    await menu.getByRole('menuitemradio', { name: 'Suppliers' }).click();
    // Selection still works and still moves the work surface; the trigger keeps
    // naming the index while the H1 reports what was selected.
    await expect(trigger).toHaveText(/master data sections/i);
    await expect(page.locator(CONTENT).getByRole('heading', { name: 'Suppliers' })).toBeVisible();
  });

  test('the index pins under the header instead of scrolling away', async ({ page }) => {
    await gotoConsole(page, { path: '/console/inventory' });

    const before = await box(page, CONTEXT_NAV);
    await page.evaluate(() => window.scrollTo(0, 400));
    const after = await box(page, CONTEXT_NAV);

    // Sticky: it holds its viewport position while the document moves beneath.
    expect(after.y).toBe(before.y);
  });

  test('touch targets in the index clear 44px', async ({ page }) => {
    await gotoConsole(page, { path: '/console/inventory' });

    const heights = await page.locator(CONTEXT_NAV_ITEM).evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().height),
    );
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
  });

  test('the primary navigation drawer is still the only primary nav', async ({ page }) => {
    await gotoConsole(page, { path: '/console/master-data' });

    // Phase 1's mobile architecture is untouched: the rail is off-canvas and
    // the module index did not become a second permanent sidebar.
    await expect(page.locator(PRIMARY_NAV)).toHaveCount(1);
    await expect(page.locator(PRIMARY_NAV)).toBeHidden();
  });
});

test.describe('no horizontal overflow', () => {
  const VIEWPORTS = [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 834, height: 1112 },
    { width: 390, height: 844 },
  ];

  for (const viewport of VIEWPORTS) {
    for (const path of ['/console/master-data', '/console/inventory']) {
      test(`${path} at ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await gotoConsole(page, { path });
        await expect(page.locator(CONTEXT_NAV)).toBeVisible();

        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
      });
    }
  }
});
