'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { COMPANIES, type CompanyMeta } from '@/modules/company';
import { Building2, BarChart3, Settings, ArrowUpRight } from 'lucide-react';

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

const PLACEHOLDER_CARDS = [
  {
    icon: Building2,
    title: 'Operations',
    desc: 'Manage day-to-day farm operations',
    color: '#c24332',
    bg: 'rgba(194,67,50,0.06)',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    desc: 'View analytics and performance reports',
    color: '#1c4aa9',
    bg: 'rgba(28,74,169,0.06)',
  },
  {
    icon: Settings,
    title: 'Settings',
    desc: 'Configure your module preferences',
    color: '#707070',
    bg: 'rgba(112,112,112,0.06)',
  },
];

export default function CompanyDashboardPage() {
  const { company } = useParams<{ company: string }>();
  const { user } = useAuth();

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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-[13px] text-[#707070] mb-1">Welcome back{user?.name ? `, ${user.name}` : ''}</p>
        <h1 className="text-[28px] font-semibold text-[#2e313f] tracking-tight">
          {meta.icon} {meta.name}
        </h1>
        <p className="text-[14px] text-[#707070] mt-1">{meta.description}</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PLACEHOLDER_CARDS.map((item) => (
          <div
            key={item.title}
            className="group bg-white rounded-2xl border border-[#e5e5e5] p-7 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#c24332]"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: item.bg }}
            >
              <item.icon size={20} style={{ color: item.color }} />
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-[15px] font-semibold text-[#2e313f]">{item.title}</h3>
              <ArrowUpRight
                size={14}
                className="text-[#707070] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
              />
            </div>
            <p className="text-[13px] text-[#707070] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
