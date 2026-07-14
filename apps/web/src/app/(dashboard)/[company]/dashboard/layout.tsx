import { COMPANIES, isValidCompany } from '@/modules/company';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ company: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company } = await params;
  if (!isValidCompany(company)) return { title: 'Not Found' };
  const meta = COMPANIES[company];
  return { title: `${meta.name} Dashboard - NAVFarm` };
}

export default async function CompanyDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;

  if (!isValidCompany(company)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#2e313f]">Industry Not Found</h2>
          <p className="text-[#707070] mt-2">
            This industry is not available yet.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
