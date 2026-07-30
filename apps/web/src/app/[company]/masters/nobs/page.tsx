import { redirect } from 'next/navigation';
export default async function CompanyNobsPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  redirect(`/${company}/settings/business-structure?section=nobs`);
}
