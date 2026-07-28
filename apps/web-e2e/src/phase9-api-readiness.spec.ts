import { expect, test, type Page } from '@playwright/test';

async function reset(page: Page) {
  await page.context().clearCookies();
  expect((await page.request.post('/api/v1/__mock/reset')).ok()).toBe(true);
}

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Demo123!');
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test.beforeEach(async ({ page }) => reset(page));

test('tenant administrator creates, edits, and assigns a workspace through typed APIs', async ({ page }) => {
  await signIn(page, 'tenant@navfarm.demo');
  await page.goto('/green-valley-poultry/workspaces');
  await expect(page.getByRole('heading', { name: 'Choose a business area' })).toBeVisible();
  await page.getByRole('link', { name: 'Create workspace' }).click();
  await page.getByLabel('Workspace name').fill('Layer Operations');
  await page.getByLabel('Workspace code').fill('LAYER_OPS');
  await page.getByRole('button', { name: 'Create draft workspace' }).click();
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces\/layer-operations$/);
  await expect(page.getByRole('main').getByRole('heading', { name: 'Layer Operations' })).toBeVisible();
  await page.getByLabel('Workspace name').fill('Layer Production');
  await expect(page.getByLabel('Workspace name')).toHaveValue('Layer Production');
  await page.getByLabel('QR').check();
  await expect(page.getByLabel('Workspace name')).toHaveValue('Layer Production');
  await page.getByRole('button', { name: 'Save workspace' }).click();
  await expect(page.getByLabel('Workspace name')).toHaveValue('Layer Production');
  await page.getByLabel('Member email').fill('viewer@navfarm.demo');
  await page.getByLabel('Workspace role').selectOption('VIEWER');
  await page.getByRole('button', { name: 'Add member' }).click();
  await expect(page.getByText('viewer@navfarm.demo')).toBeVisible();
});

test('legacy operational routes resolve by accessible workspace cardinality', async ({ page }) => {
  await signIn(page, 'manager@navfarm.demo');
  const routes = ['dashboard', 'batches', 'operations', 'quality', 'traceability', 'resources', 'costing', 'reports'];
  for (const route of routes) {
    await page.goto(`/green-valley-poultry/${route}`);
    await expect(page).toHaveURL(new RegExp(`/green-valley-poultry/workspaces/poultry-operations/${route}$`));
  }

  await reset(page);
  await signIn(page, 'multi@navfarm.demo');
  await page.goto('/green-valley-poultry/batches');
  await expect(page).toHaveURL(/\/green-valley-poultry\/workspaces$/);
  await expect(page.getByRole('heading', { name: 'Choose a business area' })).toBeVisible();
});

test('legacy operational route shows an explicit no-workspace access state', async ({ page }) => {
  await signIn(page, 'tenant@navfarm.demo');
  await page.goto('/green-valley-poultry/reports');
  await expect(page.getByRole('heading', { name: 'Workspace access not assigned' })).toBeVisible();
  await expect(page).toHaveURL(/\/green-valley-poultry\/reports$/);
});
