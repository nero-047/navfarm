import { redirect } from 'next/navigation';

export default async function CompanyReadinessPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  redirect(`/${company}/accounting/readiness`);
}
