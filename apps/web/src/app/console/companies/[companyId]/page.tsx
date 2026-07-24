import { TenantCompanyDetail } from '../../../../components/phase2/tenant-company-detail';

export default async function ConsoleCompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  return <TenantCompanyDetail companyId={companyId} />;
}
