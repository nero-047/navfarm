import type { Metadata } from 'next';

interface Props {
  params: Promise<{ company: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company } = await params;
  return { title: `${company.replaceAll('-', ' ')} Dashboard - NAVFarm` };
}

export default async function CompanyDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  await params;

  return <>{children}</>;
}
