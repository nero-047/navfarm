import { redirect } from 'next/navigation';
export default async function CompanyLobsPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  redirect(`/${company}/settings/business-structure?section=lobs`);
}
