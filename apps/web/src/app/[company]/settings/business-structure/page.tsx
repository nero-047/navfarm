import { BusinessStructureView } from '@/components/phase3/company-masters';
export default async function BusinessStructurePage({
  params,
  searchParams,
}: {
  params: Promise<{ company: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { company } = await params;
  const query = await searchParams;
  return (
    <BusinessStructureView
      companySlug={company}
      section={query.section === 'lobs' ? 'lobs' : 'nobs'}
    />
  );
}
