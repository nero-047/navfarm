import { CostingView } from '@/components/phase3/accounting';
export default async function CostingPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  return <CostingView companySlug={company} />;
}
