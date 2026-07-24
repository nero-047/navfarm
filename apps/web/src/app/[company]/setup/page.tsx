import { redirect } from 'next/navigation';

export default async function CompanySetupRoot({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  redirect(`/${company}/setup/profile`);
}
