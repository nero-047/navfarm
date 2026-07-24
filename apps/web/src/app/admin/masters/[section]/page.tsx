import { notFound } from 'next/navigation';
import { PlatformMastersView } from '@/components/phase3/platform-masters';

const sections = ['nobs', 'lobs', 'modules', 'reference-data'] as const;
export default async function PlatformMasterSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as (typeof sections)[number])) notFound();
  return <PlatformMastersView section={section as (typeof sections)[number]} />;
}
