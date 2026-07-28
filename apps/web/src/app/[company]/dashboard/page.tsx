import { redirect } from 'next/navigation';

export default async function CompanyDashboardPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  redirect(`/${company}/overview`);
}
