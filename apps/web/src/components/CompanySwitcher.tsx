'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertCircle,
  Building2,
  Check,
  ChevronDown,
  Plus,
  Search,
  Settings2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FullPageOverlay } from '@/components/ui/full-page-overlay';
import {
  COMPANIES,
  NOB_OPTIONS,
  getNobCatalog,
  createCompanyMeta,
  type CompanyMeta,
  type NobCode,
  type NobOption,
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

export function CompanySwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentSlug = pathname.split('/').filter(Boolean)[0] ?? null;
  const [companies, setCompanies] =
    useState<Record<string, CompanyMeta>>(COMPANIES);
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [nobCode, setNobCode] = useState<NobCode | ''>('');
  const [nobOptions, setNobOptions] = useState<NobOption[]>(NOB_OPTIONS);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const next = { ...COMPANIES };
    for (const custom of getCustomCompanies()) next[custom.slug] = custom;
    setCompanies(next);
    setNobOptions(getNobCatalog());
  }, []);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (
        !dropdownRef.current?.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      )
        setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', closeOnOutside);
      document.addEventListener('keydown', closeOnEscape);
    }
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const current = currentSlug ? companies[currentSlug] : null;

  function handleCreate() {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) return setError('Company name is required');
    if (!nobCode) return setError('Select a Nature of Business');
    const slug = slugify(trimmed);
    if (companies[slug])
      return setError('A company with this name already exists');
    const created = createCompanyMeta(
      trimmed,
      slug,
      nobCode,
      nobOptions.find((item) => item.code === nobCode),
    );
    const custom = [...getCustomCompanies(), created];
    localStorage.setItem(CUSTOM_COMPANIES_KEY, JSON.stringify(custom));
    setCompanies((value) => ({ ...value, [slug]: created }));
    setName('');
    setNobCode('');
    setModalOpen(false);
    setOpen(false);
    router.push(`/${slug}/settings`);
  }

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-white transition-colors hover:bg-white/10"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base">
            {current?.icon ?? '🏢'}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-xs font-medium">
              {current?.name ?? 'Select company'}
            </span>
            {current && (
              <span className="block truncate text-[9px] uppercase tracking-wide text-white/40">
                {current.nobName}
              </span>
            )}
          </span>
          <ChevronDown
            size={13}
            className={`text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div
            ref={dropdownRef}
            className="absolute left-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-[#dfe3ea] bg-white shadow-2xl"
          >
            <div className="border-b border-[#edf0f4] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b1248] text-white">
                  <Building2 size={17} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#252b3d]">
                    Green Valley Holdings
                  </p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-wide text-[#9298a8]">
                    Organization · {Object.keys(companies).length} companies
                  </p>
                </div>
              </div>
              <label className="mt-3 flex h-9 items-center gap-2 rounded-xl border border-[#e3e7ee] bg-[#f7f8fa] px-3">
                <Search size={13} className="text-[#8a90a0]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find a company"
                  className="min-w-0 flex-1 bg-transparent text-xs text-[#30364b] outline-none"
                />
              </label>
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {Object.values(companies)
                .filter(
                  (company) =>
                    company.name.toLowerCase().includes(query.toLowerCase()) ||
                    company.nobName.toLowerCase().includes(query.toLowerCase()),
                )
                .map((company) => (
                  <button
                    key={company.slug}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/${company.slug}/dashboard`);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${company.slug === currentSlug ? 'bg-blue-50' : 'hover:bg-[#f8f8f8]'}`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-base shadow-sm">
                      {company.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-[#2e313f]">
                        {company.name}
                      </span>
                      <span className="block text-[9px] uppercase tracking-wide text-[#8a8a8a]">
                        {company.nobName}
                      </span>
                    </span>
                    {company.slug === currentSlug && (
                      <Check size={13} className="text-[#c24332]" />
                    )}
                  </button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-1 border-t border-[#e5e5e5] p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/organization');
                }}
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-[#51586a] hover:bg-[#f5f7fa]"
              >
                <Settings2 size={13} /> Organization
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-[#1c4aa9] hover:bg-blue-50"
              >
                <Plus size={13} />
                New company
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <FullPageOverlay
          onClose={() => setModalOpen(false)}
          className="max-w-md"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create company"
            className="w-full rounded-2xl bg-white p-7 text-[#2e313f] shadow-2xl animate-slide-up"
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 text-[#707070]"
            >
              <X size={19} />
            </button>
            <h2 className="text-xl font-semibold">Create company</h2>
            <p className="mt-1 text-sm text-[#707070]">
              A company is assigned one primary NOB. Its LOBs are configured
              inside the workspace.
            </p>
            {error && (
              <div className="mt-5 flex items-center gap-2 text-xs text-[#c24332]">
                <AlertCircle size={15} />
                {error}
              </div>
            )}
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium">
                  Company legal / display name
                </span>
                <Input
                  placeholder="e.g. Sunrise Farms Private Limited"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium">
                  Nature of Business (NOB)
                </span>
                <select
                  value={nobCode}
                  onChange={(event) =>
                    setNobCode(event.target.value as NobCode)
                  }
                  className="flex h-12 w-full rounded-xl border border-[#e5e5e5] bg-white px-4 text-sm outline-none focus:border-[#c24332]"
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
              <Button onClick={handleCreate}>Create company</Button>
            </div>
          </div>
        </FullPageOverlay>
      )}
    </>
  );
}
