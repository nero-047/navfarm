import { PlatformTenantDetail } from '../../../../../components/phase2/platform-tenant-detail';

export default async function TenantSubscriptionPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  return <PlatformTenantDetail tenantId={tenantId} section="subscription" />;
}
