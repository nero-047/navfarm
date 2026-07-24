import { redirect } from 'next/navigation';

export default async function TenantRootPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  redirect(`/admin/tenants/${tenantId}/overview`);
}
