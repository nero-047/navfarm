import { AccountingReadinessView } from '@/components/phase3/accounting';
export default async function ReadinessPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  return <AccountingReadinessView companySlug={company} />;
}
