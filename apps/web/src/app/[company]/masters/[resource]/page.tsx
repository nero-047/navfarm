import { notFound } from 'next/navigation';
import { MasterResourceView } from '@/components/phase3/company-masters';
import { masterResourceSchema, type MasterResource } from '@/contracts/phase3';
export default async function CompanyMasterResourcePage({ params }: { params: Promise<{ company: string; resource: string }> }) {
  const { company, resource } = await params;
  const parsed = masterResourceSchema.safeParse(resource);
  if (!parsed.success) notFound();
  return <MasterResourceView companySlug={company} resource={parsed.data as MasterResource} />;
}
