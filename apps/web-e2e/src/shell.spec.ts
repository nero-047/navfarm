import { test, expect, type Page } from '@playwright/test';
import {
  CONTENT,
  CONTEXT_NAV,
  HEADER,
  PRIMARY_NAV,
  WORKSPACE,
  documentScroll,
  gotoConsole,
  gotoHarness,
} from './support/shell';

/**
 * Phase 1 exit gate — application shell geometry.
 *
 * These tests assert behaviour, not styling: that the document stops being the
 * desktop scroller, that <main> takes over, that the chrome around it holds
 * still, and that neither very long content nor a very long contextual
 * navigation column can break the viewport-sized shell.
 */

async function scrollElement(page: Page, selector: string, top: number): Promise<number> {
  return page.locator(selector).evaluate((el, value) => {
    el.scrollTop = value;
    return el.scrollTop;
  }, top);
}

test.describe('desktop shell geometry', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('renders every shell region and reports readiness', async ({ page }) => {
    await gotoHarness(page, { contextNav: true });

    await expect(page.locator(PRIMARY_NAV)).toBeVisible();
    await expect(page.locator(HEADER)).toBeVisible();
    await expect(page.locator(WORKSPACE)).toBeVisible();
    await expect(page.locator(CONTEXT_NAV)).toBeVisible();
    await expect(page.locator(CONTENT)).toBeVisible();
    await expect(page.locator('[data-shell-region="page-header"]')).toBeVisible();
  });

  test('the document is not the primary vertical scroller', async ({ page }) => {
    await gotoHarness(page);

    const before = await documentScroll(page);
    expect(before.scrollHeight).toBeLessThanOrEqual(before.clientHeight + 1);

    // Even asked directly, the document has nowhere to go.
    await page.evaluate(() => window.scrollTo(0, 5000));
    const after = await documentScroll(page);
    expect(after.scrollY).toBe(0);
    expect(after.scrollTop).toBe(0);
  });

  test('main scrolls independently of the document', async ({ page }) => {
    await gotoHarness(page);

    const content = page.locator(CONTENT);
    expect(await content.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

    const scrolled = await scrollElement(page, CONTENT, 600);
    expect(scrolled).toBeGreaterThan(300);

    const doc = await documentScroll(page);
    expect(doc.scrollY).toBe(0);
  });

  test('primary navigation and header stay put while content scrolls', async ({ page }) => {
    await gotoHarness(page);

    const nav = page.locator(PRIMARY_NAV);
    const header = page.locator(HEADER);
    const navBefore = await nav.boundingBox();
    const headerBefore = await header.boundingBox();

    await scrollElement(page, CONTENT, 900);

    expect(await nav.boundingBox()).toEqual(navBefore);
    expect(await header.boundingBox()).toEqual(headerBefore);
  });

  test('contextual navigation scrolls independently of main', async ({ page }) => {
    await gotoHarness(page, { contextNav: true });

    const context = page.locator(CONTEXT_NAV);
    expect(await context.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

    const contextScrolled = await scrollElement(page, CONTEXT_NAV, 400);
    expect(contextScrolled).toBeGreaterThan(100);

    // Moving one region moves nothing else.
    expect(await page.locator(CONTENT).evaluate((el) => el.scrollTop)).toBe(0);
    expect((await documentScroll(page)).scrollY).toBe(0);
  });

  test('scrolling does not chain between shell regions', async ({ page }) => {
    await gotoHarness(page, { contextNav: true });

    for (const selector of [CONTENT, CONTEXT_NAV]) {
      const containment = await page
        .locator(selector)
        .evaluate((el) => getComputedStyle(el).overscrollBehaviorY);
      expect(containment).toBe('contain');
    }

    // Drive main to its end, then keep wheeling over it.
    await scrollElement(page, CONTENT, 100000);
    const contentAtEnd = await page.locator(CONTENT).evaluate((el) => el.scrollTop);
    const box = await page.locator(CONTENT).boundingBox();
    if (!box) throw new Error('content region has no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(150);

    expect((await documentScroll(page)).scrollY).toBe(0);
    expect(await page.locator(CONTEXT_NAV).evaluate((el) => el.scrollTop)).toBe(0);
    expect(await page.locator(CONTENT).evaluate((el) => el.scrollTop)).toBe(contentAtEnd);
  });

  test('long content does not break shell geometry', async ({ page }) => {
    await gotoHarness(page);

    const geometry = await page.evaluate(() => {
      const root = document.querySelector('[data-shell-root]') as HTMLElement;
      const main = document.querySelector('main[data-shell-region="content"]') as HTMLElement;
      return {
        rootHeight: root.getBoundingClientRect().height,
        viewport: window.innerHeight,
        mainOverflows: main.scrollHeight > main.clientHeight,
        mainWithinViewport: main.clientHeight <= window.innerHeight,
      };
    });

    expect(Math.abs(geometry.rootHeight - geometry.viewport)).toBeLessThanOrEqual(1);
    expect(geometry.mainOverflows).toBe(true);
    expect(geometry.mainWithinViewport).toBe(true);
  });

  test('long contextual navigation does not break shell geometry', async ({ page }) => {
    await gotoHarness(page, { contextNav: true });

    const geometry = await page.evaluate(() => {
      const root = document.querySelector('[data-shell-root]') as HTMLElement;
      const context = document.querySelector('[data-shell-region="context-nav"]') as HTMLElement;
      return {
        rootHeight: root.getBoundingClientRect().height,
        viewport: window.innerHeight,
        contextOverflows: context.scrollHeight > context.clientHeight,
        contextWithinViewport: context.clientHeight <= window.innerHeight,
      };
    });

    expect(Math.abs(geometry.rootHeight - geometry.viewport)).toBeLessThanOrEqual(1);
    expect(geometry.contextOverflows).toBe(true);
    expect(geometry.contextWithinViewport).toBe(true);
    expect((await documentScroll(page)).scrollY).toBe(0);
  });

  test('navigation renders once and is a plain landmark on desktop', async ({ page }) => {
    await gotoHarness(page);

    await expect(page.locator('nav[aria-label="Primary"]')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Inventory' })).toHaveCount(1);
    await expect(page.locator(PRIMARY_NAV)).not.toHaveAttribute('role', 'dialog');
  });
});

test.describe('responsive overflow', () => {
  test('no horizontal page overflow at any supported width', async ({ page }) => {
    await gotoHarness(page, { contextNav: true });

    for (const width of [1440, 1280, 1024, 834, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(120);
      const doc = await documentScroll(page);
      expect(
        doc.scrollWidth,
        `horizontal overflow at ${width}px (${doc.scrollWidth} > ${doc.clientWidth})`,
      ).toBeLessThanOrEqual(doc.clientWidth + 1);
    }
  });
});

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens, closes on Escape, and restores focus', async ({ page }) => {
    await gotoHarness(page);

    const nav = page.locator(PRIMARY_NAV);
    const opener = page.getByRole('button', { name: 'Open navigation' });

    await expect(nav).toBeHidden();
    await expect(page.getByRole('link', { name: 'Inventory' })).toHaveCount(0);

    await opener.click();
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('role', 'dialog');
    await expect(nav).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-scroll-locked', 'true');
    await expect(page.getByRole('link', { name: 'Inventory' })).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(page.locator('html')).not.toHaveAttribute('data-scroll-locked', 'true');
    await expect(opener).toBeFocused();
  });

  test('closes when the scrim is clicked', async ({ page }) => {
    await gotoHarness(page);

    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.locator(PRIMARY_NAV)).toBeVisible();

    await page.locator('[data-shell-scrim]').click({ position: { x: 360, y: 400 } });
    await expect(page.locator(PRIMARY_NAV)).toBeHidden();
  });

  test('the document scrolls normally below the desktop breakpoint', async ({ page }) => {
    await gotoHarness(page);

    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(120);
    expect((await documentScroll(page)).scrollY).toBeGreaterThan(0);
  });
});

test.describe('real console route', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the console shell pins its chrome and hands scrolling to main', async ({ page }) => {
    await gotoConsole(page);

    await expect(page.locator(PRIMARY_NAV)).toBeVisible();
    await expect(page.locator(HEADER)).toBeVisible();
    await expect(page.locator(CONTENT)).toBeVisible();
    await expect(page.locator('nav[aria-label="Primary"]')).toHaveCount(1);

    const doc = await documentScroll(page);
    expect(doc.scrollHeight).toBeLessThanOrEqual(doc.clientHeight + 1);
    expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth + 1);

    const overflow = await page
      .locator(CONTENT)
      .evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflow).toBe('auto');

    const navBefore = await page.locator(PRIMARY_NAV).boundingBox();
    const headerBefore = await page.locator(HEADER).boundingBox();
    await scrollElement(page, CONTENT, 800);
    expect(await page.locator(PRIMARY_NAV).boundingBox()).toEqual(navBefore);
    expect(await page.locator(HEADER).boundingBox()).toEqual(headerBefore);
    expect((await documentScroll(page)).scrollY).toBe(0);
  });
});
