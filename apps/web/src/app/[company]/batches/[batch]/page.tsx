import { BatchDetailWorkspacePage } from '@/modules/farm-demo/batch-detail-page';

export default async function BatchDetail({
  params,
}: {
  params: Promise<{ batch: string }>;
}) {
  const { batch } = await params;
  return <BatchDetailWorkspacePage batchKey={batch} />;
}
