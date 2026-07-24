import { BusinessStructureView } from '@/components/phase3/company-masters';
export default async function CompanyNobsPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  return <BusinessStructureView companySlug={company} />;
}
