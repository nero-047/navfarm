import { ChartOfAccountsView } from '@/components/phase3/accounting';
export default async function AccountDetailPage({ params }: { params: Promise<{ company: string; accountId: string }> }) {
  const { company, accountId } = await params;
  return <ChartOfAccountsView companySlug={company} accountId={accountId} />;
}
