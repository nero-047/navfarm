import { ChartOfAccountsView } from '@/components/phase3/accounting';
export default async function ChartPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  return <ChartOfAccountsView companySlug={company} />;
}
