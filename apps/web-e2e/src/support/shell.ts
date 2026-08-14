import type { Page } from '@playwright/test';

export const SHELL_ROOT = '[data-shell-root][data-shell-ready="true"]';
export const PRIMARY_NAV = '[data-shell-region="primary-nav"]';
export const HEADER = '[data-shell-region="header"]';
export const WORKSPACE = '[data-shell-region="workspace"]';
export const CONTEXT_NAV = '[data-shell-region="context-nav"]';
export const CONTENT = 'main[data-shell-region="content"]';

/**
 * Opens the shell fixture route and waits for the shell to report that it has
 * committed its layout, so nothing below depends on an arbitrary delay.
 */
export async function gotoHarness(
  page: Page,
  options: { contextNav?: boolean } = {},
): Promise<void> {
  await page.goto(options.contextNav ? '/dev/shell-harness?context=1' : '/dev/shell-harness');
  await page.waitForSelector(SHELL_ROOT);
}

/**
 * Seeds an authenticated console session and stubs the API the console layout
 * calls on mount. The shell must be provable on a real application route, not
 * only on the fixture, and these tests are about geometry — not about the
 * backend being reachable.
 */
export async function gotoConsole(page: Page, path = '/console/master-data'): Promise<void> {
  // Registered first so the specific handlers below take precedence:
  // Playwright matches the most recently registered route first.
  await page.route('**/api/v1/**', (route) => route.fulfill({ status: 200, json: [] }));
  await page.route('**/api/v1/tenant/*', (route) =>
    route.fulfill({ status: 200, json: { tenant_id: 'tenant-e2e', plan_id: 'PLAN_STANDARD' } }),
  );
  await page.route('**/api/v1/company/tenant/*', (route) =>
    route.fulfill({
      status: 200,
      json: [
        {
          company_id: 'company-e2e',
          company_name: 'Navfarm E2E Estate',
          onboarding_status: 'COMPLETED',
        },
      ],
    }),
  );

  await page.addInitScript(() => {
    const user = {
      userId: 'user-e2e',
      email: 'e2e@navfarm.test',
      fullName: 'E2E Operator',
      userType: 'COMPANY_ADMIN',
      companyId: 'company-e2e',
      company_id: 'company-e2e',
      tenantId: 'tenant-e2e',
      companies: [
        { company_id: 'company-e2e', company_name: 'Navfarm E2E Estate', is_primary: true },
      ],
    };
    localStorage.setItem('navfarm_auth_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('navfarm_access_token', 'e2e-access-token');
    localStorage.setItem('navfarm_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('navfarm_tenant_id', 'tenant-e2e');
    localStorage.setItem('tenant_id', 'tenant-e2e');
    localStorage.setItem('active_company_id', 'company-e2e');
  });

  await page.goto(path);
  await page.waitForSelector(SHELL_ROOT);
}

/** Vertical scroll state of the document itself. */
export async function documentScroll(page: Page) {
  return page.evaluate(() => {
    const el = document.scrollingElement as HTMLElement;
    return {
      scrollY: window.scrollY,
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
}
