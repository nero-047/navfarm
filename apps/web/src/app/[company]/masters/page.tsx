import { MasterDashboardView } from '@/components/phase3/company-masters';
export default async function CompanyMastersPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  return <MasterDashboardView companySlug={company} />;
}
