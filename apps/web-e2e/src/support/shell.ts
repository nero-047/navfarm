import type { Page } from '@playwright/test';

export const SHELL_ROOT = '[data-shell-root][data-shell-ready="true"]';
export const PRIMARY_NAV = '[data-shell-region="primary-nav"]';
export const HEADER = '[data-shell-region="header"]';
export const WORKSPACE = '[data-shell-region="workspace"]';
export const CONTEXT_NAV = '[data-shell-region="context-nav"]';
export const CONTENT = 'main[data-shell-region="content"]';

/** The page header, inside the main content region. */
export const PAGE_HEADER = '[data-shell-region="page-header"]';
/** The single breadcrumb, emitted by the shell above the page header. */
export const BREADCRUMB = '[data-shell-breadcrumb]';
export const PAGE_TITLE = '[data-page-title]';

/** The contextual navigation itself, inside the shell's context-nav region. */
export const CONTEXT_NAV_LIST = '[data-context-nav]';
export const CONTEXT_NAV_ITEM = '[data-context-nav-item]';
/** The grouped-index selector that replaces the column below 1024px. */
export const CONTEXT_NAV_TRIGGER = '[data-context-nav-trigger]';

/** The four routes Phase 3 gives a contextual-navigation column. */
export const MODULE_ROUTES = [
  '/console/master-data',
  '/console/inventory',
  '/console/finance',
  '/console/production',
] as const;

/** Console routes that stay full-width content. */
export const FULL_WIDTH_ROUTES = [
  '/console/dashboard',
  '/console/companies',
  '/console/notifications',
] as const;

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

export interface SessionCompany {
  company_id: string;
  company_name: string;
  is_primary: boolean;
}

export const DEFAULT_COMPANY: SessionCompany = {
  company_id: 'company-e2e',
  company_name: 'Navfarm E2E Estate',
  is_primary: true,
};

/** A second company, which is what makes the workspace switcher render. */
export const SECOND_COMPANY: SessionCompany = {
  company_id: 'company-e2e-2',
  company_name: 'Navfarm E2E Highlands',
  is_primary: false,
};

export interface ConsoleSessionOptions {
  path?: string;
  /** Companies on the session user. Two or more reveal the workspace switcher. */
  companies?: SessionCompany[];
}

/**
 * Seeds an authenticated console session and stubs the API the console layout
 * calls on mount. The shell must be provable on a real application route, not
 * only on the fixture, and these tests are about geometry and interaction —
 * not about the backend being reachable.
 */
export async function gotoConsole(
  page: Page,
  { path = '/console/master-data', companies = [DEFAULT_COMPANY] }: ConsoleSessionOptions = {},
): Promise<void> {
  // Registered first so the specific handlers below take precedence:
  // Playwright matches the most recently registered route first.
  await page.route('**/api/v1/**', (route) => route.fulfill({ status: 200, json: [] }));
  await page.route('**/api/v1/tenant/*', (route) =>
    route.fulfill({ status: 200, json: { tenant_id: 'tenant-e2e', plan_id: 'PLAN_STANDARD' } }),
  );
  await page.route('**/api/v1/company/tenant/*', (route) =>
    route.fulfill({
      status: 200,
      json: companies.map((company) => ({ ...company, onboarding_status: 'COMPLETED' })),
    }),
  );

  await page.addInitScript((sessionCompanies: SessionCompany[]) => {
    const user = {
      userId: 'user-e2e',
      email: 'e2e@navfarm.test',
      fullName: 'E2E Operator',
      userType: 'COMPANY_ADMIN',
      companyId: 'company-e2e',
      company_id: 'company-e2e',
      tenantId: 'tenant-e2e',
      companies: sessionCompanies,
    };
    localStorage.setItem('navfarm_auth_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('navfarm_access_token', 'e2e-access-token');
    localStorage.setItem('navfarm_refresh_token', 'e2e-refresh-token');
    localStorage.setItem('navfarm_tenant_id', 'tenant-e2e');
    localStorage.setItem('tenant_id', 'tenant-e2e');
    localStorage.setItem('active_company_id', 'company-e2e');
  }, companies);

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
