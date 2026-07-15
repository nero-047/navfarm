'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { COMPANIES, type CompanyMeta } from '@/modules/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Check, Plus, X, AlertCircle } from 'lucide-react';

const CUSTOM_KEY = 'navfarm_custom_companies';

const INDUSTRY_OPTIONS = [
  { value: 'poultry', label: 'Poultry', icon: '🐔' },
  { value: 'piggery', label: 'Piggery', icon: '🐷' },
  { value: 'dairy', label: 'Dairy', icon: '🥛' },
  { value: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { value: 'livestock', label: 'Livestock', icon: '🐄' },
  { value: 'aquaculture', label: 'Aquaculture', icon: '🐟' },
  { value: 'beekeeping', label: 'Beekeeping', icon: '🐝' },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getCustom(): CompanyMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem(CUSTOM_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveCustom(company: CompanyMeta) {
  const existing = getCustom();
  existing.push(company);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(existing));
}

function getCurrentSlug(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 1) return parts[0];
  return null;
}

export function CompanySwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentSlug = getCurrentSlug(pathname);

  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const allCompanies = { ...COMPANIES };
  for (const c of getCustom()) {
    if (!(c.slug in allCompanies)) allCompanies[c.slug] = c;
  }

  const current = currentSlug ? allCompanies[currentSlug] : null;

  const handleSelect = (slug: string) => {
    setOpen(false);
    router.push(`/${slug}/dashboard`);
  };

  const handleCreate = () => {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Company name is required');
      return;
    }
    if (!industry) {
      setError('Please select an industry');
      return;
    }
    const slug = slugify(trimmed);
    if (slug in allCompanies) {
      setError('A company with this name already exists');
      return;
    }
    const opt = INDUSTRY_OPTIONS.find((o) => o.value === industry);
    const newCompany: CompanyMeta = {
      slug,
      name: trimmed,
      icon: opt?.icon ?? '🏭',
      description: `${opt?.label ?? industry} operations for ${trimmed}`,
    };
    saveCustom(newCompany);
    setName('');
    setIndustry('');
    setModalOpen(false);
    setOpen(false);
    router.push(`/${slug}/dashboard`);
  };

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white hover:bg-white/10 transition-colors"
        >
          <span className="text-lg leading-none">{current?.icon ?? '🏭'}</span>
          <span className="flex-1 text-left truncate font-medium">
            {current?.name ?? 'Select Company'}
          </span>
          <ChevronDown
            size={14}
            className={`text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-[#e5e5e5] py-1 z-50"
          >
            <div className="max-h-64 overflow-y-auto">
              {Object.values(allCompanies).map((company) => (
                <button
                  key={company.slug}
                  onClick={() => handleSelect(company.slug)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    company.slug === currentSlug
                      ? 'bg-[#f8f8f8] text-[#2e313f] font-medium'
                      : 'text-[#707070] hover:bg-[#f8f8f8] hover:text-[#2e313f]'
                  }`}
                >
                  <span className="text-base leading-none">{company.icon}</span>
                  <span className="flex-1 text-left">{company.name}</span>
                  {company.slug === currentSlug && (
                    <Check size={14} className="text-[#c24332]" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-[#e5e5e5] mt-1 pt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#1c4aa9] hover:bg-[#f8f8f8] transition-colors"
              >
                <Plus size={14} />
                <span>New Company</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Company Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7 animate-slide-up">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-[#707070] hover:text-[#2e313f] transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold text-[#2e313f] tracking-tight mb-1">
              Create new company
            </h2>
            <p className="text-sm text-[#707070] mb-7">
              Set up a new farm operations workspace
            </p>

            {error && (
              <div className="flex items-center gap-2 text-sm text-[#c24332] mb-5">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="cs-name" className="block text-[13px] font-medium text-[#2e313f]">
                  Company Name
                </label>
                <Input
                  id="cs-name"
                  placeholder="e.g. Sunrise Farms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cs-industry" className="block text-[13px] font-medium text-[#2e313f]">
                  Industry Type
                </label>
                <select
                  id="cs-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-[#e5e5e5] bg-white px-4 py-2.5 text-sm text-[#2e313f] transition-all duration-200 focus-visible:outline-none focus-visible:border-[#c24332] focus-visible:shadow-[0_0_0_3px_rgba(194,67,50,0.08)]"
                >
                  <option value="">Select industry</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-7">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Company</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
