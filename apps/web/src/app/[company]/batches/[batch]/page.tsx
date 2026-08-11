import { BatchDetailPage } from '@/modules/batches/batch-detail-page';

export default async function BatchDetail({
  params,
}: {
  params: Promise<{ batch: string }>;
}) {
  const { batch } = await params;
  return <BatchDetailPage batchId={batch} />;
}
