import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { apiErrorResponse } from './errors';

type JsonRecord = Record<string, unknown>;

const languages = [
  { lang_id: 'lang-en', lang_code: 'en', lang_name: 'English' },
  { lang_id: 'lang-hi', lang_code: 'hi', lang_name: 'Hindi' },
];
const currencies = [
  { currency_id: 'cur-inr', currency_code: 'INR', currency_name: 'Indian Rupee', symbol: '₹' },
  { currency_id: 'cur-usd', currency_code: 'USD', currency_name: 'US Dollar', symbol: '$' },
];
const nobs = [
  ['nob-poultry', 'POULTRY', 'Poultry'],
  ['nob-livestock', 'LIVESTOCK', 'Livestock'],
  ['nob-agriculture', 'AGRICULTURE', 'Agriculture'],
  ['nob-aquaculture', 'AQUACULTURE', 'Aquaculture'],
  ['nob-insect', 'INSECT', 'Insect Farming'],
  ['nob-processing', 'PROCESSING', 'Feed & Processing'],
].map(([nob_id, nob_code, nob_name]) => ({ nob_id, nob_code, nob_name, is_active: true }));

const seedCompanies: JsonRecord[] = [
  {
    company_id: 'company-green-valley',
    tenant_id: 'tenant-demo',
    company_code: 'GREEN_VALLEY',
    company_name: 'Green Valley Poultry',
    company_display_name: 'Green Valley Poultry',
    industry_type: 'Poultry',
    onboarding_status: 'COMPLETED',
    is_active: true,
  },
];

type MockState = {
  companies: JsonRecord[];
  demoStates: Map<string, unknown>;
  resources: Map<string, JsonRecord[]>;
};

declare global {
  var __navfarmMockState: MockState | undefined;
}

const state: MockState = globalThis.__navfarmMockState ?? {
  companies: structuredClone(seedCompanies),
  demoStates: new Map(),
  resources: new Map(),
};
globalThis.__navfarmMockState = state;

function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status });
}

async function body(request: Request): Promise<JsonRecord> {
  if (!request.headers.get('content-type')?.includes('application/json')) return {};
  return (await request.json().catch(() => ({}))) as JsonRecord;
}

export async function handleMockRequest(
  request: Request,
  path: string,
  requestId: string,
): Promise<NextResponse> {
  const method = request.method;
  const input = await body(request);

  if (method === 'POST' && path === '/auth/login') {
    const email = String(input.email || 'admin@navfarm.demo');
    const systemAdmin = email.toLowerCase().includes('system');
    return json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      user: {
        userId: systemAdmin ? 'user-system' : 'user-demo',
        fullName: systemAdmin ? 'System Administrator' : 'Demo Administrator',
        email,
        userType: systemAdmin ? 'SYSTEM_ADMIN' : 'TENANT_ADMIN',
        companyId: 'company-green-valley',
        tenantId: 'tenant-demo',
        companies: [],
        permissions: [],
      },
    });
  }
  if (method === 'POST' && path === '/auth/refresh') {
    return json({
      access_token: 'mock-access-token-refreshed',
      refresh_token: 'mock-refresh-token',
      user: {
        userId: 'user-demo',
        fullName: 'Demo Administrator',
        email: 'admin@navfarm.demo',
        userType: 'TENANT_ADMIN',
        companyId: 'company-green-valley',
        tenantId: 'tenant-demo',
        companies: [],
        permissions: [],
      },
    });
  }
  if (method === 'GET' && path === '/language') return json(languages);
  if (method === 'GET' && path === '/currency') return json(currencies);
  if (method === 'GET' && path === '/setup/wizard/nobs') return json(nobs);
  if (method === 'GET' && /^\/setup\/wizard\/lobs\/[^/]+$/.test(path)) {
    return json([
      { lob_id: 'lob-primary', lob_code: 'PRIMARY', lob_name: 'Primary Production', is_active: true },
      { lob_id: 'lob-processing', lob_code: 'PROCESSING', lob_name: 'Processing', is_active: true },
    ]);
  }
  if (method === 'GET' && /^\/company\/tenant\/[^/]+$/.test(path)) return json(state.companies);
  if (method === 'POST' && path === '/company') {
    const id = randomUUID();
    const created = {
      company_id: id,
      tenant_id: String(request.headers.get('x-tenant-id') || 'tenant-demo'),
      company_code: String(input.company_code || `COMPANY_${state.companies.length + 1}`),
      company_name: String(input.company_name || 'New Company'),
      company_display_name: String(input.company_display_name || input.company_name || 'New Company'),
      industry_type: String(input.industry_type || 'Poultry'),
      onboarding_status: 'IN_PROGRESS',
      is_active: true,
    };
    state.companies.push(created);
    return json(created, 201);
  }

  const demoMatch = path.match(/^\/demo\/companies\/([^/]+)\/state$/);
  if (demoMatch && method === 'GET') return json({ state: state.demoStates.get(demoMatch[1]) ?? null });
  if (demoMatch && method === 'PUT') {
    state.demoStates.set(demoMatch[1], input.state);
    return json({ success: true });
  }

  if (method === 'GET' && path === '/tenant') {
    return json([{ tenant_id: 'tenant-demo', tenant_name: 'NAVFarm Demo', plan_id: 'PLAN_PRO', is_active: true }]);
  }
  if (method === 'GET' && /^\/tenant\/[^/]+$/.test(path)) {
    return json({ tenant_id: path.split('/')[2], tenant_name: 'NAVFarm Demo', plan_id: 'PLAN_PRO', is_active: true });
  }
  if (method === 'GET' && path === '/plan') {
    return json([{ plan_id: 'PLAN_PRO', plan_name: 'Pro', is_active: true, max_companies: 10, max_users: 100 }]);
  }
  if (method === 'GET' && path === '/audit-log') return json([]);
  if (method === 'GET' && (path === '/auth/users' || /\/users$/.test(path))) return json([]);
  if (method === 'GET' && (/^\/notification\//.test(path) || /^\/role\//.test(path) || /^\/user-company\//.test(path))) return json([]);
  if (method === 'GET' && /^\/setup\/wizard\/status\//.test(path)) {
    return json(Array.from({ length: 15 }, (_, index) => ({
      stepOrder: index + 1,
      status: index < 9 ? 'COMPLETED' : 'PENDING',
      isMandatory: index < 9,
    })));
  }
  if (method === 'GET' && /^\/setup\/wizard\/company-details\//.test(path)) {
    return json({ company: state.companies[0], addresses: [], contacts: [], modules: [] });
  }
  if (method === 'POST' && path === '/setup/wizard/upload-logo') {
    return json({ logoUrl: '/api/v1/mock-assets/company-logo' });
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return json({ success: true });

  return apiErrorResponse(404, `No seeded mock handler for ${method} ${path}.`, requestId);
}
