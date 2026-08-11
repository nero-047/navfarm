'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  LogOut,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FullPageOverlay } from '@/components/ui/full-page-overlay';
import {
  NOB_OPTIONS,
  CompanyCard,
  createBackendCompany,
  fetchTenantCompanies,
  type CompanyMeta,
  type NobCode,
  type NobOption,
} from '@/modules/company';

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CompanySelectionPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Record<string, CompanyMeta>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [nobCode, setNobCode] = useState<NobCode | ''>('');
  const [nobOptions] = useState<NobOption[]>(NOB_OPTIONS);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);
  useEffect(() => {
    if (!user?.tenantId) return;
    setSyncing(true);
    fetchTenantCompanies(user.tenantId)
      .then((items) => {
        setCompanies(
          Object.fromEntries(items.map((company) => [company.slug, company])),
        );
      })
      .catch((cause) =>
        setError(
          cause instanceof Error ? cause.message : 'Could not load companies',
        ),
      )
      .finally(() => setSyncing(false));
  }, [user?.tenantId]);

  if (loading || !user) return null;

  async function createCompany() {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) return setError('Company name is required');
    if (!nobCode) return setError('Select a Nature of Business');
    const slug = slugify(trimmed);
    if (companies[slug])
      return setError('A company with this name already exists');
    setSyncing(true);
    try {
      const created = await createBackendCompany({ name: trimmed, nobCode });
      const next = { ...companies, [created.slug]: created };
      setCompanies(next);
      setModalOpen(false);
      setName('');
      setNobCode('');
      router.push(`/${created.slug}/settings`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not create company',
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--bg)">
      <header className="border-b border-(--border) bg-(--surface)">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="text-xl font-bold tracking-tight text-(--text-primary)">
            NAV<span className="text-(--accent)">Farm</span>
          </div>
          <div className="flex items-center gap-3">
            {user.userType === 'SYSTEM_ADMIN' ? (
              <Link
                href="/admin"
                className="hidden items-center gap-1.5 rounded-[var(--radius-sm)] border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-secondary) md:flex"
              >
                <ShieldCheck size={14} /> System Admin
              </Link>
            ) : (
              <Link
                href="/organization"
                className="hidden items-center gap-1.5 rounded-[var(--radius-sm)] border border-(--border) px-3 py-2 text-xs font-semibold text-(--text-secondary) md:flex"
              >
                <Building2 size={14} /> Tenant admin
              </Link>
            )}
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-(--text-primary)">
                {user.name}
              </p>
              <p className="text-xs text-(--text-muted)">
                Organization workspace
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="rounded-[var(--radius-sm)] border border-(--border) p-2 text-(--text-secondary) hover:text-(--accent)"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--accent)">
              Organization
            </p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-(--text-primary)">
              Choose a company
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-(--text-secondary)">
              Choose the legal or operating company you want to work in. Each
              company has its own operations, finance, users and settings.
            </p>
          </div>
          <span className="w-fit rounded-full border border-(--accent) bg-(--accent-muted) px-3 py-1 text-xs font-semibold text-(--accent)">
            Companies
          </span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {syncing && Object.keys(companies).length === 0 && (
            <p className="text-sm text-(--text-secondary)">
              Loading companies from NAVFarm API…
            </p>
          )}
          {Object.values(companies).map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
          {!syncing && Object.keys(companies).length === 0 && !error && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-[var(--radius-md)] border border-(--border) bg-(--surface) px-6 py-12 text-center">
              <Building2 className="mx-auto text-(--text-muted)" size={24} />
              <h2 className="mt-3 text-base font-semibold text-(--text-primary)">
                No company configured
              </h2>
              <p className="mt-1 text-sm text-(--text-secondary)">
                Create the first legal or operating company to begin onboarding.
              </p>
            </div>
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-(--border) bg-(--surface) p-7 transition-colors hover:border-(--accent)"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-raised) text-(--text-secondary) group-hover:bg-(--accent-muted) group-hover:text-(--accent)">
              <Plus size={21} />
            </div>
            <span className="text-sm font-semibold text-(--text-secondary)">
              Create company
            </span>
            <span className="text-xs text-(--text-muted)">
              Assign a NOB and configure LOBs
            </span>
          </button>
        </div>
      </main>
      {modalOpen && (
        <FullPageOverlay
          onClose={() => setModalOpen(false)}
          className="max-w-md"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create company"
            className="w-full rounded-[var(--radius-lg)] border border-(--border) bg-(--surface) p-7 shadow-[var(--shadow-md)] animate-slide-up"
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 text-(--text-secondary)"
            >
              <X size={19} />
            </button>
            <h2 className="text-xl font-semibold text-(--text-primary)">
              Create company
            </h2>
            <p className="mt-1 text-sm text-(--text-secondary)">
              Company details can be completed in the 15-step setup checklist.
            </p>
            {error && (
              <div className="mt-5 flex items-center gap-2 text-xs text-(--danger)">
                <AlertCircle size={15} />
                {error}
              </div>
            )}
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-(--text-primary)">
                  Company name
                </span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Green Valley Farms"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-(--text-primary)">
                  Nature of Business
                </span>
                <select
                  value={nobCode}
                  onChange={(event) =>
                    setNobCode(event.target.value as NobCode)
                  }
                  className="h-12 w-full rounded-[var(--radius-md)] border border-(--input-border) bg-(--input-bg) px-4 text-sm text-(--input-text) outline-none focus:border-(--input-border-focus)"
                >
                  <option value="">Select NOB</option>
                  {nobOptions.map((nob) => (
                    <option key={nob.code} value={nob.code}>
                      {nob.icon} {nob.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-7 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createCompany} disabled={syncing}>
                {syncing ? 'Creating…' : 'Create company'}
              </Button>
            </div>
          </div>
        </FullPageOverlay>
      )}
    </div>
  );
}
