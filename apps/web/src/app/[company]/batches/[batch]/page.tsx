import { LegacyOperationalRedirect } from '@/modules/workspaces/route-content';

export default async function BatchDetail({
  params,
}: {
  params: Promise<{ batch: string }>;
}) {
  const { batch } = await params;
  return <LegacyOperationalRedirect kind="batches" suffix={batch} />;
}
