import { expect, test } from '@playwright/test';
import {
  CONTENT,
  CONTEXT_NAV,
  CONTEXT_NAV_ITEM,
  CONTEXT_NAV_LIST,
  PRIMARY_NAV,
  gotoConsole,
} from './support/shell';

test.describe('master workbook tabs', () => {
  for (const width of [1440, 390]) {
    test(`sheet navigation and reduced sidebar at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoConsole(page, { path: '/master-data/item' });
      const content = page.locator(CONTENT);
      await expect(content.getByRole('tab', { name: 'Items', exact: true })).toHaveAttribute('aria-selected', 'true');
      await content.getByRole('tab', { name: 'Item Attributes', exact: true }).click();
      await expect(page).toHaveURL(/\/master-data\/item-attribute$/);
      await expect(content.getByRole('heading', { name: 'Item Attributes', exact: true })).toBeVisible();
      await content.getByRole('button', { name: /^add /i }).click();
      await expect(page.getByRole('dialog')).toContainText('Attribute Code');
      await page.keyboard.press('Escape');
      await page.reload();
      await expect(content.getByRole('tab', { name: 'Item Attributes', exact: true })).toHaveAttribute('aria-selected', 'true');

      for (const [key, child, heading] of [
        ['breed', 'Lifecycle Stages', 'Breed Lifecycle Stages'],
        ['uom', 'UOM Conversions', 'UOM Conversions'],
      ]) {
        await page.goto(`/master-data/${key}`);
        await expect(content.getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
        await content.getByRole('tab', { name: child, exact: true }).click();
        await expect(content.getByRole('heading', { name: heading, exact: true })).toBeVisible();
        await content.getByRole('button', { name: /^add /i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('dialog').locator('footer')).toBeInViewport();
        await page.keyboard.press('Escape');
      }
      await page.goto('/master-data/location');
      await expect(content.getByRole('heading', { name: 'Locations', exact: true })).toBeVisible();
      await expect(content.getByRole('tablist')).toHaveCount(0);
      if (width === 1440) {
        await expect(page.locator(`${CONTEXT_NAV_ITEM}:visible`)).toHaveCount(12);
        await expect(page.locator(CONTEXT_NAV_ITEM).filter({ hasText: /^Customers$/ })).toHaveCount(0);
      }
      await page.goto('/master-data/customer');
      await expect(content.getByRole('heading', { name: 'Customers', exact: true })).toBeVisible();
    });
  }

  test('inline feed formula submits all required fields with correct value types', async ({ page }) => {
    let submitted: Record<string, unknown> | undefined;
    await gotoConsole(page, {
      path: '/master-data/item',
      routes: [
        ['**/api/v1/item?*', (route) => route.fulfill({ json: [{ item_id: 'item-feed', item_code: 'FEED', item_name: 'Feed' }] })],
        ['**/api/v1/uom?*', (route) => route.fulfill({ json: [{ uom_id: 'uom-kg', uom_code: 'KG', uom_name: 'Kilogram' }] })],
        ['**/api/v1/feed-formula', (route) => {
          submitted = route.request().postDataJSON();
          return route.fulfill({ status: 201, json: { formula_id: 'formula-test' } });
        }],
      ],
    });
    await page.locator(CONTENT).getByRole('button', { name: /^add /i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Feed Formulas/ }).click();
    await dialog.getByLabel('Formula Code', { exact: true }).fill('FORM-TEST');
    await dialog.getByLabel('Formula Name', { exact: true }).fill('Test feed');
    await dialog.getByLabel('Produced Item', { exact: true }).selectOption('item-feed');
    await dialog.getByLabel('Batch Size', { exact: true }).fill('100');
    await dialog.getByLabel('Batch Unit', { exact: true }).selectOption('KG');
    await dialog.getByLabel(/Ingredients \(JSON array\)/).fill('[{"item_id":"item-feed","quantity":100,"unit":"KG"}]');
    await dialog.getByRole('button', { name: 'Add Feed Formulas', exact: true }).click();
    await expect.poll(() => submitted).toEqual(expect.objectContaining({
      company_id: 'company-e2e', target_item_id: 'item-feed', batch_size: 100, batch_unit: 'KG',
      ingredients: [{ item_id: 'item-feed', quantity: 100, unit: 'KG' }],
    }));
    await expect(dialog).toBeVisible();
  });
});

/**
 * The mobile drawer must carry the master sections.
 *
 * Regression guard. The drawer copy of the context nav was added and looked
 * correct in the DOM, but a pre-existing rule —
 * `@media (max-width: 1023.98px) { [data-context-nav][data-grouped='true'] { display: none } }`
 * — collapses a grouped index into its selector pill on mobile, and matched the
 * drawer's copy too. The sections were present and invisible, so the reported
 * bug survived a change that was supposed to fix it. Nothing caught it because
 * no test opened the drawer.
 */
test.describe('master sections in the mobile drawer', () => {
  test('the hamburger reveals the sections, and choosing one navigates and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoConsole(page, { path: '/master-data/item' });

    const drawerNav = page.locator(`${PRIMARY_NAV} ${CONTEXT_NAV_LIST}`);
    await expect(drawerNav).toBeHidden();

    await page.getByRole('button', { name: 'Open navigation' }).click();

    // toBeVisible is the whole point: the failure mode was present-but-hidden.
    await expect(drawerNav).toBeVisible();
    await expect(drawerNav.locator(CONTEXT_NAV_ITEM)).toHaveCount(12);

    await drawerNav.getByRole('button', { name: 'Breeds', exact: true }).click();
    await expect(page).toHaveURL(/\/master-data\/breed$/);
    await expect(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('desktop shows one context nav, not two', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoConsole(page, { path: '/master-data/item' });

    await expect(page.locator(`${CONTEXT_NAV} ${CONTEXT_NAV_LIST}`)).toBeVisible();
    await expect(page.locator(`${PRIMARY_NAV} ${CONTEXT_NAV_LIST}`)).toBeHidden();
  });
});
