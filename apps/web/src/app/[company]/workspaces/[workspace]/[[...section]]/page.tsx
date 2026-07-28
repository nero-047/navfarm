import { notFound } from 'next/navigation';
import { CanonicalWorkspaceContent } from '@/modules/workspaces/route-content';

const supported = new Set(['dashboard', 'batches', 'operations', 'quality', 'traceability', 'resources', 'reports', 'settings']);

export default async function CanonicalWorkspacePage({ params }: { params: Promise<{ workspace: string; section?: string[] }> }) {
  const { workspace, section } = await params;
  const kind = section?.[0] ?? 'dashboard';
  if (section && section.length > 1) notFound();
  if (!section) return <CanonicalWorkspaceContent workspaceSlug={workspace} />;
  if (kind === 'masters' || kind === 'costing') return <CanonicalWorkspaceContent workspaceSlug={workspace} section={kind} />;
  if (!supported.has(kind)) notFound();
  return <CanonicalWorkspaceContent workspaceSlug={workspace} section={kind} />;
}
