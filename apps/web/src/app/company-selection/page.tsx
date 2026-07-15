'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyCard } from '@/modules/company';
import { COMPANIES, type CompanyMeta } from '@/modules/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'navfarm_custom_companies';

const INDUSTRY_OPTIONS = [
  { value: 'poultry', label: 'Poultry' },
  { value: 'piggery', label: 'Piggery' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'livestock', label: 'Livestock' },
  { value: 'aquaculture', label: 'Aquaculture' },
  { value: 'beekeeping', label: 'Beekeeping' },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getCustomCompanies(): CompanyMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomCompany(company: CompanyMeta) {
  const existing = getCustomCompanies();
  existing.push(company);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

function getIndustryIcon(industry: string): string {
  const icons: Record<string, string> = {
    poultry: '🐔',
    piggery: '🐷',
    dairy: '🥛',
    agriculture: '🌾',
    livestock: '🐄',
    aquaculture: '🐟',
    beekeeping: '🐝',
  };
  return icons[industry] ?? '🏭';
}

export default function CompanySelectionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [customCompanies, setCustomCompanies] = useState<CompanyMeta[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setCustomCompanies(getCustomCompanies());
  }, []);

  if (loading || !user) return null;

  const allCompanies = { ...COMPANIES };
  for (const c of customCompanies) {
    if (!(c.slug in allCompanies)) allCompanies[c.slug] = c;
  }

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
      icon: opt ? getIndustryIcon(industry) : '🏭',
      description: `${opt?.label ?? industry} operations for ${trimmed}`,
    };
    saveCustomCompany(newCompany);
    setCustomCompanies((prev) => [...prev, newCompany]);
    setName('');
    setIndustry('');
    setModalOpen(false);
    router.push(`/${slug}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-[32px] font-semibold text-[#2e313f] tracking-tight">
            Choose your workspace
          </h1>
          <p className="text-[#707070] text-[15px] mt-1.5">
            Select an industry to manage your farm operations
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Object.values(allCompanies).map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}

          {/* New Company Card */}
          <button
            onClick={() => setModalOpen(true)}
            className="group flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border-2 border-dashed border-[#d4d4d4] p-7 cursor-pointer h-full min-h-[180px] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#1c4aa9]"
          >
            <div className="w-12 h-12 rounded-full bg-[#f0f0f0] flex items-center justify-center transition-colors group-hover:bg-[#1c4aa9]/10">
              <Plus size={22} className="text-[#707070] group-hover:text-[#1c4aa9] transition-colors" />
            </div>
            <span className="text-[15px] font-medium text-[#707070] group-hover:text-[#2e313f] transition-colors">
              New Company
            </span>
          </button>
        </div>
      </div>

      {/* Modal */}
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
                <label htmlFor="company-name" className="block text-[13px] font-medium text-[#2e313f]">
                  Company Name
                </label>
                <Input
                  id="company-name"
                  placeholder="e.g. Sunrise Farms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="industry-type" className="block text-[13px] font-medium text-[#2e313f]">
                  Industry Type
                </label>
                <select
                  id="industry-type"
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
    </div>
  );
}
