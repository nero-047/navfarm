import { expect, test } from '@playwright/test';
import { CONTENT, gotoConsole } from './support/shell';

test('silo settings appear only for the SILO storage selection', async ({ page }) => {
  await gotoConsole(page, { path: '/master-data/location' });
  await page.locator(CONTENT).getByRole('button', { name: /^add /i }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Location', exact: true });
  await expect(dialog.getByLabel('Silo Capacity (KG)', { exact: true })).toHaveCount(0);
  await dialog.getByLabel('Storage Location', { exact: true }).selectOption('SILO');
  await expect(dialog.getByLabel('Silo Capacity (KG)', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Silo Reorder Days', { exact: true })).toHaveAttribute('aria-required', 'true');
  await dialog.getByLabel('Silo Capacity (KG)', { exact: true }).fill('2500');
  await dialog.getByLabel('Storage Location', { exact: true }).selectOption('STORE');
  await expect(dialog.getByLabel('Silo Capacity (KG)', { exact: true })).toHaveCount(0);
});

test('lookup management stays above the unsaved item dialog without opening a tab', async ({ page }) => {
  await gotoConsole(page, { path: '/master-data/item' });
  await page.locator(CONTENT).getByRole('button', { name: /^add /i }).click();
  const parent = page.getByRole('dialog', { name: 'Add Item', exact: true });
  await parent.getByLabel('Item Name', { exact: true }).fill('Unsaved piggery feed');
  await parent.getByRole('button', { name: /^Item Types/ }).click();
  const tabCount = page.context().pages().length;
  await parent.getByRole('button', { name: 'Manage Item Types', exact: true }).click();
  const manager = page.getByRole('dialog', { name: 'Manage Item Types', exact: true });
  await expect(manager).toBeVisible();
  await manager.getByRole('button', { name: 'Add Item Type', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Add Item Type', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(manager).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(manager).toHaveCount(0);
  await expect(parent.getByLabel('Item Name', { exact: true })).toHaveValue('Unsaved piggery feed');
  expect(page.context().pages()).toHaveLength(tabCount);
});

test('manual entry can be chosen when the configured series allows it', async ({ page }) => {
  await gotoConsole(page, { path: '/master-data/uom', routes: [
    ['**/api/v1/number-series/resolve?*', (route) => route.fulfill({ json: { generated: true, allowManual: true } })],
  ] });
  await page.locator(CONTENT).getByRole('button', { name: /^add /i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('UOM Code', { exact: true })).toBeDisabled();
  await dialog.getByLabel('Code Entry', { exact: true }).selectOption('manual');
  await expect(dialog.getByLabel('UOM Code', { exact: true })).toBeEnabled();
  await expect(dialog.getByLabel('UOM Code', { exact: true })).toHaveAttribute('aria-required', 'true');
  await dialog.getByLabel('Code Entry', { exact: true }).selectOption('serial');
  await expect(dialog.getByLabel('UOM Code', { exact: true })).toBeDisabled();
});

test('Breed location remains optional and its code is manual without a location', async ({ page }) => {
  await gotoConsole(page, { path: '/master-data/breed' });
  await page.locator(CONTENT).getByRole('button', { name: /^add /i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Location', { exact: true })).toHaveAttribute('aria-required', 'false');
  await expect(dialog.getByLabel('Breed Code', { exact: true })).toBeEnabled();
});

test('tenant workspace omits stale company headers and query scope', async ({ page }) => {
  let request: { company?: string; scope?: string; url: string } | undefined;
  await gotoConsole(page, { userType: 'TENANT_ADMIN', path: '/master-data/breed', routes: [
    ['**/api/v1/breed?*', async (route) => {
      const headers = route.request().headers();
      request = { company: headers['x-active-company-id'], scope: headers['x-workspace-scope'], url: route.request().url() };
      await route.fulfill({ json: [] });
    }],
  ] });
  await page.evaluate(() => localStorage.setItem('active_workspace_scope', 'TENANT'));
  await page.reload();
  await expect.poll(() => request?.scope).toBe('TENANT');
  expect(request?.company).toBeUndefined();
  expect(request?.url).not.toContain('companyId=');
  await expect(page.getByText('MASTER SCOPE', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Filter by nature of business')).toBeVisible();
});

test('operational scope hides classification controls and retains legitimate feed names', async ({ page }) => {
  await gotoConsole(page, { path: '/master-data/item', routes: [
    ['**/api/v1/item?*', (route) => route.fulfill({ json: [{ item_id: 'feed', item_code: 'FEED', item_name: 'Wheat and fish meal', item_type: 'RAW_MATERIAL', uom_primary: 'KG', is_active: true }] })],
  ] });
  await page.evaluate(() => {
    localStorage.setItem('active_workspace_scope', 'OPERATIONAL');
    localStorage.setItem('active_operational_area_id', 'area-e2e');
    localStorage.setItem('active_lob', 'PIGGERY');
  });
  await page.reload();
  await expect(page.getByText('Wheat and fish meal', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Filter by nature of business')).toHaveCount(0);
  await page.locator(CONTENT).getByRole('button', { name: /^add /i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Nature of Business', { exact: true })).toHaveCount(0);
  await expect(dialog.getByText('Line of Business', { exact: true })).toHaveCount(0);
});

test('configured UOM code is generated and omitted from the creation payload', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await gotoConsole(page, { path: '/master-data/uom', routes: [
    ['**/api/v1/number-series/resolve?*', (route) => route.fulfill({ json: { generated: true, allowManual: false, seriesCode: 'UOM_WEIGHT' } })],
    ['**/api/v1/uom', (route) => {
      submitted = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { uom_id: 'new-uom' } });
    }],
  ] });
  await page.locator(CONTENT).getByRole('button', { name: /^add /i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('UOM Code', { exact: true })).toBeDisabled();
  await dialog.getByLabel('UOM Name', { exact: true }).fill('Presentation unit');
  await dialog.getByLabel('UOM Type', { exact: true }).selectOption('WEIGHT');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect.poll(() => submitted).toEqual(expect.objectContaining({ company_id: 'company-e2e', uom_name: 'Presentation unit' }));
  expect(submitted).not.toHaveProperty('uom_code');
});
