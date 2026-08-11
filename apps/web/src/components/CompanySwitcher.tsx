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
  NOB_OPTIONS,
  createBackendCompany,
  useCompanyContext,
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

export function CompanySwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentSlug = pathname.split('/').filter(Boolean)[0] ?? null;
  const { companies, company: current, reload } = useCompanyContext();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [nobCode, setNobCode] = useState<NobCode | ''>('');
  const [nobOptions] = useState<NobOption[]>(NOB_OPTIONS);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  async function handleCreate() {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) return setError('Company name is required');
    if (!nobCode) return setError('Select a Nature of Business');
    const slug = slugify(trimmed);
    if (companies.some((company) => company.slug === slug))
      return setError('A company with this name already exists');
    try {
      const created = await createBackendCompany({ name: trimmed, nobCode });
      reload();
      setName('');
      setNobCode('');
      setModalOpen(false);
      setOpen(false);
      router.push(`/${created.slug}/settings`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not create company',
      );
    }
  }

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-white transition-colors hover:bg-white/10"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-white/10 text-base">
            {current?.icon ?? '🏢'}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-xs font-medium">
              {current?.name ?? 'Select company'}
            </span>
            {current && (
              <span className="block truncate text-xs uppercase tracking-wide text-white/40">
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
            className="absolute left-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-[var(--radius-lg)] border border-(--border) bg-(--surface) shadow-[var(--shadow-md)]"
          >
            <div className="border-b border-(--border) px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-(--accent) text-white">
                  <Building2 size={17} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-(--text-primary)">
                    Organization workspace
                  </p>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-(--text-muted)">
                    Organization · {companies.length} companies
                  </p>
                </div>
              </div>
              <label className="mt-3 flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-(--border) bg-(--surface-raised) px-3 transition focus-within:border-(--input-border-focus) focus-within:bg-(--surface) focus-within:ring-[3px] focus-within:ring-(--accent)/15">
                <Search size={13} className="text-(--text-muted)" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find a company"
                  className="nf-embedded-input min-w-0 flex-1 border-0 bg-transparent text-xs text-(--text-primary) outline-none"
                />
              </label>
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {companies
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
                    className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-colors ${company.slug === currentSlug ? 'bg-(--accent-muted)' : 'hover:bg-(--surface-raised)'}`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-(--surface) text-base shadow-sm">
                      {company.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-(--text-primary)">
                        {company.name}
                      </span>
                      <span className="block text-xs uppercase tracking-wide text-(--text-muted)">
                        {company.nobName}
                      </span>
                    </span>
                    {company.slug === currentSlug && (
                      <Check size={13} className="text-(--accent)" />
                    )}
                  </button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-1 border-t border-(--border) p-2">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push('/organization');
                }}
                className="flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs font-medium text-(--text-secondary) hover:bg-(--surface-raised)"
              >
                <Settings2 size={13} /> Organization
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs font-medium text-(--accent) hover:bg-(--accent-muted)"
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
            className="w-full rounded-[var(--radius-lg)] border border-(--border) bg-(--surface) p-7 text-(--text-primary) shadow-[var(--shadow-md)] animate-slide-up"
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-5 top-5 text-(--text-secondary)"
            >
              <X size={19} />
            </button>
            <h2 className="text-xl font-semibold">Create company</h2>
            <p className="mt-1 text-sm text-(--text-secondary)">
              A company is assigned one primary NOB. Its LOBs are configured
              inside the workspace.
            </p>
            {error && (
              <div className="mt-5 flex items-center gap-2 text-xs text-(--danger)">
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
                  className="flex h-12 w-full rounded-[var(--radius-md)] border border-(--input-border) bg-(--input-bg) px-4 text-sm outline-none focus:border-(--input-border-focus)"
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
