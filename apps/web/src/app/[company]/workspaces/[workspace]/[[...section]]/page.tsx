import { notFound } from 'next/navigation';
import { WorkspacePage, type WorkspacePageKind } from '@/modules/farm-demo/workspace-page';

const supported = new Set(['dashboard', 'batches', 'operations', 'quality', 'traceability', 'resources', 'reports', 'settings']);

export default async function CanonicalWorkspacePage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params;
  const kind = section?.[0] ?? 'dashboard';
  if (section && section.length > 1) notFound();
  if (kind === 'masters' || kind === 'costing') return <WorkspacePage kind={kind === 'costing' ? 'reports' : 'settings'} />;
  if (!supported.has(kind)) notFound();
  return <WorkspacePage kind={kind as WorkspacePageKind} />;
}
