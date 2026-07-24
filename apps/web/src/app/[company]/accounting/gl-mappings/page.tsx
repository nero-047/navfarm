import { GlMappingsView } from '@/components/phase3/accounting';
export default async function GlMappingsPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  return <GlMappingsView companySlug={company} />;
}
