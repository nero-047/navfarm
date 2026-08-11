import { PublicTracePage } from '@/modules/traceability/public-trace-page';

export default async function TracePage({
  params,
}: {
  params: Promise<{ company: string; pack: string }>;
}) {
  const { company, pack } = await params;
  return (
    <PublicTracePage companySlug={company} packId={decodeURIComponent(pack)} />
  );
}
