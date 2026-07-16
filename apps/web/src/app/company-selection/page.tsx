'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, LogOut, Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FullPageOverlay } from '@/components/ui/full-page-overlay';
import {
  COMPANIES,
  NOB_OPTIONS,
  CompanyCard,
  createCompanyMeta,
  type CompanyMeta,
  type NobCode,
} from '@/modules/company';
import {
  CUSTOM_COMPANIES_KEY,
  getCustomCompanies,
} from '@/modules/company/use-current-company';

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
  const [companies, setCompanies] =
    useState<Record<string, CompanyMeta>>(COMPANIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [nobCode, setNobCode] = useState<NobCode | ''>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);
  useEffect(() => {
    const next = { ...COMPANIES };
    for (const custom of getCustomCompanies()) next[custom.slug] = custom;
    setCompanies(next);
  }, []);

  if (loading || !user) return null;

  function createCompany() {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) return setError('Company name is required');
    if (!nobCode) return setError('Select a Nature of Business');
    const slug = slugify(trimmed);
    if (companies[slug])
      return setError('A company with this name already exists');
    const created = createCompanyMeta(trimmed, slug, nobCode);
    localStorage.setItem(
      CUSTOM_COMPANIES_KEY,
      JSON.stringify([...getCustomCompanies(), created]),
    );
    setCompanies((current) => ({ ...current, [slug]: created }));
    setModalOpen(false);
    setName('');
    setNobCode('');
    router.push(`/${slug}/settings`);
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <header className="border-b border-[#e7e7e7] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="text-xl font-bold tracking-tight text-[#0b1248]">
            NAV<span className="text-[#c24332]">Farm</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-[#2e313f]">
                {user.name}
              </p>
              <p className="text-[10px] text-[#8a8a8a]">Frontend demo</p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="rounded-lg border border-[#e5e5e5] p-2 text-[#707070] hover:text-[#c24332]"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1c4aa9]">
              Tenant workspace
            </p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-[#2e313f]">
              Choose a company
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#707070]">
              Companies are separate legal or operating entities. Each workspace
              is assigned a documented Nature of Business and contains its LOBs,
              batches and settings.
            </p>
          </div>
          <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
            Demo companies
          </span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(companies).map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
          <button
            onClick={() => setModalOpen(true)}
            className="group flex min-h-[230px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d4d4d4] bg-white p-7 transition-all hover:-translate-y-1 hover:border-[#1c4aa9] hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[#707070] group-hover:bg-blue-50 group-hover:text-[#1c4aa9]">
              <Plus size={21} />
            </div>
            <span className="text-sm font-semibold text-[#606372]">
              Create company
            </span>
            <span className="text-xs text-[#8a8a8a]">
              Assign a NOB and configure LOBs
            </span>
          </button>
        </div>
      </main>
      {modalOpen && (
        <FullPageOverlay onClose={() => setModalOpen(false)} className="max-w-md">
          <div role="dialog" aria-modal="true" aria-label="Create company" className="w-full rounded-2xl bg-white p-7 shadow-2xl animate-slide-up">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 text-[#707070]"
            >
              <X size={19} />
            </button>
            <h2 className="text-xl font-semibold text-[#2e313f]">
              Create company
            </h2>
            <p className="mt-1 text-sm text-[#707070]">
              Company details can be completed in the 15-step setup checklist.
            </p>
            {error && (
              <div className="mt-5 flex items-center gap-2 text-xs text-[#c24332]">
                <AlertCircle size={15} />
                {error}
              </div>
            )}
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#2e313f]">
                  Company name
                </span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Green Valley Farms"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#2e313f]">
                  Nature of Business
                </span>
                <select
                  value={nobCode}
                  onChange={(event) =>
                    setNobCode(event.target.value as NobCode)
                  }
                  className="h-12 w-full rounded-xl border border-[#e5e5e5] bg-white px-4 text-sm text-[#2e313f] outline-none focus:border-[#c24332]"
                >
                  <option value="">Select NOB</option>
                  {NOB_OPTIONS.map((nob) => (
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
              <Button onClick={createCompany}>Create company</Button>
            </div>
          </div>
        </FullPageOverlay>
      )}
    </div>
  );
}
