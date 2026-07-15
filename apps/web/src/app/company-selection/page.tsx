'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyCard } from '@/modules/company';
import { COMPANIES, type CompanyMeta } from '@/modules/company';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

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
    if (!(c.slug in allCompanies)) {
      allCompanies[c.slug] = c;
    }
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

    const industryMeta = INDUSTRY_OPTIONS.find((o) => o.value === industry);
    const newCompany: CompanyMeta = {
      slug,
      name: trimmed,
      icon: industryMeta ? getIndustryIcon(industry) : '🏭',
      description: `${industryMeta?.label ?? industry} operations for ${trimmed}`,
    };

    saveCustomCompany(newCompany);
    setCustomCompanies((prev) => [...prev, newCompany]);
    setName('');
    setIndustry('');
    setModalOpen(false);
    router.push(`/${slug}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-[#2e313f]">Select Your Industry</h1>
            <p className="text-[#707070] mt-2">Choose the sector to manage your farm operations</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            New Company
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(allCompanies).map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
        </div>
      </div>

      {/* New Company Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-[#707070] hover:text-[#2e313f]"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-[#2e313f] mb-1">Create New Company</h2>
            <p className="text-sm text-[#707070] mb-6">Set up a new farm operations workspace</p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">{error}</p>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="company-name" className="text-sm font-medium text-[#2e313f]">
                  Company Name
                </label>
                <Input
                  id="company-name"
                  placeholder="e.g. Sunrise Farms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="industry-type" className="text-sm font-medium text-[#2e313f]">
                  Industry Type
                </label>
                <select
                  id="industry-type"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-[#ebebeb] bg-white px-3 py-2 text-sm text-[#2e313f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c4aa9] focus-visible:ring-offset-1"
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

            <div className="flex justify-end gap-3 mt-6">
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
