'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { COMPANIES, type CompanyMeta } from '@/modules/company';
import { Building2, BarChart3, Settings } from 'lucide-react';

const CUSTOM_KEY = 'navfarm_custom_companies';

function getCustom(): CompanyMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem(CUSTOM_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

export default function CompanyDashboardPage() {
  const { company } = useParams<{ company: string }>();

  const meta = useMemo(() => {
    if (company in COMPANIES) return COMPANIES[company];
    const custom = getCustom();
    return custom.find((c) => c.slug === company) ?? null;
  }, [company]);

  if (!meta) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🏭</span>
        <h1 className="text-xl font-bold text-[#2e313f] mb-2">Industry Not Found</h1>
        <p className="text-sm text-[#707070] max-w-sm">
          This industry is not available yet. Go back to company selection to create it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{meta.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-[#2e313f]">{meta.name} Dashboard</h1>
          <p className="text-sm text-[#707070]">{meta.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Building2, title: 'Operations', desc: 'Manage day-to-day farm operations' },
          { icon: BarChart3, title: 'Reports', desc: 'View analytics and performance reports' },
          { icon: Settings, title: 'Settings', desc: `Configure your ${meta.name} module` },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-lg border border-[#ebebeb] p-6 hover:shadow-md transition-shadow"
          >
            <item.icon className="text-[#1c4aa9] mb-3" size={24} />
            <h3 className="font-semibold text-[#2e313f]">{item.title}</h3>
            <p className="text-sm text-[#707070] mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
