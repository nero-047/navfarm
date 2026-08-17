import { test, expect } from '@playwright/test';
import { CONTENT, gotoConsole } from './support/shell';

/**
 * Phase 6B follow-up gate — the canonical Table primitives, exercised against
 * a real migrated screen rather than in isolation.
 *
 * MasterDataTable is the highest-blast-radius consumer (it powers every
 * Master Data list) and its default config on `/console/master-data` is
 * "farm" (apiBase `/farm`). Empty/error came from source inspection during
 * the Phase 6 red-team review; this locks the rendered behaviour down.
 */

const FARM_ROWS = [
  { farm_id: 'farm-1', farm_code: 'FARM01', farm_name: 'Green Valley Breeding Farm', farm_type: 'BREEDER', city: 'Pune', capacity: 5000, is_active: true },
  { farm_id: 'farm-2', farm_code: 'FARM02', farm_name: 'Highland Rearing Unit', farm_type: 'REARING', city: 'Nashik', capacity: 3200, is_active: false },
];

test.describe('MasterDataTable — canonical Table primitives on a real screen', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('populated: rows, columns and status render from the API response', async ({ page }) => {
    await gotoConsole(page, {
      path: '/console/master-data',
      routes: [['**/api/v1/farm**', (route) => route.fulfill({ status: 200, json: FARM_ROWS })]],
    });

    const table = page.locator(`${CONTENT} table`).first();
    await expect(table.getByRole('row', { name: /FARM01/ })).toBeVisible();
    await expect(table.getByRole('row', { name: /FARM02/ })).toBeVisible();
    await expect(table.getByText('Active', { exact: true })).toBeVisible();
    await expect(table.getByText('Inactive', { exact: true })).toBeVisible();
  });

  test('empty: an empty API response renders the empty state, not a blank table', async ({ page }) => {
    await gotoConsole(page, {
      path: '/console/master-data',
      routes: [['**/api/v1/farm**', (route) => route.fulfill({ status: 200, json: [] })]],
    });

    const table = page.locator(`${CONTENT} table`).first();
    await expect(table.getByRole('row')).toHaveCount(2); // header row + the empty-state row
    await expect(table.getByText(/no .*yet/i)).toBeVisible();
  });

  test('error: a failed request surfaces a distinct error message, not a silent empty state', async ({ page }) => {
    await gotoConsole(page, {
      path: '/console/master-data',
      routes: [['**/api/v1/farm**', (route) => route.fulfill({ status: 500, json: { message: 'Internal error' } })]],
    });

    // The failure must be visible as its own message, distinguishable from "no records yet".
    await expect(page.locator(CONTENT).getByText('Internal error')).toBeVisible();
  });

  test('pagination appears once rows exceed a single page', async ({ page }) => {
    const manyRows = Array.from({ length: 30 }, (_, i) => ({
      farm_id: `farm-${i}`,
      farm_code: `FARM${String(i).padStart(2, '0')}`,
      farm_name: `Farm ${i}`,
      farm_type: 'BREEDER',
      city: 'Pune',
      capacity: 1000,
      is_active: true,
    }));
    await gotoConsole(page, {
      path: '/console/master-data',
      routes: [['**/api/v1/farm**', (route) => route.fulfill({ status: 200, json: manyRows })]],
    });

    await expect(page.locator(`${CONTENT} table`).first().getByText('FARM00')).toBeVisible();
    await expect(page.getByLabel('Next page')).toBeVisible();
  });
});
