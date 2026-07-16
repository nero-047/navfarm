'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle, Check, ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FullPageOverlay } from '@/components/ui/full-page-overlay';
import {
  COMPANIES,
  NOB_OPTIONS,
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
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const next = { ...COMPANIES };
    for (const custom of getCustomCompanies()) next[custom.slug] = custom;
    setCompanies(next);
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
    const created = createCompanyMeta(trimmed, slug, nobCode);
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
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
        >
          <span className="text-base">{current?.icon ?? '🏢'}</span>
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
            className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[#e5e5e5] bg-white py-1 shadow-xl"
          >
            <div className="max-h-72 overflow-y-auto">
              {Object.values(companies).map((company) => (
                <button
                  key={company.slug}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/${company.slug}/dashboard`);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${company.slug === currentSlug ? 'bg-[#f4f5f8]' : 'hover:bg-[#f8f8f8]'}`}
                >
                  <span>{company.icon}</span>
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
            <div className="mt-1 border-t border-[#e5e5e5] pt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setModalOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-[#1c4aa9] hover:bg-[#f8f8f8]"
              >
                <Plus size={13} />
                New company
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <FullPageOverlay onClose={() => setModalOpen(false)} className="max-w-md">
          <div role="dialog" aria-modal="true" aria-label="Create company" className="w-full rounded-2xl bg-white p-7 text-[#2e313f] shadow-2xl animate-slide-up">
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
              <Button onClick={handleCreate}>Create company</Button>
            </div>
          </div>
        </FullPageOverlay>
      )}
    </>
  );
}
